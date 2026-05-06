# MCP Timekeeper

Monorepo inicial com API, Web e servidor MCP para controle de tempo.

## Seed inicial
O seed padrão cria:
- usuário admin
- projeto inicial UEG
- API key ativa para o admin (label padrão: mcp-default)

Variáveis de ambiente suportadas no seed:
- SEED_ADMIN_NAME (default: Administrador)
- SEED_ADMIN_EMAIL (default: admin@timekeeper.local)
- SEED_ADMIN_PASSWORD (default: Admin@123456)
- SEED_PROJECT_NAME (default: UEG)
- SEED_API_KEY_LABEL (default: mcp-default)

Comandos:
1) npm run -w @timekeeper/api migrate
2) npm run -w @timekeeper/api seed

Importante:
- A API key raw é exibida apenas no momento da criação. Guarde em local seguro.
- Reexecução do seed é idempotente para admin/projeto/chave por label (não duplica desnecessariamente).

## Docker
Subir API:
- docker compose up -d --build api

Inicializar banco e seed (com container da API já buildado):
- docker compose run --rm api sh -lc "node apps/api/dist/db/migrate.js && node apps/api/dist/db/seed.js"

Subir Web Angular:
- docker compose up -d --build web
- acesso: http://SEU_HOST:4200

Subir stack completa (API + MCP + Web):
- export TIMEKEEPER_MCP_API_KEY=***
- docker compose up -d --build
- API: http://SEU_HOST:3000
- MCP HTTP Stream: http://SEU_HOST:8080/mcp
- Web: http://SEU_HOST:4200

Observação Web/API:
- A Web usa apiBase padrão "/api".
- O Nginx da Web faz proxy interno /api -> http://api:3000, evitando CORS no uso padrão via Docker Compose.

Se ocorrer erro do better-sqlite3 com "ld-linux-x86-64.so.2" ou "ERR_DLOPEN_FAILED":
- docker compose down
- docker compose build --no-cache api
- docker compose up -d api

Motivo:
- a imagem da API foi ajustada para Debian (glibc) e o projeto agora usa .dockerignore para evitar sobrescrever node_modules do container com binários nativos do host.

## Scripts úteis
- scripts/dev-bootstrap.sh -> build local + migrate + seed
- scripts/init.sh -> migrate + seed no contexto /app

## Scripts npm (raiz)
- npm run bootstrap -> setup local (install/build/migrate/seed)
- npm run up -> sobe API via docker compose
- npm run up:web -> sobe apenas Web Angular
- npm run init:data -> roda migrate + seed no container API
- npm run up:all -> sobe API + MCP + Web (requer TIMEKEEPER_MCP_API_KEY em .env)
- npm run ps -> status dos containers
- npm run logs | logs:api | logs:mcp | logs:web -> logs
- npm run restart -> reinicia API, MCP e Web
- npm run down -> derruba ambiente

## Arquivos de operação
- .env.example -> variáveis-base para execução
- docs/03-checklist-producao-minima.md -> checklist de hardening/produção

## Configuração MCP remoto (HTTP Stream) nos principais LLMs
Cenário considerado:
- MCP rodando em Docker remoto
- Porta publicada (ex.: 8080)
- Endpoint HTTP Stream do MCP (ex.: http://SEU_HOST:8080/mcp)
- Autenticação via header com API key (ex.: x-api-key)

Importante:
- O servidor MCP deste projeto agora suporta HTTP Stream nativamente (além de stdio).
- No docker-compose padrão, o endpoint remoto fica em http://SEU_HOST:8080/mcp.

### 1) Claude Desktop
No arquivo de configuração de MCP, adicione um servidor HTTP:
{
  "mcpServers": {
    "timekeeper": {
      "transport": {
        "type": "http",
        "url": "http://SEU_HOST:8080/mcp",
        "headers": {
          "x-api-key": "SUA_API_KEY_MCP"
        }
      }
    }
  }
}

### 2) Cursor
Em Settings -> MCP (ou MCP Servers), adicione:
- Name: timekeeper
- Transport: HTTP
- URL: http://SEU_HOST:8080/mcp
- Header: x-api-key = SUA_API_KEY_MCP

### 3) VS Code (extensões/clients MCP compatíveis)
No bloco de servidores MCP da extensão cliente:
{
  "name": "timekeeper",
  "transport": "http",
  "url": "http://SEU_HOST:8080/mcp",
  "headers": {
    "x-api-key": "SUA_API_KEY_MCP"
  }
}

### 4) Open WebUI / clientes chat com suporte MCP
Adicionar servidor MCP remoto com:
- URL HTTP Stream: http://SEU_HOST:8080/mcp
- Auth header: x-api-key: SUA_API_KEY_MCP

### 5) ChatGPT/Gemini/Copilot (via cliente/ponte MCP)
Quando o produto não oferece cadastro MCP HTTP nativo, use um cliente/ponte MCP compatível e cadastre o endpoint remoto:
- URL: http://SEU_HOST:8080/mcp
- Header: x-api-key: SUA_API_KEY_MCP

## Checklist rápido de conectividade MCP remoto
1) Confirmar porta publicada no host remoto (ex.: 8080).
2) Confirmar endpoint MCP HTTP Stream acessível externamente.
3) Validar API key ativa no TimeKeeper (GET /auth/api-keys).
4) Testar tool simples (ex.: list_projects).
5) Testar fluxo principal:
   - "iniciar tarefa X no projeto Y" (auto-criação de tarefa se inexistente)
   - "terminar tarefa" (stop_active_task sem informar nome)
