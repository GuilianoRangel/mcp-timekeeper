import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
// @ts-ignore
import express from 'express';
// @ts-ignore
import cors from 'cors';
import { randomUUID } from 'node:crypto';

const API_BASE_URL = process.env.TIMEKEEPER_API_BASE_URL ?? 'http://api:3000';
const MCP_HTTP_PORT = Number(process.env.MCP_HTTP_PORT ?? '8080');

/**
 * Funções auxiliares para chamadas de API com chave específica
 */
async function apiCall(apiKey: string, path: string, init?: any) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      ...(init?.headers ?? {})
    }
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${data?.message ?? text}`);
  }
  return data;
}

async function resolveProject(apiKey: string, project: string) {
  const projects = await apiCall(apiKey, '/projects');
  const byId = projects.find((p: any) => p.id === project);
  if (byId) return byId;
  const byName = projects.find((p: any) => String(p.name).toLowerCase() === project.toLowerCase());
  if (byName) return byName;
  throw new Error(`Projeto não encontrado: ${project}`);
}

async function resolveOrCreateTask(apiKey: string, projectId: string, task: string) {
  const tasks = await apiCall(apiKey, `/tasks?projectId=${encodeURIComponent(projectId)}`);
  const byId = tasks.find((t: any) => t.id === task);
  if (byId) return byId;
  const byName = tasks.find((t: any) => String(t.name).toLowerCase() === task.toLowerCase());
  if (byName) return byName;

  const created = await apiCall(apiKey, '/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId, name: task })
  });
  return created;
}

/**
 * Constrói o servidor MCP para uma chave específica
 */
function buildServer(apiKey: string) {
  const server = new McpServer({
    name: 'timekeeper-mcp-server',
    version: '0.2.1'
  });

  server.registerTool(
    'llm_usage_guide',
    {
      title: 'Guia de uso para LLM',
      description: 'Retorna instruções de orquestração: ao iniciar tarefa, resolver projeto, localizar tarefa e auto-criar se não existir.',
      inputSchema: {}
    },
    async () => ({
      content: [{
        type: 'text',
        text: [
          '# Guia de Orquestração do TimeKeeper',
          '',
          '## Fluxo de Trabalho Recomendado:',
          '1. **Resolução de Contexto**: Ao receber pedidos como "iniciar tarefa X no projeto Y", você deve primeiro localizar o projeto pelo nome e depois a tarefa. Se a tarefa não existir, utilize a ferramenta `create_task` ou deixe que `start_task` a crie automaticamente.',
          '2. **Início de Atividade**: Utilize `start_task` sempre com os IDs resolvidos para garantir precisão.',
          '3. **Finalização**: Para pedidos de "parar", "encerrar" ou "finalizar", utilize `stop_active_task`. Não é necessário perguntar qual tarefa, pois o sistema identifica a sessão ativa do seu usuário.',
          '4. **Lançamentos Manuais**: Se o usuário informar uma duração (ex: "trabalhei 2 horas"), use `log_time_manual` com `durationSeconds`.',
          '',
          '## Diretrizes de Comunicação com o Usuário:',
          '- **Evite IDs**: Nunca exiba IDs internos (ex: `prj_...` ou `key_...`) para o usuário final, a menos que solicitado explicitamente.',
          '- **Use Nomes**: Refira-se sempre aos projetos e tarefas pelos seus nomes amigáveis.',
          '- **Confirmações Claras**: Ao realizar uma ação, confirme de forma elegante. Ex: "✅ Entendido! Iniciei a tarefa **Desenvolvimento de UI** no projeto **Heron** agora mesmo."',
          '- **Relatórios**: Ao apresentar relatórios, utilize tabelas Markdown para facilitar a leitura do tempo gasto.',
          '- **Tarefa Ativa**: Ao informar sobre uma tarefa ativa (`get_active_task`), calcule o tempo decorrido desde o início e apresente no formato **hh:mm:ss** (ex: 01:15:30) ou **mm:ss** (ex: 45:10) caso tenha menos de uma hora.',
          '- **Proatividade**: Se o usuário pedir para iniciar algo e houver uma tarefa ativa diferente, o sistema a encerrará automaticamente antes de iniciar a nova. Informe isso ao usuário se considerar relevante.'
        ].join('\n')
      }]
    })
  );

  server.registerTool('list_projects', {
    title: 'Listar projetos',
    description: 'Lista projetos disponíveis',
    inputSchema: {}
  }, async () => {
    const projects = await apiCall(apiKey, '/projects');
    return { content: [{ type: 'text', text: JSON.stringify(projects) }] };
  });

  server.registerTool('list_tasks', {
    title: 'Listar tarefas',
    description: 'Lista tarefas, opcionalmente filtrando por projeto',
    inputSchema: { project: z.string().optional() }
  }, async ({ project }) => {
    if (!project) {
      const tasks = await apiCall(apiKey, '/tasks');
      return { content: [{ type: 'text', text: JSON.stringify(tasks) }] };
    }
    const p = await resolveProject(apiKey, project);
    const tasks = await apiCall(apiKey, `/tasks?projectId=${encodeURIComponent(p.id)}`);
    return { content: [{ type: 'text', text: JSON.stringify(tasks) }] };
  });

  server.registerTool('start_task', {
    title: 'Iniciar tarefa',
    description: 'Inicia tarefa. Se tarefa não existir no projeto, cria automaticamente.',
    inputSchema: {
      project: z.string().describe('ID ou nome do projeto'),
      task: z.string().describe('ID ou nome da tarefa'),
      note: z.string().optional()
    }
  }, async ({ project, task, note }) => {
    const p = await resolveProject(apiKey, project);
    const t = await resolveOrCreateTask(apiKey, p.id, task);
    const started = await apiCall(apiKey, '/time/start', {
      method: 'POST',
      body: JSON.stringify({ projectId: p.id, taskId: t.id, note })
    });
    return { content: [{ type: 'text', text: JSON.stringify({ project: p, task: t, started }) }] };
  });

  server.registerTool('stop_active_task', {
    title: 'Finalizar tarefa ativa',
    description: 'Finaliza a tarefa ativa do usuário da API key sem precisar informar tarefa.',
    inputSchema: { note: z.string().optional() }
  }, async ({ note }) => {
    const stopped = await apiCall(apiKey, '/time/stop', { method: 'POST', body: JSON.stringify({ note }) });
    return { content: [{ type: 'text', text: JSON.stringify(stopped) }] };
  });

  server.registerTool('get_active_task', {
    title: 'Obter tarefa ativa',
    description: 'Retorna sessão ativa atual do usuário da API key',
    inputSchema: {}
  }, async () => {
    const active = await apiCall(apiKey, '/time/active');
    return { content: [{ type: 'text', text: JSON.stringify(active) }] };
  });

  server.registerTool('log_time_manual', {
    title: 'Lançar tempo manual',
    description: 'Lança tempo manual por duração (seconds) ou por intervalo (startedAt/endedAt).',
    inputSchema: {
      project: z.string(),
      task: z.string(),
      durationSeconds: z.number().positive().optional(),
      startedAt: z.string().optional(),
      endedAt: z.string().optional(),
      note: z.string().optional()
    }
  }, async (args: any) => {
    const p = await resolveProject(apiKey, args.project);
    const t = await resolveOrCreateTask(apiKey, p.id, args.task);

    if (args.durationSeconds) {
      const out = await apiCall(apiKey, '/time/manual-duration', {
        method: 'POST',
        body: JSON.stringify({ projectId: p.id, taskId: t.id, durationSeconds: args.durationSeconds, note: args.note })
      });
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }

    if (args.startedAt && args.endedAt) {
      const out = await apiCall(apiKey, '/time/manual-range', {
        method: 'POST',
        body: JSON.stringify({ projectId: p.id, taskId: t.id, startedAt: args.startedAt, endedAt: args.endedAt, note: args.note })
      });
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }

    throw new Error('Informe durationSeconds OU startedAt+endedAt');
  });

  server.registerTool('report_project', {
    title: 'Relatório por projeto',
    description: 'Relatório semanal e total por projeto com filtro de datas',
    inputSchema: { from: z.string().optional(), to: z.string().optional(), projectId: z.string().optional() }
  }, async ({ from, to, projectId }) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (projectId) qs.set('projectId', projectId);
    const out = await apiCall(apiKey, `/reports/projects?${qs.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(out) }] };
  });

  server.registerTool('report_task', {
    title: 'Relatório por tarefa',
    description: 'Relatório semanal e total por tarefa com filtro de datas',
    inputSchema: { from: z.string().optional(), to: z.string().optional(), projectId: z.string().optional(), taskId: z.string().optional() }
  }, async ({ from, to, projectId, taskId }) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (projectId) qs.set('projectId', projectId);
    if (taskId) qs.set('taskId', taskId);
    const out = await apiCall(apiKey, `/reports/tasks?${qs.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(out) }] };
  });

  server.registerTool('create_task', {
    title: 'Criar tarefa',
    description: 'Cria uma nova tarefa em um projeto existente',
    inputSchema: { project: z.string(), task: z.string(), description: z.string().optional() }
  }, async ({ project, task, description }) => {
    const p = await resolveProject(apiKey, project);
    const out = await apiCall(apiKey, '/tasks', { method: 'POST', body: JSON.stringify({ projectId: p.id, name: task, description }) });
    return { content: [{ type: 'text', text: JSON.stringify(out) }] };
  });

  server.registerTool('report_summary', {
    title: 'Resumo geral',
    description: 'Retorna resumo por projeto e por tarefa no intervalo informado',
    inputSchema: { from: z.string().optional(), to: z.string().optional() }
  }, async ({ from, to }) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const byProject = await apiCall(apiKey, `/reports/projects?${qs.toString()}`);
    const byTask = await apiCall(apiKey, `/reports/tasks?${qs.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify({ byProject, byTask }) }] };
  });

  return server;
}

