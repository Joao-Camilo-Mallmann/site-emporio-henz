## ADDED Requirements

### Requirement: Dockerfile Multi-stage Unificado

O repositório DEVE possuir um único `Dockerfile` com múltiplos estágios para build do frontend, runtime do backend, executor de migração e runtime do Nginx.

#### Scenario: Build da imagem do frontend

- **WHEN** o estágio de frontend for compilado via Docker
- **THEN** os arquivos estáticos de produção do Vue 3/Vite DEVEM ser gerados no diretório de saída sem requerer build local na máquina host

#### Scenario: Estágio one-shot de migração

- **WHEN** o target de migração do Dockerfile for executado
- **THEN** o container DEVE executar o script `migrate.ts` com Bun e finalizar o processo

### Requirement: Orquestração Segura via Docker Compose

O sistema DEVE disponibilizar arquivo `docker-compose.yml` orquestrando os serviços `postgres`, `migration`, `backend` e `nginx`.

#### Scenario: Isolamento de rede do PostgreSQL

- **WHEN** a stack Docker Compose estiver em execução
- **THEN** a porta 5432 do serviço `postgres` NÃO DEVE ser exposta externamente na rede pública da VM, sendo acessível apenas pelos containers na rede interna

#### Scenario: Persistência de dados do PostgreSQL

- **WHEN** o container do PostgreSQL for reiniciado ou recriado
- **THEN** todos os dados DEVEM ser preservados através de volume nomeado persistente (`postgres_data`)

### Requirement: Proxy Reverso e Servidor Estático Nginx

O container `nginx` DEVE ser o único ponto de entrada público na porta 80 da máquina.

#### Scenario: Acesso à interface web

- **WHEN** uma requisição HTTP for enviada para a raiz (`/`)
- **THEN** o Nginx DEVE servir os arquivos estáticos compilados do frontend

#### Scenario: Encaminhamento de rotas da API

- **WHEN** uma requisição HTTP for enviada para caminhos iniciando em `/api/` ou `/health`
- **THEN** o Nginx DEVE encaminhar a requisição para o container do backend mantendo cabeçalhos e status adequados

### Requirement: Script de Automação de Deploy Local

O sistema DEVE fornecer o script executável `deploy.sh` para automação dos passos de atualização e subida na VM.

#### Scenario: Execução do script de deploy

- **WHEN** o operador executar `./deploy.sh` na VM
- **THEN** o script DEVE atualizar o código via Git, construir imagens Docker, subir o PostgreSQL, rodar migrações pendentes e reiniciar os serviços da aplicação
