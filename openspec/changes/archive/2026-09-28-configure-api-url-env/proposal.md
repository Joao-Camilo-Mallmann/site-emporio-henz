# Proposal

## Why

Atualmente o frontend em produção tenta realizar requisições para `http://localhost:3001/api/v1/auth/login` porque o cliente Axios em `frontend/src/plugins/axios.ts` possui a URL fixa (hardcoded) para `localhost:3001`. Quando acessado em produção através de `http://177.44.248.90/login`, o navegador do usuário tenta alcançar a porta 3001 da sua própria máquina cliente, resultando em erro de conexão (`CORS request did not succeed` / `Network Error`).

Além disso, a URL base da API não está sendo configurada a partir do arquivo `.env` central da raiz do projeto, forçando o cliente Axios a usar valores estáticos.

## What Changes

- Configurar o cliente Axios (`frontend/src/plugins/axios.ts`) para resolver dinamicamente `baseURL` através de `import.meta.env.VITE_API_URL`, utilizando como fallback seguro a URL relativa `/api/v1`.
- Configurar `envDir: "../"` no Vite (`frontend/vite.config.ts`) para que o frontend leia o arquivo `.env` unificado localizado na raiz do repositório durante o desenvolvimento local.
- Configurar proxy de desenvolvimento no Vite (`server.proxy`) mapeando `/api` para `http://localhost:3001`, permitindo chamadas relativas em dev e prod com a mesma consistência.
- Repassar a variável de build `VITE_API_URL` no `docker-compose.yml` e `frontend/Dockerfile` para que builds de produção via Nginx recebam o valor definido no `.env` da raiz.
- Documentar a variável `VITE_API_URL` no `.env.example` da raiz com valor padrão `/api/v1`.

## Capabilities

### New Capabilities
*(Nenhuma nova capacidade introduzida)*

### Modified Capabilities
- `auth-store-and-interceptor`: Ajustar o requisito de inicialização do cliente Axios para priorizar `import.meta.env.VITE_API_URL` e utilizar `/api/v1` como fallback relativo padrão seguro (Same-Origin).

## Impact

- **Frontend**: `frontend/src/plugins/axios.ts`, `frontend/vite.config.ts`, `frontend/Dockerfile`.
- **Infraestrutura/Docker**: `docker-compose.yml`, `.env.example`, `.env`.
- **Segurança e Redes**: Elimina o vazamento/exposição de chamadas para `localhost:3001` no navegador de clientes em produção; elimina requisições preflight de CORS desnecessárias ao utilizar Same-Origin através do proxy reverso do Nginx.
