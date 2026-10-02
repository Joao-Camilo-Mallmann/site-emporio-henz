# Infraestrutura e operação

Guia de Docker Compose, Nginx, deploy e proteção dos dados do Empório Henz.

## Referências

- [Docker Compose](../../docker-compose.yml)
- [Dockerfile do back-end](../../backend/Dockerfile)
- [Dockerfile do front-end](../../frontend/Dockerfile)
- [Guia de backup e restauração](./backup-restore-guide.md)
- [Script de deploy](../../deploy.sh)
- [Workflow de CI/CD](../../.github/workflows/deploy.yml)

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
| [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) | Automação de deploy contínuo (CI/CD) via SSH |
| [`scripts/backup.sh`](../../scripts/backup.sh) | Dump compactado com retenção |
| [`scripts/restore.sh`](../../scripts/restore.sh) | Restauração de dump |
| [Guia de backup](./backup-restore-guide.md) | Procedimento manual, automação com cron e cópia externa |

## Deploy Contínuo (CI/CD via GitHub Actions)

O pipeline em [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) conecta na VM de produção via SSH e executa a atualização automática do projeto e dos containers Docker.

### Gatilhos

- **Automático**: A cada `push` ou merge na branch `main`.
- **Manual**: Via interface do GitHub em **Actions** > **Deploy na VM via SSH** > **Run workflow** (`workflow_dispatch`).

### Fluxo Remoto de Execução

No servidor remoto, o pipeline executa a sequência garantindo interrupção imediata em caso de falha (`script_stop: true`):

```bash
cd ~/site-emporio-henz
git checkout main
git pull origin main
chmod +x deploy.sh
./deploy.sh
```

### GitHub Secrets Obrigatórios

Configure em **Settings** > **Secrets and variables** > **Actions** do repositório no GitHub:

| Secret | Descrição | Exemplo |
| :--- | :--- | :--- |
| `SSH_HOST` | Endereço IP ou hostname da VM | `177.44.248.90` |
| `SSH_USER` | Usuário Linux para a sessão SSH | `univates` |
| `SSH_PASSWORD` | Senha de autenticação do usuário SSH (se não usar chave) | `SuaSenhaAqui` |
| `SSH_KEY` | Chave privada SSH (se usar autenticação por par de chaves) | Conteúdo de `~/.ssh/id_ed25519` |
| `SSH_PORT` | Porta SSH da máquina (opcional, padrão 22) | `22` |

> [!NOTE]
> Variáveis de aplicação e segredos de banco de dados (`POSTGRES_PASSWORD`, etc.) **não devem** ser colocadas nos secrets do GitHub; elas residem unicamente no arquivo `.env` da VM.

### Pré-requisitos na Máquina Virtual (VM)

1. **Permissão Docker sem `sudo`**: O usuário do SSH precisa pertencer ao grupo `docker`:
   ```bash
   sudo usermod -aG docker $USER
   ```
   *(Depois de rodar, reinicie a sessão SSH e teste com `docker ps` sem sudo).*

2. **Arquivo `.env`**: Deve existir previamente em `~/site-emporio-henz/.env` preenchido com as variáveis de produção.

3. **Workspace Git Limpo**: O repositório clonado na VM não deve conter alterações manuais não commitadas para evitar falhas de conflito durante o `git pull`.

