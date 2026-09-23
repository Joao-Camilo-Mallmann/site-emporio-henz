## Context

Anteriormente, o projeto mantinha um estágio separado `migration` no `Dockerfile` e utilizava a execução manual ou temporária de containers (`docker compose run --rm migration`) para aplicar alterações no esquema do PostgreSQL. A intenção atual é unificar toda a operação do backend em uma única imagem e container, garantindo que o próprio container do backend aplique as migrações pendentes no startup antes de iniciar a escuta de requisições HTTP via `Bun.serve`.

## Goals / Non-Goals

**Goals:**
- Ter uma única imagem e container para o backend.
- Remover o estágio `migration` do `Dockerfile`.
- Não utilizar nenhum container ou serviço temporário exclusivo para migrações.
- Garantir que `bun run migrate` seja executado no início do container do backend.
- Garantir que a API só seja iniciada se as migrações terminarem com sucesso (código de saída 0).
- Utilizar `exec` para que o processo do Bun herde o PID 1 e responda adequadamente aos sinais de encerramento (`SIGTERM`/`SIGINT`).
- Simplificar o fluxo de deploy no `deploy.sh`.

**Non-Goals:**
- Não alterar a implementação interna do runner em `packages/database/src/migrate.ts` ou arquivos SQL de migração.
- Não introduzir ORMs pesados (mantendo Bun nativo).

## Decisions

### 1. Startup com Shell Chaining e `exec`
- **Decisão**: Configurar o `CMD` dos estágios `backend` e `backend-dev` com:
  - Produção: `CMD ["sh", "-c", "bun run migrate && exec bun apps/backend/dist/index.js"]`
  - Desenvolvimento: `CMD ["sh", "-c", "bun run migrate && exec bun --filter backend dev"]`
- **Racional**:
  - `&&` garante que, caso `bun run migrate` falhe, a API não será iniciada, evitando operar sobre um banco em estado inconsistente ou defasado.
  - O uso de `exec` substitui o shell pelo binário do Bun, tornando-o o processo raiz (PID 1) do container. Isso assegura que os sinais de parada do Docker sejam repassados diretamente à aplicação.
- **Alternativas consideradas**:
  - *Chamar `runMigrations()` diretamente no código TypeScript de `apps/backend/src/index.ts`*: Descartado porque quebra a resolução relativa de caminhos de arquivos SQL empacotados (`import.meta.dir` apontaria para `apps/backend/dist` em vez de `packages/database`), e reexecutaria migrações a cada alteração de arquivo no modo `--watch` em desenvolvimento.

### 2. Remoção do Estágio `migration` do Dockerfile
- **Decisão**: Excluir completamente o bloco `FROM base AS migration`.
- **Racional**: Elimina redundância de camadas, reduz tempo de build e remove artefatos desnecessários.

### 3. Limpeza do `deploy.sh` e `AGENTS.md`
- **Decisão**: Remover o passo avulso `$DOCKER_COMPOSE run --rm migration` em `deploy.sh` e atualizar a documentação no `AGENTS.md`.

## Risks / Trade-offs

- **[Risco] Múltiplos containers em escala horizontal disputando migrações**:
  - *Mitigação*: Atualmente a aplicação roda em VM única com 1 réplica. O runner possui transações e verificação por tabela `_migrations`.
- **[Risco] Tentativa de migração antes do PostgreSQL aceitar conexões**:
  - *Mitigação*: O `docker-compose.yml` já configura estritamente `depends_on: postgres: condition: service_healthy` tanto para `backend` quanto para `backend-dev`.
