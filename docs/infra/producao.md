# Comandos de produção

Comandos para build, deploy e operação na VM. Rode todos a partir da raiz do repositório. Para desenvolvimento local, veja [desenvolvimento.md](./desenvolvimento.md).

## Pré-requisitos na VM

- Docker e Docker Compose instalados.
- `.env` preenchido na raiz do repositório, com `JWT_SECRET` próprio e senha forte em `POSTGRES_PASSWORD`. Esses valores ficam só no `.env` da VM, nunca no repositório.

## Subir e parar

```bash
# Build e subida de PostgreSQL, backend e nginx
docker compose --profile prod up -d --build

# Parar mantendo os dados
docker compose --profile prod down

# Ver o estado dos containers
docker compose --profile prod ps
```

| Serviço | Endereço |
| --- | --- |
| Frontend (Nginx) | <http://localhost> (porta 80) |
| API | <http://localhost/api> |
| Healthcheck | <http://localhost/api/v1/health> |

> [!IMPORTANT]
> O Compose publica a porta `5432` do PostgreSQL no host. Em VM pública, bloqueie essa porta no firewall.

## Deploy

### Script local na VM

O [`deploy.sh`](../../deploy.sh) faz `git pull` da branch atual, confere o `.env`, gera as imagens, espera o PostgreSQL ficar saudável, sobe `backend` e `nginx` e limpa imagens antigas.

```bash
chmod +x deploy.sh
./deploy.sh
```

### GitHub Actions

O workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) é disparado só manualmente: **Actions** > **Deploy na VM** > **Run workflow**. Ele roda num runner self-hosted na VM, entra em `/var/www/html/site-emporio-henz`, faz checkout e pull de `main` e executa o `deploy.sh`.

## Migrações

O `backend` roda as migrações ao subir, então todo deploy já migra. Para aplicar manualmente com o container no ar:

```bash
docker compose exec backend bun run migrate
```

## Logs e acesso aos containers

```bash
# Todos os serviços
docker compose --profile prod logs -f

# Só o backend
docker compose logs -f backend

# psql dentro do banco
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## Backup e restauração

Os dados de produção ficam em dois volumes: `postgres_data` (banco) e `uploads_data` (fotos de produtos e amostras de variação, em `/app/uploads` no backend). O banco guarda só o caminho de cada imagem, então os dois precisam ser copiados juntos. Os scripts usam os containers do perfil `prod` em execução.

```bash
# Gerar backup (dump do banco + .tar.gz dos uploads, mesmo timestamp)
./scripts/backup.sh
# backups/backup_emporio_henz_2026-10-20_030000.sql.gz
# backups/uploads_2026-10-20_030000.tar.gz
```

Backups com mais de 30 dias são removidos automaticamente. Para agendar na VM (crontab):

```bash
0 3 * * * /caminho/para/site-emporio-henz/scripts/backup.sh >> /var/log/emporio-backup.log 2>&1
```

Restaurar banco e uploads do mesmo timestamp (pede confirmação; `--force` pula):

```bash
./scripts/restore.sh 2026-10-20_030000
```

Restaurar só o banco (backups antigos, sem `.tar.gz` de uploads):

```bash
./scripts/restore.sh --db-only backups/backup_emporio_henz_2026-09-13_120000.sql.gz
```

Depois de restaurar, as URLs das fotos (`/api/v1/uploads/...`) voltam a responder `200` sem novo deploy.

## Comandos destrutivos

```bash
docker compose --profile prod down -v
```

> [!CAUTION]
> Apaga os volumes `postgres_data` **e** `uploads_data`: todo o banco e todas as fotos enviadas. Só rode com um backup recente em mãos.

## Credenciais padrão

As migrações criam o administrador `admin@gmail.com` com senha `admin123`. A senha é pública: troque-a logo após o primeiro deploy, na tela **Meu Perfil** (`/perfil`).
