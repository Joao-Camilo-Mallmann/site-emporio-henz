# ==============================================================================
# ESTÁGIO 1: BASE — Instalação de dependências do Frontend
# ==============================================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copia manifestos de dependência para cache de camadas
COPY package.json bun.lock* ./
RUN bun install

# Copia código-fonte
COPY . .

# ==============================================================================
# ESTÁGIO 2: FRONTEND-BUILDER — Build estático do Vue 3 / Vite
# ==============================================================================
FROM base AS frontend-builder
WORKDIR /app
ENV NODE_ENV=production
RUN bun run build

# ==============================================================================
# ESTÁGIO 3: NGINX — Servidor estático e proxy reverso para produção
# ==============================================================================
FROM nginx:alpine AS nginx

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copia configuração customizada do proxy reverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos estáticos compilados do estágio frontend-builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]

# ==============================================================================
# ESTÁGIO 4: WEB-DEV — Servidor Vite em modo desenvolvimento com HMR
# ==============================================================================
FROM base AS web-dev
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3000

# Garante que dependências estejam sincronizadas no volume antes de iniciar o Vite
CMD ["sh", "-c", "bun install && exec bun run dev --host 0.0.0.0"]
