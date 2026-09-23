## 1. Ajustes no Dockerfile e Compose

- [x] 1.1 [INFRA] Garantir que os alvos `backend-dev` e `web-dev` no `Dockerfile` rodem em modo watch e HMR sem compilação estática
- [x] 1.2 [INFRA] Configurar perfis de ambiente no `docker-compose.yml` (`dev` para `backend-dev`/`web-dev` e `prod` para `backend`/`nginx`), mantendo `postgres` e `migration` compartilhados
- [x] 1.3 [INFRA] Limpar a variável `COMPOSE_PROFILES` dos arquivos `.env` e `.env.example`, mantendo apenas `NODE_ENV` como controle central

## 2. Scripts de Automação no Monorepo

- [x] 2.1 [INFRA] Adicionar scripts `docker:dev`, `docker:prod` e `docker:down` no `package.json` raiz
- [x] 2.2 [INFRA] Criar script inteligente `docker:up` em Bun (`scripts/docker-up.ts`) que inspeciona `NODE_ENV` do `.env` e sobe o perfil apropriado
- [x] 2.3 [INFRA] Garantir permissões e instruções no `README.md` e `AGENTS.md` para execução consistente dos comandos Docker

## 3. Validação e Testes de Execução

- [x] 3.1 [TEST] Validar que `bun run docker:dev` sobe apenas Postgres, Migrations, Backend-dev e Web-dev com Hot-Reload ativo e sem build estático
- [x] 3.2 [TEST] Validar que `bun run docker:prod` aciona o build de produção multi-stage e sobe com Nginx
- [x] 3.3 [TEST] Executar `bun run check-types` e `bun run lint` garantindo integridade de todo o monorepo
