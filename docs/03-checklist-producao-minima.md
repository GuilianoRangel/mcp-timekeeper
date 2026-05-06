# Checklist de Produção Mínima — TimeKeeper

## 1) Segredos e autenticação
- [ ] Definir JWT_SECRET forte (32+ chars, aleatório)
- [ ] Trocar senha padrão do admin seed
- [ ] Remover/rotacionar API keys de teste
- [ ] Armazenar segredos fora do repositório (.env em cofre/secret manager)

## 2) Banco e persistência
- [ ] Volume persistente para SQLite (./data)
- [ ] Política de backup periódico do arquivo .sqlite
- [ ] Testar restauração de backup
- [ ] Verificar permissões de leitura/escrita no volume (GID 1000)

## 3) Rede e exposição
- [ ] Expor API atrás de reverse proxy (Nginx/Traefik)
- [ ] Habilitar HTTPS/TLS
- [ ] Restringir origens CORS para domínios confiáveis
- [ ] Não expor porta MCP publicamente sem necessidade

## 4) Observabilidade
- [ ] Captura de logs da API (stdout/stderr com retenção)
- [ ] Captura de logs do MCP
- [ ] Política de rotação de logs
- [ ] Alertas básicos (container down, erro 5xx recorrente)

## 5) Integridade funcional
- [ ] Validar regra de 1 tarefa ativa por usuário
- [ ] Validar start/stop e cálculo de duração
- [ ] Validar lançamento manual (duração e intervalo)
- [ ] Validar relatórios por projeto/tarefa com quebra semanal
- [ ] Validar trilha de auditoria (ações críticas)

## 6) Operação Docker
- [ ] cp .env.example .env e revisar valores
- [ ] npm run up (API)
- [ ] npm run init:data (migrate + seed)
- [ ] npm run up:all (API + MCP)
- [ ] npm run ps e npm run logs para validação

## 7) Governança
- [ ] Confirmar política de criação de usuários (somente admin)
- [ ] Revisar acessos e perfis ativos
- [ ] Revisar retenção de auditoria
- [ ] Definir procedimento de revogação de API key
