# Tasks

## 1. Configuração do Cliente Axios e Variáveis de Ambiente

- [x] 1.1 Atualizar `frontend/src/plugins/axios.ts` para configurar `baseURL` como `import.meta.env.VITE_API_URL || "/api/v1"` e verificar que requisições utilizam o fallback relativo por padrão
- [x] 1.2 Atualizar `.env.example` e `.env` na raiz do repositório adicionando `VITE_API_URL=/api/v1` e documentando seu comportamento em dev e prod

## 2. Integração com Vite e Docker

- [x] 2.1 Configurar `envDir: "../"` e proxy reverso local para `/api` em `frontend/vite.config.ts` e verificar que o Vite carrega as configurações sem erros
- [x] 2.2 Atualizar o estágio `frontend-builder` em `frontend/Dockerfile` com `ARG VITE_API_URL` e `ENV VITE_API_URL=$VITE_API_URL`
- [x] 2.3 Atualizar a seção `build` do serviço `nginx` em `docker-compose.yml` para repassar o argumento `VITE_API_URL: ${VITE_API_URL:-/api/v1}`

## 3. Validação e Build

- [x] 3.1 Executar o build estático do frontend (`bun run build` dentro de `frontend/`) e validar que a compilação é concluída com sucesso