const app = express();
app.use(cors());
app.use(express.json());

// ── Legacy SSE sessions ──
const sseSessions = new Map<string, SSEServerTransport>();

// ── Streamable HTTP sessions ──
const streamableSessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', service: 'mcp' });
});

// ══════════════════════════════════════════════════════════════
//  Streamable HTTP transport (POST/GET/DELETE em /mcp)
//  Usado pelo Antigravity e clientes modernos
// ══════════════════════════════════════════════════════════════

function extractApiKey(req: any): string | undefined {
  return (req.query.apiKey as string) || (req.headers['x-api-key'] as string);
}

// Rota unificada /mcp – Streamable HTTP (POST/GET/DELETE)
app.all('/mcp', async (req: any, res: any, next: any) => {
  const method = req.method.toUpperCase();

  if (method === 'POST') {
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      console.error('[MCP Streamable] Tentativa de conexão sem API Key');
      return res.status(401).json({ error: 'API Key is required via query param ?apiKey=... or header x-api-key' });
    }

    // Verifica se já existe uma sessão ativa (via header mcp-session-id)
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && streamableSessions.has(sessionId)) {
      const { transport } = streamableSessions.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Sem sessão ou sessão desconhecida: cria novo transport + server
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = buildServer(apiKey);

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        console.error(`[MCP Streamable] Sessão encerrada: ${sid}`);
        streamableSessions.delete(sid);
      }
    };

    await server.connect(transport);

    const newSessionId = transport.sessionId;
    if (newSessionId) {
      console.error(`[MCP Streamable] Nova sessão criada: ${newSessionId}`);
      streamableSessions.set(newSessionId, { transport, server });
    }

    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (method === 'GET') {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !streamableSessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing mcp-session-id header' });
      return;
    }
    const { transport } = streamableSessions.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  if (method === 'DELETE') {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !streamableSessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing mcp-session-id header' });
      return;
    }
    const { transport } = streamableSessions.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  // Método não suportado
  res.status(405).json({ error: 'Method not allowed' });
});


