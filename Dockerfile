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
# ESTÁGIO 2: BACKEND — Build e runtime de produção da API Bun (Bun.serve)
# ==============================================================================
FROM base AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Realiza o bundle de produção do backend
RUN bun --filter backend build

EXPOSE 3001
# Executa as migrações no startup e inicia a API em seguida
CMD ["sh", "-c", "bun run migrate && exec bun apps/backend/dist/index.js"]

# ==============================================================================
# ESTÁGIO 3: FRONTEND BUILDER — Build estático do Vue 3 / Vite
# ==============================================================================
FROM base AS frontend-builder
WORKDIR /app
ENV NODE_ENV=production
RUN bun --filter web build

# ==============================================================================
# ESTÁGIO 4: NGINX — Servidor estático e proxy reverso (único ponto público)
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

# ==============================================================================
# ESTÁGIO 5: BACKEND-DEV — Runtime de desenvolvimento com live-reload (bun --watch)
# ==============================================================================
FROM base AS backend-dev
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001
# Executa as migrações no startup e inicia o servidor com live-reload
CMD ["sh", "-c", "bun run migrate && exec bun --filter backend dev"]

# ==============================================================================
# ESTÁGIO 6: WEB-DEV — Servidor Vite em modo desenvolvimento com HMR
# ==============================================================================
FROM base AS web-dev
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3000
CMD ["bun", "--filter", "web", "dev", "--host", "0.0.0.0"]
