# Status Atual do Projeto — TimeKeeper (Maio/2026)

Este documento resume o progresso recente, as funcionalidades implementadas e o estado atual da arquitetura do sistema.

## 🚀 Funcionalidades Recentes (Sprint Atual)

### 1. Gestão de Ciclo de Vida e Segurança
- **Filtros de Inatividade**: Implementado filtro universal `includeInactive` em Projetos, Tarefas, Usuários e Chaves de API. Por padrão, itens inativos/revogados são ocultados para uma interface administrativa mais limpa.
- **Soft-Delete de Usuários**: Implementada a exclusão lógica de usuários (`is_active = 0`) com registro completo em trilha de auditoria.
- **Segurança de Login**: Removida a pré-inicialização de credenciais padrão na tela de login e atualização de placeholders para um padrão mais profissional.

### 2. Infraestrutura e Automação
- **Docker Auto-Init**: O `docker-compose.yml` agora gerencia automaticamente as migrações SQL e o seeding inicial do banco de dados ao subir o serviço de API.
- **Fuso Horário (Timezone)**: Correção crítica na conversão de datas UTC para o fuso horário local (`America/Sao_Paulo`) na tela de rastreamento de tempo, garantindo que o que o usuário vê na lista seja o mesmo que ele edita no modal.

### 3. Ecossistema MCP (Model Context Protocol)
- **Suporte Multissessão**: O servidor MCP foi refatorado para suportar múltiplas conexões simultâneas de diferentes usuários.
- **Chaves de API Dinâmicas**: Agora é possível passar a `apiKey` via parâmetro de busca (`?apiKey=...`) na conexão SSE do MCP, permitindo que cada cliente utilize sua própria credencial sem alterar o `.env` do servidor.
- **Guia de Orquestração Inteligente**: Atualizado o prompt interno do MCP (`llm_usage_guide`) para orientar o LLM a:
  - Evitar exibição de IDs técnicos.
  - Usar nomes amigáveis.
  - Formatar tempo decorrido no padrão `hh:mm:ss` ou `mm:ss`.

### 4. Metas Semanais e Dashboard (Novo)
- **Definição de Metas**: Implementada funcionalidade de meta semanal de horas por usuário (padrão: 10h).
- **Gestão Administrativa**: Administradores agora podem editar usuários (nome, cargo, senha e meta), com restrição de alteração de e-mail para preservação da identidade.
- **Visualização de Progresso**: Dashboard renovado com barra de progresso dinâmica e cálculo de "Saldo Restante" para atingir a meta semanal.
- **Totais em Tempo Real**: Os contadores de hoje e da semana agora consideram o tempo decorrido da tarefa ativa sem necessidade de refresh.

## 🛠️ Arquitetura Técnica
- **Backend**: Fastify + better-sqlite3 (Migração 002 aplicada para metas).
- **Frontend**: Angular 18+ com Signals, Lucide Icons e Pipes customizados para duração.
- **MCP**: Protocolo SSE (Server-Sent Events) para integração com assistentes de IA.
- **Persistência**: SQLite em volume Docker persistente.

## 📋 Próximos Passos
- [ ] Implementar exportação de relatórios em CSV/PDF.
- [ ] Adicionar gráficos de produtividade (Burn-down semanal) no Dashboard.
- [ ] Implementar notificações push para lembrete de tarefa ativa.
- [ ] Refinar as permissões de acesso (RBAC) para diferentes níveis de usuário.

---
*Atualizado em: 06 de Maio de 2026 (v1.1)*
