# Spec Delta: containerized-deployment

## MODIFIED Requirements

### Requirement: Orquestração Segura via Docker Compose
The system MUST provide a `docker-compose.yml` orchestrating `postgres`, `migration`, `backend`, and `nginx` services with explicit dependency ordering between migration and backend.

#### Scenario: Isolamento de rede do PostgreSQL
- **WHEN** a stack Docker Compose estiver em execução
- **THEN** a porta do serviço `postgres` DEVE ser mapeada de forma parametrizável (`${POSTGRES_PORT:-5432}:5432`) e os serviços se comunicam pela rede interna `emporio_net`

#### Scenario: Persistência de dados do PostgreSQL
- **WHEN** o container do PostgreSQL for reiniciado ou recriado
- **THEN** todos os dados DEVEM ser preservados através de volume nomeado persistente (`postgres_data`)

#### Scenario: Inicialização ordenada do backend após migrações
- **WHEN** a stack completa for iniciada via Docker Compose
- **THEN** o serviço `backend` DEVE aguardar a conclusão bem-sucedida do container `migration` antes de iniciar a execução da API

## ADDED Requirements

### Requirement: Otimização de Build com .dockerignore
The project root MUST maintain a `.dockerignore` file excluding dependency caches, version control data, and temporary build outputs from the Docker build context.

#### Scenario: Transferência de contexto reduzida
- **WHEN** o comando `docker compose build` for executado
- **THEN** diretórios como `node_modules`, `.git`, `.turbo` e `dist` NÃO DEVEM ser enviados para o daemon do Docker
