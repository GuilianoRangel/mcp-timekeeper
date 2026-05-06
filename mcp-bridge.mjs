import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const EventSource = require("eventsource");

const LOG_FILE = "/tmp/mcp-bridge.log";
function log(msg) {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

if (!global.EventSource) {
  global.EventSource = EventSource;
}

async function runBridge() {
  const url = process.env.MCP_URL || "http://localhost:8080/mcp";
  const apiKey = process.env.X_API_KEY;

  log(`Iniciando ponte para: ${url}`);

  const transport = new SSEClientTransport(new URL(url), {
    eventSourceInit: {
      headers: { 
        "x-api-key": apiKey,
        "Accept": "text/event-stream"
      }
    }
  });

  const client = new Client({ name: "bridge-client", version: "1.0.0" }, { capabilities: {} });
  
  try {
    log("Conectando ao cliente SSE...");
    await client.connect(transport);
    log("Cliente SSE conectado!");

    log("Listando ferramentas...");
    const { tools } = await client.listTools();
    log(`${tools.length} ferramentas encontradas.`);

    const server = new Server(
      { name: "timekeeper-bridge", version: "1.0.0" }, 
      { capabilities: { tools: {} } }
    );

    // Register list tools handler - returns the tools from the remote server
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Register call tool handler - proxies tool calls to the remote server
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      log(`Chamando ferramenta: ${name}`);
      const result = await client.callTool({ name, arguments: args });
      return result;
    });

    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    log("Servidor Stdio conectado e pronto.");
    
  } catch (err) {
    log(`ERRO: ${err.message}`);
    process.exit(1);
  }
}

runBridge().catch(err => {
  log(`FALHA FATAL: ${err.stack}`);
  process.exit(1);
});
