# Infraestrutura e operação

Como subir, operar e manter a stack do Empório Henz (PostgreSQL, backend Bun, frontend Vue e Nginx) com Docker Compose.

## Comandos por ambiente

| Ambiente | Documento | Quando usar |
| --- | --- | --- |
| Desenvolvimento | [desenvolvimento.md](./desenvolvimento.md) | Programar na máquina local, com Docker (`--profile dev`) ou só com Bun |
| Produção | [producao.md](./producao.md) | Build, deploy na VM, backup e restauração (`--profile prod`) |

## Serviços do Compose

| Perfil | Serviço | Container | Função | Porta padrão |
| --- | --- | --- | --- | ---: |
| Todos | `postgres` | `emporio-henz-postgres` | PostgreSQL 16, volume `postgres_data` | `5432` |
| `dev` | `backend-dev` | `emporio-henz-backend-dev` | API Bun com `--watch` | `3001` |
| `dev` | `frontend-dev` | `emporio-henz-frontend-dev` | Vite com HMR | `3000` |
| `prod` | `backend` | `emporio-henz-backend` | API Bun compilada, volume `uploads_data` | `3001` |
| `prod` | `nginx` | `emporio-henz-nginx` | Frontend estático e proxy reverso | `80` |

Todos os serviços ficam na rede `emporio_net`. O backend só sobe depois do healthcheck do PostgreSQL e roda `bun run migrate` antes de iniciar a API (veja o `CMD` em [`backend/Dockerfile`](../../backend/Dockerfile)).

> [!IMPORTANT]
> Dentro da rede do Compose o host do banco é `postgres`. Fora dela (Bun rodando direto no Windows, WSL ou macOS) o host é `localhost`. É por isso que comandos executados fora do container precisam sobrescrever `POSTGRES_HOST`.

## Arquivos de referência

- [`docker-compose.yml`](../../docker-compose.yml)
- [`backend/Dockerfile`](../../backend/Dockerfile) e [`frontend/Dockerfile`](../../frontend/Dockerfile)
- [`.env.example`](../../.env.example)
- [`deploy.sh`](../../deploy.sh)
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
- [`scripts/backup.sh`](../../scripts/backup.sh) e [`scripts/restore.sh`](../../scripts/restore.sh)
