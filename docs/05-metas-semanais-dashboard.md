# Implementação: Metas Semanais e Dashboard

Este documento detalha a implementação da funcionalidade de metas semanais, introduzida em Maio/2026.

## 🎯 Objetivo
Permitir que cada usuário tenha uma meta de horas de trabalho definida para a semana, e que possa acompanhar visualmente seu progresso através de um dashboard intuitivo.

## 🛠️ Detalhes Técnicos

### 1. Banco de Dados
- **Tabela**: `users`
- **Coluna**: `weekly_goal_seconds` (INTEGER)
- **Padrão**: `36000` (equivalente a 10 horas)
- **Migração**: `002_add_user_goal.sql`

### 2. Backend (API)
- **Schema**: Atualizado o schema de usuário para incluir a meta.
- **Endpoints**:
  - `PUT /users/:id`: Novo endpoint administrativo para atualizar dados do usuário, incluindo a meta semanal.
- **Segurança**: Bloqueada a alteração do campo `email` para garantir a integridade da conta e dos logs de auditoria.

### 3. Frontend (Angular)
- **Gestão de Usuários**: Adicionado campo numérico (em horas) na tela de administração. O sistema converte automaticamente para segundos antes de enviar para a API.
- **Dashboard**:
  - Implementação de `signals` e `computed` para cálculos de progresso em tempo real.
  - O cálculo do progresso semanal (`weeklyPercent`) considera todas as entradas da semana atual (desde segunda-feira) somadas ao tempo decorrido da tarefa ativa, se houver.
  - Feedback visual: O saldo restante muda de cor e exibe uma mensagem de celebração ("Meta batida! 🎉") ao atingir o objetivo.

## 🚀 Como Usar

### Definindo Metas (Admin)
1. Acesse o menu **Usuários**.
2. Clique no ícone de **Editar** (lápis) no card do usuário.
3. Altere o valor no campo **Meta Semanal (Horas)**.
4. Salve as alterações.

### Acompanhando o Progresso
No **Dashboard**, o card "Progresso Semanal" exibirá:
- **Barra de Progresso**: Visualização rápida da porcentagem atingida.
- **Acumulado**: Total de horas trabalhadas na semana atual.
- **Saldo**: Quanto tempo falta para atingir a meta.

## 📈 Melhorias Futuras
- Gráfico de "Burn-down" semanal comparando a meta com o realizado dia a dia.
- Notificações automáticas via MCP/LLM quando o usuário se aproxima da meta.
- Relatórios comparativos de metas entre diferentes usuários (visão gerencial).
