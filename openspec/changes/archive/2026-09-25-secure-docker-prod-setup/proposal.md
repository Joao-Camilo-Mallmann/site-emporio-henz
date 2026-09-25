# Proposal

## Why

Atualmente, ao executar a stack de produção na VM pública, o PostgreSQL e o Backend expõem suas portas (`5432` e `3001`) diretamente para a interface pública do host (`0.0.0.0`), deixando o banco de dados e a API vulneráveis a varreduras de bots, tentativas de invasão e bypass das proteções do Nginx. É necessário blindar a stack de produção isolando o banco de dados e o backend na rede interna do Docker (e loopback `127.0.0.1`), deixando apenas o Nginx como porta de entrada pública (`80` e `443`), ao mesmo tempo em que se preserva a ergonomia e o acesso direto às portas locais durante o desenvolvimento (`dev`).

## What Changes

- **Blindagem do PostgreSQL**: Modificar o mapeamento de portas do PostgreSQL no `docker-compose.yml` para vincular exclusivamente à interface local (`127.0.0.1:${POSTGRES_PORT}:5432`), impedindo que o banco seja acessível a partir da internet pública na VM, enquanto continua perfeitamente utilizável em desenvolvimento local (`localhost:5432`) ou via túnel SSH.
- **Isolamento do Backend em Produção**: Remover o mapeamento de portas públicas (`ports`) do serviço `backend` (perfil `prod`), garantindo que o backend se comunique estritamente através da rede interna `emporio_net` com o Nginx (`http://backend:3001`).
- **Preservação do Backend em Desenvolvimento**: Manter a exposição da porta `${BACKEND_PORT}:3001` no serviço `backend-dev` (perfil `dev`) para facilitar testes de API (Postman/Swagger) e desenvolvimento local.
- **Exposição de Portas no Nginx**: Adicionar suporte explícito à porta HTTPS (`${PORT_HTTPS}:443`) no serviço `nginx` junto à porta HTTP (`${PORT_HTTP}:80`), estabelecendo o Nginx como o único ponto de contato público do cluster.
- **Atualização do Template de Variáveis (`.env.example`)**: Documentar as novas variáveis e orientações de segurança para ambientes de produção e desenvolvimento.
- **Revisão do Script de Deploy (`deploy.sh`)**: Garantir que as verificações e inicializações contemplem os perfis seguros de produção.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `containerized-deployment`: Atualiza os requisitos de isolamento de rede e exposição de portas no Docker Compose, estabelecendo que o PostgreSQL deve vincular apenas ao loopback local (`127.0.0.1`) e que o serviço backend de produção não deve expor portas no host, delegando todo o tráfego público para o Nginx nas portas 80/443.

## Impact

- **Código Afetado**: `docker-compose.yml`, `.env.example`, `deploy.sh`.
- **APIs & Conectividade**: O backend não poderá mais ser acessado diretamente pela porta 3001 a partir da internet pública em produção; todo o tráfego deve passar pelo Nginx (`/api/`). Em ambiente `dev`, o comportamento permanece inalterado.
- **Banco de Dados**: O PostgreSQL não aceitará conexões externas vindas da internet pública na VM; acessos administrativos remotos deverão ser realizados via túnel SSH.
