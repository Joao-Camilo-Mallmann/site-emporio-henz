# Design

## Context

Atualmente o cliente Axios está configurado com URL absoluta hardcoded para `http://localhost:3001/api/v1` em `frontend/src/plugins/axios.ts`. O Nginx (`frontend/nginx.conf`) já possui configuração de proxy reverso encaminhando `/api/` para `http://backend:3001`. Em ambiente de desenvolvimento local, o Vite roda em `localhost:3000` enquanto o Bun roda em `localhost:3001`.

## Goals / Non-Goals

**Goals:**
- Permitir configuração dinâmica da URL da API pelo arquivo `.env` unificado na raiz do projeto (`VITE_API_URL`).
- Garantir fallback seguro para `/api/v1` (URL relativa Same-Origin) quando `VITE_API_URL` não for fornecida.
- Configurar o Vite para carregar o `.env` da raiz através de `envDir: "../"`.
- Habilitar proxy reverso no Vite (`server.proxy`) para chamadas `/api` durante o desenvolvimento local.
- Propagar `VITE_API_URL` durante a construção da imagem Docker do frontend no `docker-compose.yml` e `frontend/Dockerfile`.

**Non-Goals:**
- Não alterar regras de autenticação, rota JWT ou payloads no backend.
- Não alterar a porta interna padrão do backend (3001).

## Decisions

### Decisão 1: URL relativa `/api/v1` como fallback padrão
- **Escolha:** Usar `baseURL: import.meta.env.VITE_API_URL || "/api/v1"`.
- **Racional:** Elimina a dependência de portas ou IPs hardcoded no código compilado do frontend. Em produção (acesso via `http://177.44.248.90`), o navegador requisita `http://177.44.248.90/api/v1/...`, sendo interceptado e repassado pelo Nginx sem requisição preflight ou bloqueio de CORS.
- **Alternativa descartada:** Chumbamento de IP público no código ou variáveis obrigatórias no build. Quebraria caso o servidor mude de IP ou receba um domínio/SSL.

### Decisão 2: Centralização de variáveis com `envDir` no Vite
- **Escolha:** Adicionar `envDir: "../"` em `frontend/vite.config.ts`.
- **Racional:** O desenvolvedor precisa manter apenas um arquivo `.env` na raiz do monorepo/projeto, sem duplicar arquivos `.env` dentro de `frontend/` e `backend/`.
- **Alternativa descartada:** Criar múltiplos arquivos `.env` em `frontend/`. Aumenta o risco de dessincronização e esquecimento.

### Decisão 3: Vite Dev Server Proxy para desenvolvimento local
- **Escolha:** Configurar `server.proxy` no `vite.config.ts` mapeando `/api` para `http://localhost:3001`.
- **Racional:** Permite que desenvolvedores trabalhem localmente usando a mesma URL relativa `/api/v1` sem disparar erros de CORS no navegador, espelhando com fidelidade o comportamento do Nginx em produção.
- **Alternativa descartada:** Obrigar o desenvolvedor a setar `VITE_API_URL=http://localhost:3001/api/v1` em dev e `/api/v1` em prod.

### Decisão 4: Repasse de Build Argument no Docker Compose
- **Escolha:** Adicionar `args: [VITE_API_URL]` no serviço `nginx` do `docker-compose.yml` e `ARG VITE_API_URL` / `ENV VITE_API_URL` no estágio `frontend-builder` do `frontend/Dockerfile`.
- **Racional:** Como o build do frontend é estático e executado em tempo de compilação da imagem Docker, o Vite precisa ter acesso à variável durante o `docker compose build`.

## Risks / Trade-offs

- **[Risco]** Esquecer de recompilar a imagem Docker do Nginx após alterar a variável no `.env`.
  - *Mitigação:* Como o fallback padrão já é `/api/v1`, o build padrão funciona imediatamente sem exigir nenhuma variável específica configurada no `.env`.
- **[Risco]** Rotas externas chamando `/health` direto sem prefixo `/api/v1`.
  - *Mitigação:* `sistemaApi.status()` requisita `/health`, que através de Axios com baseURL `/api/v1` resolve para `/api/v1/health`, condizente com a rota do Bun backend.

## Migration Plan

1. Atualizar `frontend/src/plugins/axios.ts` com fallback para `import.meta.env.VITE_API_URL || "/api/v1"`.
2. Atualizar `frontend/vite.config.ts` com `envDir` e `server.proxy`.
3. Atualizar `frontend/Dockerfile` e `docker-compose.yml` com os argumentos de build.
4. Adicionar `VITE_API_URL=/api/v1` em `.env.example` e no `.env` da raiz.
5. Recompilar o frontend com `docker compose --profile prod build nginx` e reiniciar os containers.
