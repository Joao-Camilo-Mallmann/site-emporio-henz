# Backend — Empório Henz

API do Empório Henz construída com Bun nativo (`Bun.serve`), TypeScript e PostgreSQL. As migrações e os seeds do banco ficam em `database/`.

## Requisitos

- Bun 1.4+
- PostgreSQL 16

## Configuração

O backend lê as variáveis do ambiente do processo. Para execução local, copie as variáveis de [`.env.example`](../.env.example) para um `.env` dentro de `backend/`, ou exporte-as no terminal.

| Variável | Uso |
| --- | --- |
| `PORT` | Porta do servidor. Padrão: `3001`. |
| `NODE_ENV` | Ambiente de execução (`development` ou `production`). |
| `JWT_SECRET` | Segredo de assinatura dos tokens JWT. Se ausente, o código usa um valor padrão de desenvolvimento, que não deve ir para produção. |
| `DATABASE_URL` | String de conexão completa com o PostgreSQL. Quando definida, substitui as variáveis `POSTGRES_*`. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Credenciais, banco e porta usados na montagem da conexão quando `DATABASE_URL` não existe. |
| `POSTGRES_HOST` | Host do banco. Use `localhost` na execução local e `postgres` no Docker Compose. |

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

Inicia em `http://localhost:3001`. O healthcheck fica em `/health`.

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

## Estrutura

- `src/config/`: variáveis de ambiente e conexão com o banco
- `src/lib/`: utilitários compartilhados (JWT, senhas, paginação, respostas HTTP, erros e roteador)
- `src/middlewares/`: autenticação, papéis e tratamento de erros
- `src/modules/`: regras de negócio por domínio (`auth`, `categories`, `products`, `subtypes`, `suppliers`, `user-suppliers`, `users`)
- `src/routes/`: definição das rotas
- `database/`: migrações SQL (`migrations/`), `migrate.ts` e `seed.ts`
- `tests/`: testes automatizados

Consulte a [documentação técnica do back-end](../docs/backend/README.md), a [documentação do banco de dados](../docs/database/README.md) e a [collection Bruno](../docs/backend/collections/bruno/), que é a fonte de consulta dos endpoints.
