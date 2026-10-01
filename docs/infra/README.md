# Infraestrutura e operação

Guia de Docker Compose, Nginx, deploy e proteção dos dados do Empório Henz.

## Referências

- [Docker Compose](../../docker-compose.yml)
- [Dockerfile do back-end](../../backend/Dockerfile)
- [Dockerfile do front-end](../../frontend/Dockerfile)
- [Guia de backup e restauração](./backup-restore-guide.md)
- [Script de deploy](../../deploy.sh)

## Serviços

| Perfil | Serviço | Função | Porta padrão |
| --- | --- | --- | ---: |
| Todos | `postgres` | PostgreSQL 16 e volume `postgres_data` | `5432` |
| `dev` | `backend-dev` | API Bun com reload | `3001` |
| `dev` | `frontend-dev` | Vite com HMR | `3000` |
| `prod` | `backend` | API Bun compilada | `3001` |
| `prod` | `nginx` | Front-end estático e proxy reverso | `80` |

Todos os serviços compartilham a rede Docker `emporio_net`. O healthcheck do PostgreSQL controla a inicialização do back-end. Os Dockerfiles executam as migrações antes de iniciar a API.

> [!IMPORTANT]
> O Compose atual publica a porta do PostgreSQL no host. Em uma VM de produção, restrinja essa porta por firewall ou remova o mapeamento antes do deploy público.

## Desenvolvimento

```bash
docker compose --profile dev up -d --build
docker compose --profile dev logs -f
```

Aplicações padrão:

- Front-end: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Healthcheck: `http://localhost:3001/api/v1/health`

## Produção

```bash
docker compose --profile prod up -d --build
docker compose --profile prod logs -f
```

O Nginx atende a aplicação na porta `80` e encaminha as requisições da API ao serviço `backend`.

## Parar ou recriar

Parar os serviços sem apagar o banco:

```bash
docker compose --profile dev --profile prod down
```

Apagar também os volumes e recriar o banco do zero:

```bash
docker compose --profile dev --profile prod down -v
```

O segundo comando é destrutivo e deve ser usado somente quando a perda dos dados locais for intencional.

## Operação

| Recurso | Uso |
| --- | --- |
| [`deploy.sh`](../../deploy.sh) | Build e atualização da stack na VM |
| [`scripts/backup.sh`](../../scripts/backup.sh) | Dump compactado com retenção |
| [`scripts/restore.sh`](../../scripts/restore.sh) | Restauração de dump |
| [Guia de backup](./backup-restore-guide.md) | Procedimento manual, automação com cron e cópia externa |
