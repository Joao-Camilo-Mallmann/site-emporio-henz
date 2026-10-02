## ADDED Requirements

### Requirement: Pipeline de Deploy Automatizado via GitHub Actions (CI/CD SSH)

The repository MUST provide a GitHub Actions workflow in `.github/workflows/deploy.yml` that establishes an SSH connection with the production VM and executes the deployment sequence upon code pushes to the `main` branch or manual trigger.

#### Scenario: Execução automática após push na branch main
- **WHEN** houver um push ou merge de commit na branch `main`
- **THEN** o workflow do GitHub Actions DEVE iniciar, conectar na VM configurada via secrets SSH, atualizar o repositório para o estado mais recente de `main` e disparar o script de deploy `./deploy.sh`

#### Scenario: Disparo manual via workflow_dispatch
- **WHEN** um operador disparar o workflow manualmente através da interface do GitHub Actions (`workflow_dispatch`)
- **THEN** o pipeline DEVE executar o mesmo fluxo de deploy via SSH sem necessidade de novos commits

#### Scenario: Falha de deploy e encerramento seguro
- **WHEN** qualquer comando remoto falhar (como erro no build Docker ou falha de conectividade Git)
- **THEN** a sessão SSH DEVE ser interrompida imediatamente (`script_stop: true`), o step DEVE ser marcado como falho no GitHub Actions e a conexão DEVE ser encerrada
