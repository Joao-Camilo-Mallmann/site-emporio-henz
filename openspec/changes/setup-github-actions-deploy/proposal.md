## Why

Atualmente, o deploy na máquina de produção (VM) depende de intervenção manual: conectar via terminal SSH local, rodar `git pull` e disparar o `./deploy.sh`. Isso aumenta o atrito nas entregas e dificulta a rastreabilidade do que está em execução no servidor. Implementar um workflow no GitHub Actions permite acionar o deploy via SSH com um único clique no botão da interface web sob demanda (`workflow_dispatch`), sem necessidade de conexões de terminal locais.

## What Changes

- Criação de workflow do GitHub Actions (`.github/workflows/deploy.yml`) para orquestrar o deploy na VM via SSH (`appleboy/ssh-action`) acionado sob demanda via `workflow_dispatch`.
- Execução remota segura que atualiza a branch `main` (`git pull`), garante permissões e dispara o script canônico [`deploy.sh`](../../deploy.sh).
- Documentação clara em [`docs/infra/README.md`](../../docs/infra/README.md) sobre o provisionamento de credenciais via GitHub Secrets (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` ou `SSH_KEY`), grupo do Docker (`docker`) e segregação do arquivo `.env` na VM.
- Acionamento manual sob demanda (`workflow_dispatch`) no GitHub Actions evitando deploys automáticos involuntários a cada commit.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade inteiramente nova foi introduzida -->

### Modified Capabilities
- `containerized-deployment`: Adiciona os requisitos e cenários para esteira automatizada de Continuous Deployment (CD) via GitHub Actions conectando por SSH na VM de produção.

## Impact

- **Sistemas afetados**: Repositório GitHub (GitHub Actions e Secrets), VM de produção (permissões de usuário e execução do Docker).
- **Arquivos adicionados/modificados**:
  - Novo: `.github/workflows/deploy.yml`
  - Atualizado: `docs/infra/README.md`
- **Dependências**: Action de terceiros `appleboy/ssh-action@v1.0.3` no runner do GitHub.
- **Risco**: Baixo. O script [`deploy.sh`](../../deploy.sh) já existente na raiz permanece como a fonte de verdade para a subida dos containers na VM.
