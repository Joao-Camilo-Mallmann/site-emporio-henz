# Design

## Context

A infraestrutura conteinerizada utiliza um único arquivo `docker-compose.yml` que orquestra serviços de banco de dados (`postgres`), aplicação backend e proxy web/frontend (`nginx`), gerenciados via `profiles: ["prod"]` e `profiles: ["dev"]`. Conforme documentado em `proposal.md`, a configuração anterior expunha portas críticas (`5432` e `3001`) na interface universal `0.0.0.0` do host, permitindo que conexões externas contornassem a camada de proteção do proxy reverso.

## Goals / Non-Goals

**Goals:**
- Proteger o PostgreSQL na VM contra varreduras e ataques externos vinculando sua porta exclusivamente ao loopback (`127.0.0.1`).
- Eliminar a exposição externa da porta `3001` do backend no perfil de produção, canalizando todo o tráfego externo através do Nginx.
- Adicionar mapeamento da porta HTTPS (`443`) no serviço Nginx para suportar conexões seguras na internet.
- Preservar integralmente o fluxo de desenvolvimento local (`dev`), mantendo o hot-reload e as portas acessíveis no host (`3000`, `3001`, `5432`).
- Atualizar a documentação e templates de ambiente (`.env.example`) com orientações de hardening.

**Non-Goals:**
- Configuração de certificados SSL específicos (Certbot/Let's Encrypt vs Cloudflare) dentro do container Nginx neste momento; o container suportará a porta 443 mapeada para que qualquer terminação TLS (seja via Cloudflare Proxy ou Nginx SSL) funcione sem alterar a orquestração do compose.
- Modificação na arquitetura multi-stage do `Dockerfile` ou na lógica interna da API e do frontend.

## Decisions

### Decisão 1: Bind do PostgreSQL restrito a `127.0.0.1` no Compose
- **Escolha**: Alterar `ports` de `"${POSTGRES_PORT:-5432}:5432"` para `"127.0.0.1:${POSTGRES_PORT:-5432}:5432"`.
- **Justificativa**: Garante que o PostgreSQL só responda a requisições originadas na própria máquina host (loopback), impedindo conexões vindas da internet pública na VM. Ao mesmo tempo, permite que ferramentas de banco (DBeaver, TablePlus) continuem conectando em `localhost:5432` durante o desenvolvimento local e via túnel SSH (`ssh -L`) em produção.
- **Alternativas consideradas**:
  - *Remover completamente a seção `ports`*: Dificultaria o desenvolvimento local fora do container (ex: rodar scripts de migração locais ou conectar clientes SQL gráficos sem docker exec).
  - *Usar compose files separados (`docker-compose.prod.yml`)*: Rejeitado pelo usuário para manter a simplicidade de um único arquivo com profiles (Caso B).

### Decisão 2: Remoção da seção `ports` no serviço `backend` (produção)
- **Escolha**: Deletar a diretiva `ports` de `backend` no `docker-compose.yml`.
- **Justificativa**: O Nginx e o backend compartilham a rede interna `emporio_net`. O Nginx realiza o encaminhamento de requisições através do DNS interno do Docker (`proxy_pass http://backend:3001`). Expor a porta 3001 no host da VM em produção é desnecessário e cria uma rota de bypass das regras do Nginx.
- **Alternativas consideradas**:
  - *Mapear porta para 127.0.0.1 no backend*: Desnecessário, pois nenhuma ferramenta externa precisa se comunicar diretamente com o backend na VM além do próprio Nginx.

### Decisão 3: Exposição de portas HTTP e HTTPS no Nginx
- **Escolha**: Mapear as portas `"${PORT_HTTP:-80}:80"` e `"${PORT_HTTPS:-443}:443"` no container `nginx`.
- **Justificativa**: Estabelece o Nginx como o único ponto de contato público do cluster. Se o operador optar por terminação TLS na VM (Certbot) ou Cloudflare Full SSL, a porta 443 já estará devidamente roteada.

### Decisão 4: Preservação dos serviços `dev`
- **Escolha**: `backend-dev` e `web-dev` mantêm seus mapeamentos de portas e volumes atuais.
- **Justificativa**: Garante que `docker compose --profile dev up` ou `bun run docker:dev` continuem funcionando sem nenhuma fricção para a equipe de desenvolvimento.

## Risks / Trade-offs

- **[Risco] Acesso administrativo ao banco na VM**: Desenvolvedores acostumados a conectar clientes gráficos diretamente no IP público da VM não conseguirão mais conectar.
  - *Mitigação*: Documentar o uso de túnel SSH (`ssh -L 5432:localhost:5432 usuario@ip-da-vm`) no README / `.env.example`.
- **[Risco] Conflito de porta 443 na VM**: Caso a máquina host já possua outro serviço escutando na porta 443.
  - *Mitigação*: Parametrizar a porta via `${PORT_HTTPS:-443}:443`, permitindo customização no `.env` se necessário.

## Migration Plan

1. Atualizar o arquivo `.env` na VM com base nas novas orientações do `.env.example`.
2. Executar `./deploy.sh` na VM para reconstruir e recriar os containers com as novas definições de rede.
3. Validar via `docker compose ps` e `curl` externo que apenas as portas 80/443 estão acessíveis externamente e que as portas 5432 e 3001 estão inacessíveis pela internet pública.
