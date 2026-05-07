# Guia de Manutenção - MCP Timekeeper (Caliandra)

Este documento contém informações críticas para a manutenção e evolução do projeto, servindo como memória técnica para agentes de IA e desenvolvedores.

## 🏗️ Arquitetura do Sistema
O projeto é um monorepo organizado da seguinte forma:
- **`apps/api`**: Backend Fastify (Node.js) com SQLite (`better-sqlite3`).
- **`apps/web`**: Frontend Angular 18+ focado em performance (Signals, Vanilla CSS).
- **`apps/mcp`**: Servidor MCP (Model Context Protocol) com transporte SSE nativo.
- **`packages/shared`**: Tipagens e utilitários compartilhados entre os apps.

## ⚙️ Configuração de Ambiente (NVM)
Para garantir que o Node.js está disponível no terminal (caso não esteja no PATH padrão), utilize os comandos abaixo:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 # Ou a versão recomendada para o projeto
```

## 💾 Persistência e Dados
- **Banco de Dados**: SQLite localizado em `data/timekeeper.sqlite`.
- **Migrações**: Localizadas em `apps/api/migrations`. Novas colunas ou tabelas devem ser adicionadas como arquivos `.sql` numerados.
- **Seed**: O script `apps/api/src/db/seed.ts` gerencia o estado inicial (admin, projeto padrão, API keys).

## 🛠️ Funcionalidades Chave
1. **Metas Semanais**: Implementada em Maio/2026. Permite definir horas/semana por usuário.
2. **Dashboard Real-time**: Utiliza Angular Signals para calcular progresso acumulado + tempo da tarefa ativa sem refresh.
3. **Gestão Admin**: Permite editar usuários (exceto e-mail) e revogar acessos via exclusão lógica (`is_active`).
4. **Integração MCP**: Suporta conexão via header `x-api-key` ou parâmetro `?apiKey=` na URL do SSE.

## 🚀 Deploy e Operação
- **Desenvolvimento Local**: `docker-compose.yml` (portas 8030 API, 8040 Web).
- **Produção (VPS/Dokploy)**: `docker-compose-vps.yml`. Utiliza labels Traefik para roteamento de subdomínios (`*.app.guiliano.com.br`) e rede externa `dokploy-network`.
- **Bootstrap**: `npm run bootstrap` executa install, build, migrate e seed.

## 🔐 Segurança
- **Autenticação**: JWT para a web, API Keys para o MCP.
- **Credenciais de Seed**:
  - Usuário: `admin@timekeeper.local`
  - Senha: `Admin@123`
- **Importante**: Nunca reexponha a senha `W#lc0m3Server` (antiga senha vazada no histórico).

## 📝 Padrões de Código
- **Estilo**: CSS Vanilla (evitar frameworks de utilitários como Tailwind, a menos que solicitado).
- **Iconografia**: Lucide Angular.
- **Componentes**: Focar em componentes reativos baseados em Signals.
- **API**: Seguir o padrão de rotas modulares em `apps/api/src/modules`.

---
*Última atualização: 07 de Maio de 2026*
