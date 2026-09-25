# Spec Delta

## MODIFIED Requirements

### Requirement: Orquestração Segura via Docker Compose

The system MUST provide a `docker-compose.yml` orchestrating `postgres`, `backend`, `nginx`, `backend-dev`, and `web-dev` services segmented by environment profiles without requiring `COMPOSE_PROFILES` in `.env`, with backend services starting once postgres is healthy, ensuring strict port isolation for production.

#### Scenario: Subida de serviços em desenvolvimento

- **WHEN** o ambiente for iniciado em modo de desenvolvimento (`NODE_ENV=development`)
- **THEN** o Docker DEVE iniciar apenas os serviços de desenvolvimento (`postgres`, `backend-dev`, `web-dev`), mapeando volumes locais do código-fonte para hot-reload, expondo as portas locais de desenvolvimento (`3000` para web e `3001` para backend) e NÃO iniciando o Nginx nem compilando artefatos de produção

#### Scenario: Subida de serviços em produção

- **WHEN** o ambiente for iniciado em modo de produção (`NODE_ENV=production`)
- **THEN** o Docker DEVE iniciar os serviços de produção (`postgres`, `backend`, `nginx`), compilando imagens de produção e servindo os estáticos e API via Nginx

#### Scenario: Isolamento de rede do PostgreSQL

- **WHEN** a stack Docker Compose estiver em execução
- **THEN** a porta do serviço `postgres` DEVE ser mapeada com bind restrito ao endereço de loopback (`127.0.0.1:${POSTGRES_PORT:-5432}:5432`), garantindo acessibilidade local na máquina ou via túnel SSH sem expor o banco de dados para a internet pública na VM

#### Scenario: Isolamento do backend em produção e ponto único de entrada Nginx

- **WHEN** a stack Docker Compose for executada no perfil de produção
- **THEN** o serviço `backend` NÃO DEVE expor portas diretamente no host da VM, comunicando-se exclusivamente pela rede interna `emporio_net`, e o serviço `nginx` DEVE ser o único serviço com portas públicas de entrada (`80` e `${PORT_HTTPS:-443}:443`)

#### Scenario: Persistência de dados do PostgreSQL

- **WHEN** o container do PostgreSQL for reiniciado ou recriado
- **THEN** todos os dados DEVEM ser preservados através de volume nomeado persistente (`postgres_data`)

#### Scenario: Inicialização ordenada do backend após PostgreSQL saudável

- **WHEN** a stack for iniciada via Docker Compose
- **THEN** os serviços backend DEVEM aguardar a condição saudável (`condition: service_healthy`) do serviço `postgres` antes de iniciar a execução e o runner interno de migração
