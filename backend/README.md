# Backend — Empório Henz

Backend com API básica nativa utilizando **Bun.serve** integrado ao Turborepo.

## 🚀 Como Rodar

### Modo Desenvolvimento

Na raiz do monorepo:

```bash
bun run dev
# ou apenas o backend
bun --filter backend dev
```

Direto no diretório `apps/backend`:

```bash
bun dev
```

O servidor iniciará por padrão em `http://localhost:3001`.

### Build

```bash
bun run build
# ou
bun --filter backend build
```

### Checagem de Tipos e Lint

```bash
bun run check-types
bun run lint
```

## 📡 Endpoints Disponíveis

- `GET /`: Informações e status da API
- `GET /health` ou `GET /api/health`: Healthcheck com uptime e timestamp
- Suporte a CORS pré-configurado (`OPTIONS`, headers e origin)
