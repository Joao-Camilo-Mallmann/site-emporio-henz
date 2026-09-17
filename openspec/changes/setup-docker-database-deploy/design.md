## Context

O projeto Empório Henz é estruturado como um monorepo gerenciado por Turborepo e Bun, contendo as aplicações `apps/web` (Vue 3 + Vite + Tailwind CSS v4) e `apps/backend` (Bun nativo com `Bun.serve`). Atualmente, os produtos no backend utilizam dados mockados em memória e não há infraestrutura de persistência relacional nem configuração de conteinerização configurada.

O objetivo desta mudança é estruturar o módulo de banco de dados (`packages/database`) utilizando SQL puro e o cliente nativo de PostgreSQL do Bun, além de fornecer toda a infraestrutura Docker multi-stage, orquestração via Docker Compose, proxy reverso Nginx e automação de deploy local via script (`deploy.sh`) voltado para execução direta em VM simples sem pipelines de CI/CD ou ORMs.

## Goals / Non-Goals

**Goals:**

- Criar o pacote `packages/database` no monorepo com migrações versionadas em SQL puro e runner `src/migrate.ts` em TypeScript/Bun.
- Implementar controle idempotente de migrações através da tabela `_migrations`, executando apenas arquivos pendentes dentro de transações seguras.
- Criar um único `Dockerfile` multi-stage centralizado contendo estágios para frontend, backend, migration e Nginx.
- Configurar `docker-compose.yml` contendo os serviços `postgres` (com volume persistente e porta interna isolada), `migration` (one-shot executado sob demanda), `backend` e `nginx` (única porta pública 80 exposta).
- Configurar `nginx.conf` servindo os arquivos estáticos do frontend em `/` e roteando `/api/` e `/health` para o backend.
- Criar templates de variáveis de ambiente (`.env.example`) e script de deploy (`deploy.sh`) para atualização e publicação na VM com um único comando.

**Non-Goals:**

- Utilização de ORMs ou query builders pesados (como Prisma, Drizzle ou TypeORM) — o acesso ao banco permanecerá em SQL puro.
- Configuração de pipelines de CI/CD remotos (GitHub Actions, GitLab CI) — o deploy será executado localmente na VM.
- Emissão e renovação de certificados SSL/HTTPS nesta primeira etapa — o HTTPS será adicionado após a vinculação de um domínio oficial.
- Exposição externa da porta 5432 do PostgreSQL para a internet.
- Execução automática de migrações no startup do container da API backend (mantendo o serviço `migration` estritamente separado).

## Decisions

### 1. SQL Puro com Driver Nativo Bun PostgreSQL vs ORMs (Prisma / Drizzle)

- **Decisão**: Utilizar consultas SQL puras e o suporte nativo a PostgreSQL do Bun (`Bun.sql` ou driver nativo compatível) no pacote `packages/database`.
- **Justificativa**: Evita sobrecarga de geração de artefatos em VMs com recursos enxutos, acelera o tempo de build do Docker e assegura controle explícito sobre o schema e queries.
- **Alternativas consideradas**:
  - _Prisma_: Requer binários adicionais pesados, geração de cliente e consome mais memória.
  - _Drizzle_: Embora leve, adiciona uma camada desnecessária de abstração para a fase atual do projeto.

### 2. Migration Runner One-Shot Separado vs Execução no Boot do Backend

- **Decisão**: Configurar o serviço de migração como uma tarefa one-shot via `docker compose run --rm migration`.
- **Justificativa**: Impede concorrência de migrações entre múltiplas instâncias do backend, isola permissões de DDL (Data Definition Language) do ciclo de vida da API e facilita depuração em caso de falha de migração antes do backend iniciar.
- **Alternativas consideradas**:
  - _Executar migrações ao iniciar o servidor HTTP no backend_: Pode causar travamentos silenciosos, inconsistências caso múltiplas instâncias subam simultaneamente e viola a separação de responsabilidades.

### 3. Dockerfile Multi-stage Unificado vs Dockerfiles Isolados

- **Decisão**: Centralizar todos os estágios de construção em um único `Dockerfile` na raiz do monorepo.
- **Justificativa**: Otimiza o cache de camadas do Bun/TurboRepo, evita duplicação de definições de workspaces e simplifica a manutenção da infraestrutura de build.
- **Alternativas consideradas**:
  - _`Dockerfile.web`, `Dockerfile.backend`, `Dockerfile.db`_: Dificultam o compartilhamento de contexto do monorepo e redundam comandos de instalação de pacotes.

### 4. Nginx Conteinerizado como Ponto Único de Entrada

- **Decisão**: Executar o Nginx dentro de um container Docker, mapeando a porta 80 da VM para o container.
- **Justificativa**: Mantém o sistema operacional da VM limpo e sem dependências locais instaladas, facilitando a recriação completa do servidor em minutos.
- **Alternativas consideradas**:
  - _Nginx instalado no host da VM_: Exige configuração manual no host e introduz acoplamento com a distribuição Linux específica.

## Risks / Trade-offs

- **[Risco] Falha ou interrupção durante a execução de uma migration SQL**
  - _Mitigação_: Cada arquivo de migração deve ser executado dentro de uma transação SQL explícita (`BEGIN ... COMMIT / ROLLBACK`). Se houver erro, a transação reverte todas as instruções e o script aborta sem registrar a migration como concluída.
- **[Risco] Limitação de memória RAM durante o build do Vite na VM**
  - _Mitigação_: Configuração de swap space na VM e otimização dos estágios multi-stage do Dockerfile para reutilizar cache do Bun.
- **[Risco] Perda de dados em caso de destruição do container do PostgreSQL**
  - _Mitigação_: Uso estrito de volume nomeado persistente (`postgres_data`) desacoplado do ciclo de vida do container e inclusão de procedimento de backup via `pg_dump`.

## Migration Plan

1. **Atualização do Monorepo**: Adicionar `"packages/*"` aos workspaces no `package.json` raiz e atualizar `turbo.json` com tarefas de migração e variáveis de ambiente necessárias.
2. **Criação de `packages/database`**:
   - `packages/database/package.json`
   - `packages/database/src/db.ts` (conexão pool/cliente com PostgreSQL)
   - `packages/database/src/migrate.ts` (lógica de leitura, controle e execução idempotente)
   - `packages/database/migrations/001_initial_schema.sql` (criação do schema inicial de produtos, categorias e soft delete)
3. **Criação dos Arquivos de Infraestrutura**:
   - `Dockerfile` multi-stage
   - `docker-compose.yml`
   - `nginx.conf`
   - `.env.example`
   - `deploy.sh` (com permissão de execução `chmod +x`)
4. **Validação Local**: Testar compilação das imagens Docker e execução do runner de migração localmente.
5. **Procedimento de Rollback**: Caso uma versão falhe na VM, o script de deploy permite checkout de tag/commit anterior e rebuild dos containers.
