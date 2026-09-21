# REGRAS DE USO E DIRETRIZES DO PROJETO

> [!IMPORTANT]
> **REGRA GERAL PARA O AGENTE:**
>
> 1. **SEMPRE BUSCAR E CONSULTAR OS ARQUIVOS `agents.md` DO PROJETO:** No início e ao longo de cada interação para verificar as regras de uso, padrões arquiteturais e diretrizes técnicas atualizadas.
> 2. **DESENVOLVIMENTO DE NOVAS FEATURES (OBRIGATÓRIO USAR OPENSPEC):**
>    - Sempre avisar e orientar o usuário a utilizar o **OpenSpec** do projeto para o ciclo de vida de qualquer nova feature.
>    - **`openspec-explore`**: Utilizar para explorar ideias, investigar requisitos, analisar dependências e alinhar o escopo antes da especificação.
>    - **`openspec-propose`**: Utilizar para gerar a proposta formal da feature (especificação delta, design e lista de tarefas estruturada).
>    - **`openspec-apply-change`**: Utilizar para executar as tarefas da mudança aprovada.
>    - **`openspec-archive-change`**: Utilizar para finalizar e arquivar a feature concluída.
>    - **SEMPRE alertar o usuário** caso ele solicite uma nova funcionalidade sem passar pelo fluxo do OpenSpec.
> 3. **ESTRATÉGIA DATABASE FIRST & DECOMPOSIÇÃO ESTRITA DE TAREFAS (OBRIGATÓRIO):**
>    - **Database First**: Todo o Banco de Dados (tabelas, migrações idempotentes em `packages/database`, integridade referencial, soft delete com `deleted_at`, índices parciais e seeds essenciais) DEVE ser modelado, migrado e validado ANTES da implementação de Back-end e Front-end.
>    - **Decomposição em 3 Camadas**: Toda nova funcionalidade que envolva persistência, lógica e tela DEVE ser dividida em tarefas/issues separadas: `[DB]` Banco de Dados, `[BE]` Back-end e `[FE]` Front-end.
>    - **Padrão de Histórias de Usuário**: Todas as tarefas/issues devem seguir rigorosamente o template e convenções do guia [docs/padrao-historias-tarefas.md](docs/padrao-historias-tarefas.md) e estar registradas no backlog [docs/user-stories-backlog.md](docs/user-stories-backlog.md).
> 4. **DESIGN SYSTEM & PADRONIZAÇÃO DE CORES TAILWIND (OBRIGATÓRIO):**
>    - **Proibição de Hexadecimais Arbitrários**: É terminantemente proibido utilizar classes com códigos hexadecimais arbitrários inline (`[#...]`) no código do frontend (`apps/web`).
>    - **Tokens Semânticos do Tailwind v4**: Utilize sempre as classes utilitárias semânticas padronizadas baseadas no Figma (`primary`, `primary-dark`, `secondary`, `secondary-hover`, `neutral-dark`, `surface-light`, `surface-tint`, `wood-*`). Consulte a documentação completa em [docs/design-system-cores.md](docs/design-system-cores.md) e [apps/web/agents.md](apps/web/agents.md).

---

## Estrutura do Monorepo (Turborepo + Bun)

- **Gerenciador de Pacotes**: `bun` (versão 1.4+)
- **Apps**:
  - `apps/web`: Frontend em **Vue 3 + Vite** com **Tailwind CSS v4**, **Vue Router** e **Pinia** (porta padrão: 3000). Consulte [apps/web/agents.md](apps/web/agents.md).
  - `apps/backend`: Backend em **Bun nativo** utilizando `Bun.serve` (porta padrão: 3001). Consulte [apps/backend/agents.md](apps/backend/agents.md).
- **Packages**:
  - `packages/database`: Migrações e utilitários de banco de dados PostgreSQL.

---

## Padrões Gerais de Execução

- **Checagem de Tipos**: `bun run check-types`
- **Linting**: `bun run lint`
- **Build de Produção**: `bun run build`
- **Ambiente de Desenvolvimento**: `bun run dev`

---

## Setup e Execução com Docker (Produção e Testes Isolados)

O projeto possui orquestração completa via [docker-compose.yml](docker-compose.yml) e build multi-stage em [Dockerfile](Dockerfile).

### 1. Arquitetura dos Serviços Docker

- **`postgres`** (`postgres:16-alpine`): Banco relacional em rede interna (`emporio_net`), com volume persistente `postgres_data` e healthcheck automático.
- **`migration`** (Runner Bun one-shot): Executa `packages/database/src/migrate.ts` assim que o PostgreSQL estiver saudável, aplicando migrações pendentes de forma idempotente.
- **`backend`** (`apps/backend`): API em Bun nativo compilada para produção, exposta internamente na porta `3001`.
- **`nginx`** (`nginx:alpine`): Ponto único de entrada público (`PORT_HTTP`, padrão: `80`), serve os arquivos estáticos do frontend (`apps/web/dist`) e atua como proxy reverso para a API em `/api/*`.

### 2. Passo a Passo de Setup

1. **Configurar o `.env`**:
   - Copiar [.env.example](.env.example) para `.env`:
     ```bash
     # Linux / macOS / Git Bash
     cp .env.example .env

     # Windows (PowerShell)
     Copy-Item .env.example .env
     ```
   - Em produção/VM, alterar as senhas de `POSTGRES_PASSWORD` e `DATABASE_URL`.

2. **Subir toda a stack com build**:

   ```bash
   docker compose up -d --build
   ```

3. **Executar migrações avulsas (se necessário)**:

   ```bash
   docker compose run --rm migration
   ```

4. **Script de deploy automatizado (Linux/VM)**:
   ```bash
   chmod +x deploy.sh && ./deploy.sh
   ```

### 3. Comandos Úteis do Docker

- **Status dos containers**: `docker compose ps`
- **Logs unificados em tempo real**: `docker compose logs -f`
- **Logs do backend**: `docker compose logs -f backend`
- **Parar containers mantendo dados**: `docker compose down`
- **Parar e limpar banco (reset completo)**: `docker compose down -v`
- **Acessar shell de um container**: `docker compose exec backend sh` ou `docker compose exec postgres psql -U postgres -d emporio_henz`
