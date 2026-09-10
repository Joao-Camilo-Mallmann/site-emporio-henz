# ==============================================================================
# Dockerfile - Frontend (Vue 3 + Vite + Tailwind CSS v4)
# Multi-stage build com compilação estática e servidor Nginx Alpine
# ==============================================================================

# Stage 1: Build & Bundle com Bun
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copia manifestos de dependência do monorepo
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/

# Instala as dependências do monorepo
RUN bun install --frozen-lockfile

# Copia código-fonte do frontend
COPY apps/web ./apps/web

# Compila o frontend Vue 3 + Vite para produção
WORKDIR /app/apps/web
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Stage 2: Runner Nginx Alpine
FROM nginx:alpine AS runner

# Copia arquivo de configuração customizado do Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copia os assets estáticos gerados no build
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