// ══════════════════════════════════════════════════════════════
//  Legacy SSE transport (GET /mcp/sse + POST /mcp/messages)
//  Mantido para compatibilidade com clientes SSE antigos
// ══════════════════════════════════════════════════════════════

app.get('/mcp/sse', async (req: any, res: any) => {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    console.error('[MCP SSE] Tentativa de conexão sem API Key');
    return res.status(401).send('API Key is required via query param ?apiKey=... or header x-api-key');
  }

  const transport = new SSEServerTransport('/mcp/messages', res);
  const sessionId = transport.sessionId;

  console.error(`[MCP SSE] Nova conexão SSE (Session: ${sessionId})`);
  sseSessions.set(sessionId, transport);

  const server = buildServer(apiKey);
  await server.connect(transport);

  req.on('close', () => {
    console.error(`[MCP SSE] Conexão fechada (Session: ${sessionId})`);
    sseSessions.delete(sessionId);
  });
});

app.post('/mcp/messages', async (req: any, res: any) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseSessions.get(sessionId);

  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    console.error(`[MCP SSE] Mensagem para sessão inexistente: ${sessionId}`);
    res.status(400).send('No active session');
  }
});

app.listen(MCP_HTTP_PORT, () => {
  console.error(`MCP HTTP rodando em :${MCP_HTTP_PORT}`);
  console.error(`  Streamable HTTP: POST/GET/DELETE /mcp`);
  console.error(`  Legacy SSE:      GET /mcp/sse + POST /mcp/messages`);
});
