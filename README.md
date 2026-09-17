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
> As configurações padrão contidas no [.env.example](.env.example) já funcionam imediatamente para execução local via Docker Compose (porta HTTP 80, banco PostgreSQL interno).

#### 3. Subir os serviços com Docker Compose

Execute o comando para construir as imagens e iniciar os containers em segundo plano:

```bash
docker compose up -d --build
```

O [docker-compose.yml](docker-compose.yml) cuidará automaticamente de:

1. Subir o container de banco de dados **PostgreSQL 16**.
2. Aguardar o healthcheck do PostgreSQL ficar saudável.
3. Executar o container de migração SQL nativo ([packages/database](packages/database)).
4. Subir a API backend com **Bun.serve** ([apps/backend](apps/backend)).
5. Subir o servidor **Nginx** servindo o frontend compilado ([apps/web](apps/web)) e roteando requisições de `/api` para o backend.

---

### Alternativa: Script Automatizado de Deploy Local (`deploy.sh`)

Em ambientes Linux / WSL / Git Bash, você também pode utilizar o script [deploy.sh](deploy.sh), que realiza a verificação de `.env`, build, migrações e limpeza de imagens antigas:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

### 🌐 Endereços de Acesso

Após iniciar os containers, acesse em seu navegador:

- **Frontend (Aplicação Web)**: [http://localhost](http://localhost) (ou na porta configurada em `PORT_HTTP`)
- **Backend API**: [http://localhost/api](http://localhost/api)
- **Healthcheck da API**: [http://localhost/health](http://localhost/health)

---

### 🛠️ Comandos Úteis do Docker

- **Acompanhar logs de todos os serviços em tempo real:**
  ```bash
  docker compose logs -f
  ```
- **Acompanhar logs apenas do backend:**
  ```bash
  docker compose logs -f backend
  ```
- **Executar migrações do banco manualmente:**
  ```bash
  docker compose run --rm migration
  ```
- **Parar todos os containers mantendo os dados do banco:**
  ```bash
  docker compose down
  ```
- **Parar containers e apagar todos os volumes (resetar banco de dados):**
  ```bash
  docker compose down -v
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
   Copie `.env.example` para `.env` e ajuste `DATABASE_URL` e `POSTGRES_HOST=localhost` com as credenciais do seu banco local.
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
