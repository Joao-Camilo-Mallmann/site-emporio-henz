# ==============================================================================
# ESTÁGIO 1: BASE — Dependências do Backend
# ==============================================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copia manifestos de dependência para cache de camadas
COPY package.json bun.lock* ./
RUN bun install

# Copia código-fonte e migrações
COPY . .

# ==============================================================================
# ESTÁGIO 2: BACKEND — Runtime de Produção (Bun.serve com bundle compilado)
# ==============================================================================
FROM base AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Compila o bundle de produção
RUN bun run build

EXPOSE 3001
# Executa migrações no startup e inicia o bundle compilado
CMD ["sh", "-c", "bun run migrate && exec bun dist/index.js"]

# ==============================================================================
# ESTÁGIO 3: BACKEND-DEV — Runtime de Desenvolvimento com Live-Reload
# ==============================================================================
FROM base AS backend-dev
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001

# Garante sincronização de dependências, executa migrações e inicia com live-reload
CMD ["sh", "-c", "bun install && bun run migrate && exec bun run dev"]
