## Why

Atualmente, o backend do Empório Henz opera com um arquivo único contendo dados simulados em memória (`mockProdutos`), sem persistência no PostgreSQL, sem autenticação real e sem governança de permissões. Para viabilizar a entrega da V1 da plataforma e estabelecer a base sobre a qual todos os módulos de negócios (produtos, catálogo, listas e pedidos) serão construídos, é fundamental implementar a fundação de infraestrutura, autenticação JWT, gestão de usuários, gestão de fornecedores e controle de acesso baseado em papéis (RBAC) no backend Bun nativo.

## What Changes

- **Infraestrutura Modular do Servidor Bun**: Estruturação de `apps/backend/src` em camadas (config, lib, middlewares, modules e routes), substituindo o arquivo monolítico por uma arquitetura desacoplada e tipada.
- **Integração com PostgreSQL**: Conexão do backend à base de dados relacional através de `packages/database`, consumindo o cliente nativo do Bun (`SQL`) e validando as migrações existentes.
- **Módulo de Autenticação JWT e Hash Seguro**: Implementação de utilitários de criptografia Argon2id (`Bun.password`) e emissão/verificação de tokens JWT via Web Crypto API nativa (`crypto.subtle`).
- **Rotas de Autenticação**: Endpoints `/api/v1/auth/login`, `/api/v1/auth/register` (autocadastro de clientes) e `/api/v1/auth/me` (perfil da sessão).
- **Middlewares de Segurança**: Interceptor de autenticação Bearer (`auth.ts`) e controle de acesso baseado em papéis (`role.ts`) com bloqueio estrito `403 Forbidden`.
- **Módulo de Gestão de Usuários**: CRUD de usuários com abstração unificada no repositório das tabelas `users` e `clients`, expondo dados completos e aplicando soft delete (`deleted_at`).
- **Módulo de Gestão de Fornecedores**: CRUD completo de fornecedores e fábricas parceiras com soft delete e restrição administrativa.
- **Módulo de Vínculos Vendedor-Fornecedor**: Endpoints administrativos para atribuição e revogação de vínculos N:N entre vendedores (`SELLER`) e fornecedores em `user_suppliers`.
- **Suíte de Testes Automatizados**: Testes de integração em `bun:test` cobrindo o fluxo de ponta a ponta dos endpoints e middlewares da V1.

## Capabilities

### New Capabilities
- `backend-foundation-infra`: Servidor HTTP Bun nativo estruturado em camadas com roteamento tipado sob o prefixo `/api/v1/`, tratamento centralizado de erros e conexão com PostgreSQL.
- `backend-auth`: Módulo de autenticação com login, autocadastro de clientes, inspeção do perfil autenticado e emissão de tokens JWT com hash Argon2id.
- `backend-middlewares-rbac`: Interceptor de token Bearer JWT e middleware de autorização por papéis (`CUSTOMER = 1`, `SELLER = 2`, `ADMIN = 3`) com bloqueio `403 Forbidden`.
- `backend-users`: CRUD administrativo de usuários com JOIN entre `users` e `clients`, filtros por busca/papel e exclusão lógica via soft delete.
- `backend-suppliers`: CRUD de fornecedores e marcas parceiras com validações de unicidade e soft delete.
- `backend-user-suppliers`: Gestão de permissões multi-empresa com vínculo N:N entre vendedores e fornecedores.

### Modified Capabilities
<!-- Nenhuma especificação anterior teve seus requisitos alterados; esta proposta estabelece as capacidades fundamentais do backend. -->

## Impact

- **Código Afetado**: `apps/backend/src/index.ts` será refatorado na nova arquitetura modular em `apps/backend/src/`.
- **Banco de Dados**: Consome as tabelas já migradas em `packages/database` (`roles`, `users`, `clients`, `suppliers`, `user_suppliers`).
- **APIs e Rotas**: Exposição da árvore de endpoints sob o prefixo canônico `/api/v1/`.
- **Dependências**: Zero novas dependências de terceiros; utiliza exclusivamente recursos nativos do Bun (`Bun.serve`, `Bun.password`, Web Crypto API e `bun:test`).
- **Compatibilidade**: Focado exclusivamente no backend nesta etapa, com testes automatizados isolados e prontos para futuro consumo pelo frontend.
