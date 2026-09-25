# Empório Henz — Monorepo

Repositório oficial do sistema e e-commerce **Empório Henz**, estruturado como um monorepo gerenciado com [Turborepo](https://turbo.build/) e [Bun](https://bun.sh/).

---

## 🚀 Como Rodar o Projeto com Docker (Sem Setup Manual)

A forma mais rápida e recomendada de inicializar toda a stack (**PostgreSQL**, **Backend Bun**, **Frontend Vue 3** e proxy reverso **Nginx**) sem precisar instalar Bun, Node ou PostgreSQL na sua máquina hospedeira.

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/) instalado (incluso por padrão no Docker Desktop)

---

### Passo a Passo Rápido

#### 1. Clonar o repositório e acessar a pasta

```bash
git clone <url-do-repositorio>
cd site-emporio-henz
```

#### 2. Configurar o arquivo de ambiente (`.env`)

Copie o arquivo de exemplo [.env.example](.env.example) para criar o seu `.env`:

**No Linux / macOS / Git Bash:**

```bash
cp .env.example .env
```

**No Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**No Windows (CMD):**

```cmd
copy .env.example .env
```

> [!NOTE]
> As configurações contidas no [.env.example](.env.example) utilizam `NODE_ENV=development`. O sistema detecta o ambiente e seleciona os serviços adequados sem exigir `COMPOSE_PROFILES`.

#### 3. Subir os serviços com Docker Compose (Nativo, sem precisar de Bun ou Node)

Você pode subir a stack utilizando diretamente os comandos nativos do Docker Compose com os perfis configurados:

- **Modo Desenvolvimento com Live-Reload (Recomendado para programar):**

  ```bash
  docker compose --profile dev up -d
  ```

  _Inicia: PostgreSQL, Migrations, `backend-dev` (com `bun --watch` e volumes mapeados na porta 3001) e `web-dev` (com Vite HMR e Vue DevTools na porta 3000)._
  _Não executa compilação estática prévia nem build de produção._

- **Modo Produção Compilado (Para testes de build ou deploy na VPS):**

  ```bash
  docker compose --profile prod up -d --build
  ```

  _Inicia: PostgreSQL, Migrations, `backend` (compilado para produção) e `nginx` (servindo o frontend estático e proxy na porta 80)._

- **Parar todos os containers mantendo os dados:**

  ```bash
  docker compose --profile dev --profile prod down
  ```

---

### Alternativa: Script Automatizado de Deploy Local (`deploy.sh`)

Em ambientes Linux / WSL / Git Bash, você também pode utilizar o script [deploy.sh](deploy.sh), que realiza a verificação de `.env`, build, migrações e limpeza de imagens antigas:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

### 🌐 Endereços de Acesso

Após iniciar os containers:

- **Modo Desenvolvimento (`--profile dev`):**
  - **Frontend Web (Vite HMR)**: [http://localhost:3000](http://localhost:3000)
  - **Backend API**: [http://localhost:3001](http://localhost:3001)
  - **Healthcheck da API**: [http://localhost:3001/health](http://localhost:3001/health)

- **Modo Produção (`--profile prod`):**
  - **Frontend (Nginx Proxy)**: [http://localhost](http://localhost) (porta 80)
  - **Backend API**: [http://localhost/api](http://localhost/api)
  - **Healthcheck da API**: [http://localhost/health](http://localhost/health)

---

### 🛠️ Comandos Úteis do Docker

- **Parar os containers mantendo os dados:**
  ```bash
  docker compose --profile dev --profile prod down
  ```
- **Acompanhar logs de todos os serviços em tempo real:**
  ```bash
  docker compose logs -f
  ```
- **Acompanhar logs do backend:**
  ```bash
  # Em desenvolvimento
  docker compose logs -f backend-dev

  # Em produção
  docker compose logs -f backend
  ```
- **Executar migrações do banco manualmente:**
  ```bash
  docker compose run --rm migration
  ```
- **Parar containers e apagar todos os volumes (resetar banco de dados):**
  ```bash
  docker compose --profile dev --profile prod down -v
  ```

---

## 💻 Como Rodar Localmente sem Docker (Desenvolvimento com Bun)

Caso deseje desenvolver diretamente na máquina host:

### Pré-requisitos Locais

- [Bun](https://bun.sh/) 1.4+
- [PostgreSQL](https://www.postgresql.org/) 16 ativo localmente

### Passo a Passo

1. **Instalar dependências do monorepo:**
   ```bash
   bun install
   ```
2. **Configurar variáveis de ambiente:**
   Copie `.env.example` para `.env` e ajuste as credenciais do seu banco local (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST=localhost`).
3. **Executar as migrações no banco de dados:**
   ```bash
   bun run migrate
   ```
4. **Iniciar o ambiente de desenvolvimento (com hot-reload):**
   ```bash
   bun dev
   ```
   - Frontend Vite: [http://localhost:3000](http://localhost:3000)
   - Backend Bun: [http://localhost:3001](http://localhost:3001)

---

## 📦 Estrutura do Monorepo

- [**`apps/web`**](apps/web): Frontend em **Vue 3**, **Vite**, **Tailwind CSS v4**, **Vue Router** e **Pinia**.
- [**`apps/backend`**](apps/backend): Backend em **Bun nativo** utilizando `Bun.serve` e conexão com PostgreSQL.
- [**`packages/database`**](packages/database): Scripts e migrações SQL nativas idempotentes.
- [**`nginx.conf`**](nginx.conf): Configuração do proxy reverso e servidor de arquivos estáticos para produção.
- [**`Dockerfile`**](Dockerfile): Build multi-stage otimizado para as aplicações e migração.
- [**`docker-compose.yml`**](docker-compose.yml): Orquestração de containers para produção e testes locais.

---

## 📋 Padrões de Execução e Qualidade

- **Checagem de Tipos (TypeScript):**
  ```bash
  bun run check-types
  ```
- **Linting (ESLint):**
  ```bash
  bun run lint
  ```
- **Formatação (Prettier):**
  ```bash
  bun run format
  ```
- **Build de Produção:**
  ```bash
  bun run build
  ```

---

## 📖 Diretrizes e Desenvolvimento de Novas Features

Consulte o arquivo [agents.md](agents.md) para as regras de desenvolvimento e arquitetura do projeto. O ciclo de vida de novas features deve seguir o fluxo **OpenSpec** (`openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`).
