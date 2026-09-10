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
> 3. **FLUXO OBRIGATÓRIO DE BRANCH, PULL REQUEST E GITHUB PROJECTS (TODA VEZ):**
>    - **NUNCA comitar diretamente na branch `main`**.
>    - Criar sempre uma branch específica para cada feature ou tarefa seguindo a convenção:
>      - `feat--<nome-da-change>`
>      - `fix--<nome-do-fix>`
>      - `hotfix--<nome>`
>    - Ao finalizar a implementação de qualquer tarefa ou mudança:
>      1. Validar integridade (`bun run check-types` e `bun run lint`).
>      2. Comitar as alterações com Conventional Commits (`feat(...)`, `fix(...)`).
>      3. Realizar o push para o remote (`git push -u origin <branch>`).
>      4. **SEMPRE criar automaticamente o Pull Request no GitHub** utilizando a GitHub CLI (`gh pr create`) apontando para `main`.
>      5. No corpo do PR, utilizar o template [`.github/pull_request_template.md`](file:///home/joao/projects/site-emporio-henz/.github/pull_request_template.md) e vincular obrigatoriamente o GitHub Projects do usuário:
>         - **Board do GitHub Projects**: `https://github.com/users/Joao-Camilo-Mallmann/projects/3/views/1`
>      6. Autenticação com `gh`:
>         ```bash
>         TOKEN=$(echo -e "protocol=https\nhost=github.com\n" | git credential fill | grep password | cut -d= -f2)
>         GH_TOKEN="$TOKEN" gh pr create --base main --head <branch> --title "..." --body "..."
>         ```

---

## Estrutura do Monorepo (Turborepo + Bun)

- **Gerenciador de Pacotes**: `bun` (versão 1.4+)
- **Apps**:
  - `apps/web`: Frontend em **Vue 3 + Vite** com **Tailwind CSS v4**, **Vue Router** e **Pinia** (porta padrão: 3000). Consulte [apps/web/agents.md](file:///home/joao/projects/site-emporio-henz/apps/web/agents.md).
  - `apps/backend`: Backend em **Bun nativo** utilizando `Bun.serve` (porta padrão: 3001). Consulte [apps/backend/agents.md](file:///home/joao/projects/site-emporio-henz/apps/backend/agents.md).
- Os apps `web` e `backend` são autocontidos e independentes (sem dependência de pasta `packages/`).

---

## Padrões Gerais de Execução

- **Checagem de Tipos**: `bun run check-types`
- **Linting**: `bun run lint`
- **Build de Produção**: `bun run build`
- **Ambiente de Desenvolvimento Local**: `bun run dev`
- **Ambiente de Contêineres (Docker Compose)**:
  - Subir stack completa (`web`, `backend`, `postgres`): `bun run docker:up` (ou `docker compose up --build -d`)
  - Parar contêineres: `bun run docker:down` (ou `docker compose down`)
  - Acompanhar logs unificados: `bun run docker:logs` (ou `docker compose logs -f`)
  - Banco de Dados (PostgreSQL 16): porta 5432, DDL e seeds em `docker/postgres/init.sql`
  - Frontend SPA (Nginx Alpine): porta 3000 com proxy reverso em `/api/` e `/health` para porta 3001
  - Backend API (Bun Alpine): porta 3001

