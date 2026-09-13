# ==============================================================================
# ESTÁGIO 1: BASE — Instalação de dependências e workspace do Turborepo
# ==============================================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copia manifestos de dependência para otimizar cache de camadas
COPY package.json bun.lock* turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/

# Instala todas as dependências do monorepo
RUN bun install

# Copia código-fonte completo
COPY apps ./apps
COPY packages ./packages

# ==============================================================================
# ESTÁGIO 2: MIGRATION — Runner idempotente one-shot via Turborepo
# ==============================================================================
FROM base AS migration
WORKDIR /app
ENV NODE_ENV=production

# Utiliza o script de migração padronizado no package.json raiz do Turborepo
CMD ["bun", "run", "migrate"]

# ==============================================================================
# ESTÁGIO 3: BACKEND — Build e runtime de produção da API Bun (Bun.serve)
# ==============================================================================
FROM base AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Realiza o bundle de produção do backend
RUN bun --filter backend run build

EXPOSE 3001
CMD ["bun", "apps/backend/dist/index.js"]

# ==============================================================================
# ESTÁGIO 4: FRONTEND BUILDER — Build estático do Vue 3 / Vite
# ==============================================================================
FROM base AS frontend-builder
WORKDIR /app
ENV NODE_ENV=production
RUN bun --filter web run build

# ==============================================================================
# ESTÁGIO 5: NGINX — Servidor estático e proxy reverso (único ponto público)
# ==============================================================================
FROM nginx:alpine AS nginx

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copia configuração customizada do proxy reverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos estáticos compilados do estágio frontend-builder imediatamente anterior
COPY --from=frontend-builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
