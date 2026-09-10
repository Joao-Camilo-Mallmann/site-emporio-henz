# ==============================================================================
# Dockerfile - Backend (Bun Native HTTP Server)
# Multi-stage build otimizado para o monorepo site-emporio-henz
# ==============================================================================

# Stage 1: Build & Bundle
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copia manifestos de dependências do monorepo
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/

# Instala as dependências com lockfile congelado
RUN bun install --frozen-lockfile

# Copia código-fonte do backend
COPY apps/backend ./apps/backend

# Compila o backend gerando o bundle único em dist/index.js
WORKDIR /app/apps/backend
RUN bun run build

# Stage 2: Produção (Runner ultra-enxuto)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Cria e ajusta permissões para usuário não-root
USER bun

# Copia apenas o bundle standalone compilado
COPY --from=builder /app/apps/backend/dist/index.js ./dist/index.js

EXPOSE 3001

CMD ["bun", "dist/index.js"]
