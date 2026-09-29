<p align="center">
  <img src="frontend/public/favicon.svg" alt="Logo Empório Henz" width="80" />
</p>

<h1 align="center">Empório Henz</h1>

<p align="center">
  Repositório oficial do sistema e e-commerce <strong>Empório Henz</strong>, composto pelas aplicações autônomas <strong>Backend</strong> (Bun nativo) e <strong>Frontend</strong> (Vue 3 + Vite + Tailwind CSS v4), orquestradas via <strong>Docker Compose</strong>.
</p>

<p align="center">
  <a href="http://177.44.248.90/">http://177.44.248.90/</a>
</p>

<p align="center">
  <img src="docs/prints/home.png" alt="Página inicial do Empório Henz" width="900" />
</p>

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
> As configurações contidas no [.env.example](.env.example) utilizam `NODE_ENV=development`. O sistema detecta o ambiente e seleciona os serviços adequados.

#### 3. Subir os serviços com Docker Compose

Você pode subir a stack utilizando diretamente os comandos nativos do Docker Compose com os perfis configurados:

- **Modo Desenvolvimento com Live-Reload (Recomendado para programar):**

  ```bash
  docker compose --profile dev up -d
  ```

  _Inicia: PostgreSQL com healthcheck, `backend-dev` (com migração automática e `bun --watch` na porta 3001) e `frontend-dev` (com Vite HMR na porta 3000)._

- **Modo Produção Compilado (Para testes de build ou deploy na VPS):**

  ```bash
  docker compose --profile prod up -d --build
  ```

  _Inicia: PostgreSQL, `backend` (compilado para produção com auto-migração) e `nginx` (servindo o frontend estático e proxy reverso na porta 80)._

- **Parar todos os containers mantendo os dados:**

  ```bash
  docker compose --profile dev --profile prod down
  ```

---

### Alternativa: Script Automatizado de Deploy Local (`deploy.sh`)

Em ambientes Linux / WSL / Git Bash, você também pode utilizar o script [deploy.sh](deploy.sh), que realiza a verificação de `.env`, build com perfil de produção, migrações e limpeza de imagens antigas:

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
- **Parar containers e apagar volumes (resetar banco de dados):**
  ```bash
  docker compose --profile dev --profile prod down -v
  ```

---

## 💻 Como Rodar Localmente sem Docker (Desenvolvimento com Bun)

Caso deseje desenvolver diretamente na máquina host:

### Pré-requisitos Locais

- [Bun](https://bun.sh/) 1.4+
- [PostgreSQL](https://www.postgresql.org/) 16 ativo localmente

### 1. Backend & Banco de Dados

```bash
cd backend
bun install

# Executar migrações e seeder
bun run migrate
bun run seed

# Iniciar servidor em desenvolvimento (porta 3001)
bun run dev
```

### 2. Frontend

Em outro terminal:

```bash
cd frontend
bun install

# Iniciar servidor Vite (porta 3000)
bun run dev
```

---

## 📦 Estrutura do Projeto

- [**`backend/`**](backend): Aplicação de API em **Bun nativo** utilizando `Bun.serve`, regras de negócio, testes unitários e diretório de migrações e sementes em `backend/database/`.
- [**`frontend/`**](frontend): Aplicação web em **Vue 3**, **Vite**, **Tailwind CSS v4**, **Vue Router** e **Pinia**.
- [**`backend/Dockerfile`**](backend/Dockerfile): Container Docker multi-stage do backend (dev e prod).
- [**`frontend/Dockerfile`**](frontend/Dockerfile): Container Docker multi-stage do frontend (dev HMR e Nginx de prod).
- [**`docker-compose.yml`**](docker-compose.yml): Orquestração unificada dos serviços PostgreSQL, Backend e Frontend.
- [**`deploy.sh`**](deploy.sh): Script de automação de build e deploy na máquina host/VM.
- [**`docs/`**](docs): Documentação oficial do projeto (PRD, backlog, DER, diretrizes de frontend e coleções Bruno).

---

## 📋 Padrões de Execução e Qualidade

### Backend (`backend/`)

```bash
cd backend
bun run check-types  # Checagem de tipos (tsc --noEmit)
bun run lint         # Verificação de lint (ESLint)
bun test             # Suíte de testes automatizados (bun:test)
bun run build        # Bundle de produção
```

### Frontend (`frontend/`)

```bash
cd frontend
bun run check-types  # Checagem de tipos (vue-tsc --noEmit)
bun run lint         # Verificação de lint (ESLint)
bun run build        # Build estático para produção
```

---

## 📖 Diretrizes e Desenvolvimento de Novas Features

Consulte o arquivo [agents.md](agents.md) para as regras de governança e arquitetura do projeto. O ciclo de vida de novas features deve seguir o fluxo **OpenSpec** (`openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`).
