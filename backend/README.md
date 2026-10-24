# Backend — Empório Henz

API do Empório Henz construída com Bun nativo (`Bun.serve`), TypeScript e PostgreSQL. As migrações e os seeds do banco ficam em `database/`.

## Requisitos

- Bun 1.4+
- PostgreSQL 16

## Configuração

O backend lê as variáveis do ambiente do processo. Para execução local, copie as variáveis de [`.env.example`](../.env.example) para um `.env` dentro de `backend/`, ou exporte-as no terminal.

| Variável                                                             | Uso                                                                                                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                               | Porta do servidor. Padrão: `3001`.                                                                                                |
| `NODE_ENV`                                                           | Ambiente de execução (`development` ou `production`).                                                                             |
| `JWT_SECRET`                                                         | Segredo de assinatura dos tokens JWT. Obrigatório, sem valor padrão no código: o servidor não inicia sem ele. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Credenciais, banco e porta. O backend monta a URL de conexão com o PostgreSQL a partir delas e de `POSTGRES_HOST`.                 |
| `POSTGRES_HOST`                                                      | Host do banco. Use `localhost` na execução local e `postgres` no Docker Compose.                                                  |
| `UPLOADS_DIR`                                                        | Diretório das fotos de produto e amostras de variação. Padrão: `<cwd>/uploads` (`/app/uploads` no container, volume `uploads_data`). |

Exemplo para execução local:

```dotenv
PORT=3001
NODE_ENV=development
JWT_SECRET=troque-por-um-segredo-com-pelo-menos-32-caracteres
POSTGRES_USER=emporio_admin
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=emporio_henz
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
```

## Executar

```bash
cd backend
bun install
bun run migrate
bun run seed
bun run dev
```

Inicia em `http://localhost:3001`. O healthcheck fica em `api/v1/health`.

## Scripts

```bash
bun run dev          # servidor com recarga automática (src/index.ts)
bun run start        # executa o bundle gerado em dist/
bun run build        # gera o bundle de produção em dist/
bun run migrate      # aplica as migrações em database/migrations/
bun run seed         # cria o administrador padrão de desenvolvimento
bun test             # executa a suíte de testes (bun:test)
bun run lint         # executa o ESLint
bun run check-types  # valida tipos com tsc --noEmit
```

## Migrações e seed no Docker

O container do backend roda `bun run migrate` sozinho ao iniciar, antes de subir o servidor. O seed não roda automaticamente: execute-o uma vez com o container no ar.

```bash
# Produção (VM)
docker compose --profile prod exec backend bun run migrate
docker compose --profile prod exec backend bun run seed

# Desenvolvimento
docker compose --profile dev exec backend-dev bun run migrate
docker compose --profile dev exec backend-dev bun run seed
```

O seed cria o administrador padrão e, se ele já existir, redefine a senha para o valor fixo em `database/seed.ts`. Em produção, rode-o só na primeira instalação e troque a senha em seguida.

## Estrutura

- `src/config/`: variáveis de ambiente e conexão com o banco
- `src/lib/`: utilitários compartilhados (JWT, senhas, paginação, respostas HTTP, erros, roteador, processamento de imagens com `Bun.Image`, caminhos de upload e leitor de multipart)
- `src/middlewares/`: autenticação, papéis e tratamento de erros
- `src/modules/`: regras de negócio por domínio (`auth`, `categories`, `product-images`, `products`, `subtypes`, `suppliers`, `uploads`, `user-suppliers`, `users`)
- `src/routes/`: definição das rotas
- `database/`: migrações SQL (`migrations/`), `migrate.ts` e `seed.ts`
- `tests/`: testes automatizados, organizados por feature (`tests/modules/<feature>/`, `tests/lib/`, `tests/middlewares/`, `tests/http/`, `tests/config/`); `tests/mocks/` guarda os repositórios falsos por módulo, `tests/helpers/` utilitários compartilhados e `tests/fixtures/` as imagens usadas nos testes de upload
- `uploads/`: fotos e amostras gravadas na execução local (ignorado pelo git; em produção é o volume `uploads_data`)

Consulte a [documentação técnica do back-end](../docs/backend/README.md), a [documentação do banco de dados](../docs/database/README.md) e a [collection Bruno](../docs/backend/collections/bruno/), que é a fonte de consulta dos endpoints.
