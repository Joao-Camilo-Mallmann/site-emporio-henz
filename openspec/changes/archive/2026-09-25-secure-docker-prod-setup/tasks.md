# Tasks

## 1. Ajustes de Segurança no Docker Compose

- [x] 1.1 Configurar bind exclusivo ao endereço de loopback (`127.0.0.1:${POSTGRES_PORT}:5432`) no serviço `postgres` em `docker-compose.yml` e verificar a configuração executando `docker compose config`
- [x] 1.2 Remover a seção `ports` do serviço `backend` (perfil `prod`) em `docker-compose.yml` para isolá-lo estritamente na rede interna `emporio_net` e verificar a sintaxe do arquivo
- [x] 1.3 Adicionar o mapeamento da porta HTTPS (`${PORT_HTTPS}:443`) ao serviço `nginx` (perfil `prod`) em `docker-compose.yml` e verificar a sintaxe do arquivo

## 2. Variáveis de Ambiente e Automação de Deploy

- [x] 2.1 Atualizar `.env.example` incluindo `PORT_HTTPS=443`, instruções de segurança para geração de senhas seguras na VM e comandos para túnel SSH ao PostgreSQL
- [x] 2.2 Revisar `deploy.sh` garantindo mensagens informativas sobre o isolamento das portas em produção e checagem de variáveis de ambiente

## 3. Validação e Testes

- [x] 3.1 Executar a validação dos perfis do Compose via `docker compose --profile prod config` e `docker compose --profile dev config` garantindo que os perfis não conflitem
- [x] 3.2 Executar `openspec validate secure-docker-prod-setup` para confirmar conformidade dos artefatos da especificação
