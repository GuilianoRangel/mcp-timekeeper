import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const EventSource = require("eventsource");
global.EventSource = EventSource;

async function test() {
  const url = "http://localhost:8080/mcp";
  const apiKey = "tk_ux1m4mhksim5ejrgxf65zht2_yicb3pb9jcu3pnrkrfp92c16";

  console.log("Conectando ao MCP...");
  const transport = new SSEClientTransport(new URL(url), {
    eventSourceInit: { headers: { "x-api-key": apiKey } }
  });
  const client = new Client({ name: "test" }, { capabilities: {} });
  
  await client.connect(transport);
  console.log("Conectado! Listando ferramentas...");
  const { tools } = await client.listTools();
  console.log("Ferramentas:", tools.map(t => t.name));
  process.exit(0);
}

test().catch(err => {
  console.error("Erro no teste:", err);
  process.exit(1);
});
