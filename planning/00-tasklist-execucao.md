# Tasklist de Execução — TimeKeeper MCP-First

Status legend:
- [ ] pendente
- [~] em andamento
- [x] concluído
- [!] bloqueado

## Fase 1 — Fundação
- [x] Consolidar requisitos funcionais e não funcionais
- [x] Definir estrutura de monorepo (apps/services/packages)
- [x] Inicializar backend Node.js (TypeScript)
- [x] Inicializar frontend Angular (PT-BR)
- [x] Inicializar servidor MCP

## Fase 2 — Dados e Segurança
- [x] Modelar SQLite + migrations
- [x] Implementar users + perfis (admin/user)
- [x] Implementar JWT (web/api)
- [x] Implementar API Keys por usuário (MCP)
- [x] Implementar política de janela retroativa por env (EDIT_WINDOW_DAYS)

## Fase 3 — Regras de Tempo
- [x] Implementar start task (1 ativa por usuário)
- [x] Implementar stop task ativa sem exigir task name
- [x] Implementar lançamento manual por duração
- [x] Implementar lançamento manual por início/fim
- [x] Implementar bloqueio de start quando já existe tarefa ativa

## Fase 4 — Projetos, Tarefas e Automação MCP
- [x] CRUD de projetos
- [x] CRUD de tarefas
- [x] Fluxo MCP: iniciar tarefa com auto-criação se inexistente
- [x] Instruções de uso para LLM no MCP (tool guidance)

## Fase 5 — Relatórios e Auditoria
- [x] Relatório por projeto com quebra semanal
- [x] Relatório por tarefa com quebra semanal
- [x] Totalização geral + filtros por intervalo
- [x] Trilha de auditoria completa

## Fase 6 — Entrega e Operação
- [x] Dockerfile(s)
- [x] docker-compose.yml
- [x] Script de inicialização
- [x] Seed inicial (projeto UEG)
- [x] Testes essenciais (unit + integração)
- [x] Documentação final de uso (Web/API/MCP)

## Notas de governança
- Somente admin cria usuário.
- Timezone fixo: America/Sao_Paulo.
- Idioma interno em inglês; interface PT-BR.
- Toda edição relevante auditada.
