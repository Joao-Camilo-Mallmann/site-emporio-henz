# Comandos de desenvolvimento

Comandos para programar na máquina local. Rode todos a partir da raiz do repositório, salvo indicação. Para produção, veja [producao.md](./producao.md).

## Primeira vez

```bash
cp .env.example .env
```

No `.env`, defina um `JWT_SECRET` próprio:

```bash
openssl rand -hex 32
```

## Com Docker (`--profile dev`)

### Subir e parar

```bash
# Subir PostgreSQL, backend-dev e frontend-dev
docker compose --profile dev up -d

# Recriar as imagens (depois de mudar Dockerfile ou dependências)
docker compose --profile dev up -d --build

# Parar mantendo os dados
docker compose --profile dev down

# Ver o estado dos containers
docker compose ps
```

| Serviço | Endereço |
| --- | --- |
| Frontend (Vite HMR) | <http://localhost:3000> |
| API | <http://localhost:3001/api/v1> |
| Healthcheck | <http://localhost:3001/api/v1/health> |

### Migrações e seed

O `backend-dev` já roda as migrações ao subir. Com os containers no ar, para aplicar uma migração nova:

```bash
docker compose exec backend-dev bun run migrate
```

Recriar o administrador padrão e garantir as categorias e os produtos de exemplo com fotos:

```bash
docker compose exec backend-dev bun run seed
```

### Logs e acesso aos containers

```bash
# Todos os serviços
docker compose logs -f

# Só o backend
docker compose logs -f backend-dev

# Shell dentro do backend
docker compose exec backend-dev sh

# psql dentro do banco
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### Resetar o banco

Apaga o volume do PostgreSQL. As migrações recriam tudo na próxima subida.

```bash
docker compose --profile dev down -v
docker compose --profile dev up -d
```

> [!WARNING]
> O `-v` apaga todos os dados locais do banco. Em dev as fotos ficam em `backend/uploads/` no host e não são afetadas.

## Sem Docker (Bun direto no host)

Pré-requisitos: [Bun](https://bun.sh/) 1.4+ e um PostgreSQL 16 acessível (pode ser o container `postgres` do Compose, publicado em `localhost:5432`).

O Bun só carrega o `.env` da pasta atual, e o `.env` do projeto fica na raiz. Por isso os comandos em `backend/` usam `--env-file=../.env` e trocam o host para `localhost`:

```bash
cd backend
bun install

# Migrações e seed
POSTGRES_HOST=localhost bun --env-file=../.env run migrate
POSTGRES_HOST=localhost bun --env-file=../.env run seed

# API em modo dev (porta 3001)
POSTGRES_HOST=localhost bun --env-file=../.env run dev
```

Frontend, em outro terminal:

```bash
cd frontend
bun install
bun run dev
```

Lint, tipos, testes e build de cada aplicação estão em [`backend/README.md`](../../backend/README.md) e [`frontend/README.md`](../../frontend/README.md).

## Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| `password authentication failed for user "postgres"` ao rodar fora do Docker | O Bun não leu o `.env` da raiz e caiu no usuário padrão | Use `bun --env-file=../.env ...` |
| `password authentication failed for user "<seu usuário>"` dentro do container | O volume `postgres_data` foi criado com outra senha; o Postgres só aplica `POSTGRES_PASSWORD` na primeira inicialização | Resete o banco (acima) ou altere a senha com `ALTER USER` via `psql` |
| Conexão recusada no host `postgres` | Esse nome só existe dentro da rede do Compose | Fora do container, use `POSTGRES_HOST=localhost` |
| `error: unzip is required to install bun` no WSL | Falta o `unzip` | `sudo apt install -y unzip` e rode o instalador do Bun de novo |
