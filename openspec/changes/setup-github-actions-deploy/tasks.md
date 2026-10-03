<!-- Issue rastreada: https://github.com/Joao-Camilo-Mallmann/site-emporio-henz/issues/64 -->
## 1. GitHub Actions Workflow (CI/CD) [Issue #64]

- [x] 1.1 Criar o diretório `.github/workflows` e o arquivo `deploy.yml` com gatilho manual sob demanda `workflow_dispatch`
- [x] 1.2 Configurar o step de SSH utilizando `appleboy/ssh-action@v1.0.3` mapeando os secrets `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` e `SSH_PORT`
- [x] 1.3 Implementar a sequência de comandos remotos (`cd`, `git checkout main`, `git pull origin main`, `chmod +x deploy.sh`, `./deploy.sh`) com `script_stop: true`

## 2. Documentação e Governança

- [x] 2.1 Atualizar `docs/infra/README.md` adicionando a seção de Continuous Deployment (CD via GitHub Actions) e a tabela de secrets necessários
- [x] 2.2 Documentar em `docs/infra/README.md` os pré-requisitos na VM (usuário no grupo `docker`, arquivo `.env` local e clone do repositório)
