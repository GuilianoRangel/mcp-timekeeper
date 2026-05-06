# TimeKeeper MCP-First — Documento de Requisitos v1

## 1. Visão Geral
Aplicação simples para controle de tempo gasto em projetos e tarefas, com abordagem MCP-first, interface web em PT-BR e API REST, executando em Docker.

Objetivos principais:
- Identificar projeto e tarefa
- Iniciar uma tarefa e registrar início automaticamente
- Finalizar tarefa ativa e registrar término + duração
- Lançar tempo manual sem sessão start/stop
- Consultar relatórios por projeto e tarefa com quebra semanal e total geral
- Filtrar por intervalo de datas

## 2. Arquitetura
- Backend: Node.js + TypeScript
- Frontend: Angular (PT-BR)
- Banco: SQLite
- Integração: Servidor MCP expondo tools de todo o sistema
- Execução: Dockerfile + docker-compose + scripts de inicialização e seed

Princípio: MCP-first com interface web. A API REST atende frontend e integrações.

## 3. Idioma e Convenções
- Domínio interno (código/campos): inglês
- Interface de usuário: português (PT-BR)
- Timezone fixo: America/Sao_Paulo

## 4. Autenticação e Acesso
### 4.1 Perfis
- user
- admin

### 4.2 Diferença de perfis
- Somente admin pode criar usuários.
- Demais recursos funcionais (tempo, projetos, tarefas, relatórios) disponíveis conforme regras de negócio e autenticação.

### 4.3 Mecanismos
- Web/API: JWT
- MCP: API Key por usuário (rastreabilidade total)

## 5. Regras de Tempo
### 5.1 Sessão automática (start/stop)
- Um usuário pode ter no máximo 1 tarefa ativa por vez.
- Ao iniciar uma tarefa:
  - validar projeto e tarefa
  - registrar horário de início
- Ao finalizar:
  - encerrar a tarefa ativa do usuário
  - registrar término e duração
- Se já houver tarefa ativa e o usuário tentar iniciar outra:
  - bloquear operação e exigir stop explícito.

### 5.2 Lançamento manual
Aceitar dois modos:
1) Duração direta (ex.: 1h30)
2) Início/fim retroativos

## 6. Comportamento MCP para criação automática de tarefa
Quando o usuário pedir ao LLM algo como:
- “iniciar tarefa X no projeto Y”

O fluxo esperado no MCP:
1) Resolver projeto Y
2) Buscar tarefa X no projeto Y
3) Se não existir, criar tarefa X automaticamente
4) Iniciar tarefa X
5) Retornar confirmação com timestamps e IDs

Observação: o servidor MCP deve incluir instruções (prompts orientativos de tool usage) para guiar o LLM nesse fluxo de forma consistente e idempotente.

## 7. Relatórios
Obrigatórios na v1:
- Por projeto
- Por tarefa
- Quebra por semana
- Total geral
- Filtro por intervalo de datas

## 8. Auditoria
Todas as ações relevantes devem registrar trilha de auditoria:
- criação/edição/exclusão de projeto/tarefa
- start/stop
- lançamentos manuais
- edições/exclusões de apontamentos
- criação de usuário (admin)

Campos mínimos de auditoria:
- actor_id
- actor_type (jwt_user | api_key)
- action
- entity
- entity_id
- before/after (quando aplicável)
- source (web | api | mcp)
- timestamp

## 9. Janela de edição retroativa
- Limite de 30 dias para edição/ajuste
- Valor configurável por variável de ambiente (ex.: EDIT_WINDOW_DAYS=30)

## 10. Persistência (SQLite)
Entidades mínimas:
- users
- projects
- tasks
- task_sessions
- time_entries
- api_keys
- audit_logs

## 11. Entregáveis Técnicos
- Monorepo com backend, frontend e mcp-server
- Dockerfile(s)
- docker-compose.yml
- script de inicialização
- script de seed com projeto inicial “UEG”
- script de seed com usuário admin inicial (parametrizável por variáveis de ambiente)
- documentação operacional (web/api/mcp)

### 11.1 Seed obrigatório (v1)
O processo de seed deve criar ao menos:
- 1 usuário admin inicial
- 1 projeto inicial (default: UEG)
- 1 API key ativa vinculada ao admin (para uso MCP)

Variáveis mínimas recomendadas:
- SEED_ADMIN_NAME
- SEED_ADMIN_EMAIL
- SEED_ADMIN_PASSWORD
- SEED_PROJECT_NAME
- SEED_API_KEY_LABEL

## 12. Critérios de aceite v1
- Login JWT funcional
- API Key por usuário funcional no MCP
- Regra de 1 tarefa ativa por usuário garantida
- Início/fim com cálculo de duração correto
- Lançamento manual nos dois modos funcional
- Criação automática de tarefa via fluxo MCP ao iniciar tarefa inexistente
- Relatórios por projeto/tarefa com quebra semanal e filtro por data
- Auditoria de ações relevantes
- Subida completa em Docker Compose
- Seed inicial com projeto “UEG” e usuário admin configurável por ambiente