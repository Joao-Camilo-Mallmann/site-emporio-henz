# Design: Esquema de Banco para PR 1 e Orquestração Docker

## Context

O projeto Empório Henz está na fase de fundação técnica e arquitetura (PR 1). A persistência para este estágio foca nos perfis de acesso, credenciais de usuários, perfis cadastrais de clientes e governança de fornecedores com vínculos de vendedores (tabela associativa `user_suppliers`).

As tabelas de catálogo (produtos, variações, fotos, categorias e listas) foram formalmente excluídas do escopo do PR 1 para evitar migrações prematuras e manter os PRs focados e de fácil revisão.

## Goals / Non-Goals

**Goals:**
- Configurar o esquema inicial em `packages/database/migrations` criando exclusivamente: `roles`, `users`, `clients`, `suppliers` e `user_suppliers`.
- Adicionar seed dos perfis de acesso padrão em `roles` (1=Cliente, 2=Vendedor, 3=Admin).
- Adicionar chave estrangeira formal entre `users.role` e `roles.id`, e campo `city` em `users`.
- Manter o isolamento multi-empresa com `user_suppliers` e índice de unicidade ativo.
- Criar `.dockerignore` e ajustar `docker-compose.yml` para sincronizar a inicialização do backend com o runner de migração.

**Non-Goals:**
- Criar ou migrar tabelas de produtos, categorias ou listas (serão implementadas em PRs dedicados do catálogo).
- Alterar telas ou componentes do frontend.

## Decisions

### Decisão 1: Modularizar migrações em arquivos atômicos por entidade
- **Escolha**: Dividir o esquema em 6 migrações granulares (`001_setup_extensions.sql`, `002_create_roles.sql`, `003_create_users.sql`, `004_create_clients.sql`, `005_create_suppliers.sql`, `006_create_user_suppliers.sql`).
- **Racional**: Garante clareza, manutenibilidade, rastreabilidade no histórico de migrações e isolamento de falhas por tabela/domínio, respeitando o princípio de responsabilidade única.

### Decisão 2: Condição `service_completed_successfully` no Docker Compose
- **Escolha**: O serviço `backend` depende de `migration` com `condition: service_completed_successfully`.
- **Racional**: Garante que qualquer tentativa de consulta ao banco pelo backend só ocorra após o PostgreSQL estar saudável e as migrações concluídas.

### Decisão 3: Criação do `.dockerignore`
- **Escolha**: Arquivo `.dockerignore` na raiz excluindo `node_modules`, `.git`, `.turbo`, `dist`, logs e `.env`.
- **Racional**: Reduz o contexto enviado ao Docker de ~70 MB para ~15 KB, diminuindo o tempo de build em mais de 65%.

## Risks / Trade-offs

- **[Risco] Banco existente com resquícios de tabelas de desenvolvimento**:
  - *Mitigação*: Reset do banco via `docker compose down -v` assegura que o ambiente local e de CI execute as migrações a partir de um estado limpo. Além disso, `001_setup_extensions.sql` inclui `DROP TABLE IF EXISTS ... CASCADE` defensivo.
