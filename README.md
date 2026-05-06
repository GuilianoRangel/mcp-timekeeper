# MCP Timekeeper

Monorepo com API, Web e servidor MCP para controle de tempo profissional com suporte a metas semanais e gestão administrativa.

## 🚀 Novidades: Metas Semanais
Agora o TimeKeeper suporta a definição de metas semanais por usuário. O Dashboard exibe o progresso em tempo real, incluindo o tempo da tarefa ativa, e calcula o saldo restante para atingir o objetivo.

## Seed inicial
O seed padrão cria:
- usuário admin
- projeto inicial Caliandra
- API key ativa para o admin (label padrão: mcp-default)

Variáveis de ambiente suportadas no seed:
- SEED_ADMIN_NAME (default: Administrador)
- SEED_ADMIN_EMAIL (default: admin@timekeeper)
- SEED_ADMIN_PASSWORD (default: Admin@123)
- SEED_PROJECT_NAME (default: Caliandra)
- SEED_API_KEY_LABEL (default: mcp-default)

Comandos:
1) npm run -w @timekeeper/api migrate
2) npm run -w @timekeeper/api seed

Importante:
- A API key raw é exibida apenas no momento da criação. Guarde em local seguro.
- Reexecução do seed é idempotente para admin/projeto/chave por label.

## Docker
Subir stack completa (API + MCP + Web):
- export TIMEKEEPER_MCP_API_KEY=***
- docker compose up -d --build
- API: http://SEU_HOST:8030
- Web: http://SEU_HOST:8040
- MCP HTTP Stream: http://SEU_HOST:8080/mcp

Observação Web/API:
- A Web usa proxy interno /api -> http://api:3000, evitando CORS no uso padrão via Docker Compose.

## Documentação Detalhada
Para mais detalhes técnicos e guias específicos:
- [01-requisitos-v1.md](docs/01-requisitos-v1.md)
- [02-uso-api-mcp.md](docs/02-uso-api-mcp.md)
- [03-checklist-producao-minima.md](docs/03-checklist-producao-minima.md)
- [04-status-projeto-v1.md](docs/04-status-projeto-v1.md)
- [05-metas-semanais-dashboard.md](docs/05-metas-semanais-dashboard.md)

## Scripts npm (raiz)
- npm run bootstrap -> setup local (install/build/migrate/seed)
- npm run up -> sobe API via docker compose
- npm run up:web -> sobe apenas Web Angular
- npm run init:data -> roda migrate + seed no container API
- npm run up:all -> sobe API + MCP + Web
- npm run ps -> status dos containers
- npm run logs -> exibe logs de todos os serviços

## Configuração MCP remoto (HTTP Stream)
O servidor MCP deste projeto suporta HTTP Stream nativamente. No docker-compose padrão, o endpoint remoto fica em `http://SEU_HOST:8080/mcp`.

### Exemplo Claude Desktop / Cursor:
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

