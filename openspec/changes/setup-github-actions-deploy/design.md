## Context

O projeto Empório Henz possui um script [`deploy.sh`](../../deploy.sh) testado e funcional na raiz do repositório, que executa o fluxo completo de atualização da aplicação via Docker Compose na VM (build multi-stage, checagem do `.env`, espera do healthcheck do PostgreSQL, subida do backend com migrações automáticas e subida do Nginx).
No entanto, a execução desse script dependia de acesso manual via SSH por parte do desenvolvedor. Para garantir integração e entrega contínua (CI/CD), é necessário configurar um pipeline no GitHub Actions que conecte na VM via SSH e acione essa esteira de deploy sempre que houver novos commits na branch `main` ou quando disparado manualmente.

## Goals / Non-Goals

**Goals:**
- Configurar workflow do GitHub Actions em `.github/workflows/deploy.yml` acionado em `push` na branch `main` e via `workflow_dispatch`.
- Utilizar a action `appleboy/ssh-action` para executar de forma remota e não interativa o comando de atualização e deploy.
- Garantir a execução da sequência `cd <caminho> && git checkout main && git pull origin main && chmod +x deploy.sh && ./deploy.sh`.
- Isolar segredos e credenciais de acesso (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` ou `SSH_KEY`, `SSH_PORT`) em GitHub Secrets.
- Atualizar a documentação de infraestrutura em `docs/infra/README.md` explicando a configuração dos secrets, a necessidade do grupo `docker` no usuário Linux e a segregação do arquivo `.env` na VM.

**Non-Goals:**
- Alterar a lógica interna do [`deploy.sh`](../../deploy.sh) ou a arquitetura dos containers (`docker-compose.yml`).
- Enviar o arquivo `.env` ou senhas de banco de dados pelo GitHub Actions (o `.env` continua residindo exclusivamente na VM).
- Configurar deploys para múltiplos ambientes (staging/produção separados); o foco é o ambiente único de produção da VM.

## Decisions

### 1. Action de SSH: `appleboy/ssh-action`
- **Decisão**: Utilizar `appleboy/ssh-action@v1.0.3` no GitHub Actions.
- **Alternativas consideradas**:
  - *Comando SSH nativo no runner*: Exige configurar `ssh-keyscan`, `ssh-agent` e lidar com known_hosts manualmente, aumentando a fragilidade do workflow.
  - *Webhook local / Portainer*: Exige expor porta HTTP extra na VM e configurar listeners com token.
- **Justificativa**: A action `appleboy/ssh-action` é o padrão da indústria no GitHub Actions para execução de comandos remotos via SSH, com suporte maduro a chaves e senhas, timeout e `script_stop: true`.

### 2. Executar `git pull origin main` no SSH antes de rodar `./deploy.sh`
- **Decisão**: O comando disparado pelo SSH executa explicitamente `git pull origin main` antes de `./deploy.sh`.
- **Alternativas consideradas**:
  - *Chamar apenas `./deploy.sh`*: O script já tem um `git pull` interno, porém se o próprio `deploy.sh` sofrer alterações em um commit, a VM executaria a versão anterior do script que já estava em disco, além do risco de corrupção de buffer de leitura do bash durante o pull.
- **Justificativa**: Garantir que o repositório e o próprio script de deploy estejam atualizados antes da execução.

### 3. Segregação de Credenciais (GitHub Secrets vs VM `.env`)
- **Decisão**: Manter no GitHub Secrets apenas o estritamente necessário para estabelecer o canal SSH (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` / `SSH_KEY`, `SSH_PORT`). Variáveis de banco de dados (`POSTGRES_PASSWORD`, etc.) e aplicação residem no `.env` pré-existente na VM.
- **Justificativa**: Menor superfície de ataque e princípio do menor privilégio.

## Risks / Trade-offs

- **[Risco] Usuário SSH sem permissão para executar Docker sem sudo** → **Mitigação**: O usuário deve ser adicionado previamente ao grupo `docker` na VM (`sudo usermod -aG docker $USER`), conforme registrado em `docs/infra/README.md`.
- **[Risco] Conflito de merge na VM caso haja alterações manuais locais** → **Mitigação**: Documentar a regra de que arquivos rastreados pelo Git não devem ser editados diretamente no servidor de produção.
- **[Risco] Bloqueio de porta SSH por firewall** → **Mitigação**: Garantir que a porta SSH (padrão 22) esteja liberada para os IPs do GitHub Actions ou com regras adequadas.
