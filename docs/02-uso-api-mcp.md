# TimeKeeper MCP-First — Guia de Uso (API + MCP)

## 1. Pré-requisitos
- Node 20+
- npm 9+

## 2. Bootstrap local
1) npm install
2) npm run -w @timekeeper/api build
3) npm run -w @timekeeper/api migrate
4) npm run -w @timekeeper/api seed
5) API: DATABASE_URL='file:/opt/data/workspace/mcp-timekeeper/apps/api/data/timekeeper.sqlite' API_PORT=3000 node apps/api/dist/main.js

## 3. Autenticação API
### Login
POST /auth/login
body:
{
  "email": "admin@timekeeper.local",
  "password": "Admin@123"
}

Retorno: accessToken (JWT)

### API Key
Com JWT:
- POST /auth/api-keys
- GET /auth/api-keys
- DELETE /auth/api-keys/:id

## 4. Fluxo de tempo (API)
Com Authorization: Bearer <token>

- POST /time/start
{
  "projectId": "prj_xxx",
  "taskId": "tsk_xxx",
  "note": "início"
}

- POST /time/stop
{
  "note": "fim"
}

- POST /time/manual-duration
{
  "projectId": "prj_xxx",
  "taskId": "tsk_xxx",
  "durationSeconds": 1800
}

- POST /time/manual-range
{
  "projectId": "prj_xxx",
  "taskId": "tsk_xxx",
  "startedAt": "2026-05-06T09:00:00.000Z",
  "endedAt": "2026-05-06T10:30:00.000Z"
}

- GET /time/active
- GET /time/entries?from=2026-01-01&to=2026-12-31

## 5. Relatórios
- GET /reports/projects?from=YYYY-MM-DD&to=YYYY-MM-DD
- GET /reports/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
- GET /admin/reports/projects?... (admin)
- GET /admin/reports/tasks?... (admin)

## 6. Auditoria
- GET /audit?limit=200 (admin)
Filtros: action, entity, actorUserId, from, to.

## 7. MCP Server
Variáveis:
- TIMEKEEPER_API_BASE_URL=http://127.0.0.1:3000
- TIMEKEEPER_MCP_API_KEY=<api_key_do_usuario>
- MCP_TRANSPORT=http (ou stdio)
- MCP_HTTP_PORT=8080
- MCP_HTTP_PATH=/mcp

Executar (HTTP Stream nativo):
- npm run -w @timekeeper/mcp-server build
- MCP_TRANSPORT=http MCP_HTTP_PORT=8080 MCP_HTTP_PATH=/mcp TIMEKEEPER_API_BASE_URL='http://127.0.0.1:3000' TIMEKEEPER_MCP_API_KEY='<key>' node apps/mcp/dist/main.js

Endpoint remoto:
- http://SEU_HOST:8080/mcp?apiKey=SUA_CHAVE_AQUI
  (Ou envie via header `x-api-key`)

Tools disponíveis:
- llm_usage_guide
- list_projects
- list_tasks
- create_task
- start_task
- stop_active_task
- get_active_task
- log_time_manual
- report_project
- report_task
- report_summary

## 8. Fluxo LLM recomendado
Pedido: "iniciar tarefa X no projeto Y"
1) MCP resolve projeto por nome/ID
2) MCP busca tarefa no projeto
3) Se não existir, MCP cria tarefa
4) MCP inicia tarefa

Pedido: "terminar tarefa"
1) MCP chama stop_active_task sem solicitar nome da tarefa

## 9. Docker
- docker compose up -d --build
  (O comando de inicialização já executa migrações e seeds automaticamente)

Endpoints padrão:
- API: http://SEU_HOST:8030
- Web: http://SEU_HOST:8040
- MCP HTTP Stream: http://SEU_HOST:8080/mcp

Web em Docker Compose:
- apiBase padrão no frontend: /api
- proxy interno no Nginx: /api -> http://api:3000
- resultado: chamadas Web->API sem CORS no cenário padrão

Se ocorrer erro do better-sqlite3 com "ld-linux-x86-64.so.2"/"ERR_DLOPEN_FAILED":
- docker compose down
- docker compose build --no-cache api
- docker compose up -d api

Motivo técnico:
- runtime da API padronizado em Debian (glibc) + .dockerignore para impedir cópia de node_modules do host para dentro da imagem.