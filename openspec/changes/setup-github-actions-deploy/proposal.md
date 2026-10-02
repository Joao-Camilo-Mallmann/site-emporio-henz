## Why

Atualmente, o deploy na máquina de produção (VM) depende de intervenção manual: conectar via terminal SSH, rodar `git pull` e disparar o `./deploy.sh`. Isso aumenta o atrito nas entregas, abre margem para esquecimento de atualização e dificulta a rastreabilidade do que está em execução no servidor. Implementar uma esteira de entrega contínua (CD) via GitHub Actions automatiza o processo a cada merge na branch `main` e permite acionamento manual sob demanda.

## What Changes

- Criação de workflow do GitHub Actions (`.github/workflows/deploy.yml`) para orquestrar o deploy na VM via SSH (`appleboy/ssh-action`).
- Execução remota segura que atualiza a branch `main` (`git pull`), garante permissões e dispara o script canônico [`deploy.sh`](../../deploy.sh).
- Documentação clara em [`docs/infra/README.md`](../../docs/infra/README.md) sobre o provisionamento de credenciais via GitHub Secrets (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` ou `SSH_KEY`), grupo do Docker (`docker`) e segregação do arquivo `.env` na VM.
- Suporte a gatilho manual (`workflow_dispatch`) no GitHub Actions para permitir re-deploys sem commits adicionais.

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
