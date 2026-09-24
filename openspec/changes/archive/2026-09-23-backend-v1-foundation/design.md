## Context

O backend do Empório Henz operava até o momento através de um único arquivo de prototipação (`apps/backend/src/index.ts`) servindo dados estáticos de produtos em memória (`mockProdutos`). Em paralelo, o monorepo já conta com uma infraestrutura robusta no pacote `packages/database`, onde as migrações relacionais (001 a 007) definem as tabelas essenciais (`roles`, `users`, `clients`, `suppliers`, `user_suppliers`) com suporte a soft delete, além de orquestração Docker completa (`postgres`, `backend`, `backend-dev`).

Para viabilizar a entrega da V1 do sistema, é necessário estruturar a camada de servidor em uma arquitetura limpa, escalável e modular, implementando os fluxos completos de autenticação JWT, autorização RBAC e os CRUDs centrais sem qualquer dependência externa desnecessária.

## Goals / Non-Goals

**Goals:**
- Reorganizar `apps/backend/src` em camadas modulares: `config`, `lib`, `middlewares`, `modules` e `routes`.
- Conectar o backend à base de dados PostgreSQL através de `packages/database/src/db.ts` utilizando o driver nativo `SQL` do Bun.
- Implementar utilitários nativos de segurança: hash de senha Argon2id via `Bun.password` e geração/validação de tokens JWT via Web Crypto API nativa (`crypto.subtle`).
- Criar os módulos RESTful sob `/api/v1/`:
  - `auth`: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`.
  - `users`: `/api/v1/users` (CRUD completo com JOIN unificado entre `users` e `clients`).
  - `suppliers`: `/api/v1/suppliers` (CRUD completo com soft delete).
  - `user-suppliers`: `/api/v1/users/:userId/suppliers` (gestão N:N de vínculos de vendedores com fornecedores).
- Implementar middlewares de segurança: autenticação Bearer JWT e autorização RBAC com bloqueio estrito `403 Forbidden` (`CUSTOMER = 1`, `SELLER = 2`, `ADMIN = 3`).
- Aplicar a política de exclusão lógica estrita (RNF08): todas as deleções utilizam `deleted_at = CURRENT_TIMESTAMP`, sem `DELETE` físico.
- Fornecer testes automatizados de integração utilizando `bun:test`.

**Non-Goals:**
- Integração ou alterações no frontend nesta etapa (mantendo o foco estrito no backend isolado).
- Implementação de catálogo de produtos, categorias, variações ou fotos (escopo reservado para a V2).
- Gestão de listas de clientes ou integrações com WhatsApp (escopo reservado para fases futuras).
- Adoção de frameworks externos pesados (Express, Fastify, NestJS) ou ORMs pesados (Prisma, TypeORM).

## Decisions

### 1. Centralização do Banco de Dados em `packages/database`
- **Decisão**: O backend consome a conexão `sql` exportada por `packages/database/src/db.ts`. As migrações residem exclusivamente em `packages/database/migrations/`.
- **Alternativas consideradas**:
  - Mover as migrações para dentro de `apps/backend/src/database`: Descartado por violar a diretriz *Database First* do projeto e quebrar a orquestração multi-estágio do Docker e o Turborepo.
- **Racional**: Garante fonte única da verdade (SSOT) para o esquema relacional, permitindo que migrações sejam executadas no container antes do bootstrap do servidor.

### 2. Versionamento `/api/v1/` e Convenção em Inglês
- **Decisão**: Todos os endpoints de negócio expostos pela API seguirão a convenção REST corporativa moderna com prefixo `/api/v1/` e substantivos no plural em inglês (`/api/v1/auth`, `/api/v1/users`, `/api/v1/suppliers`, `/api/v1/users/:id/suppliers`).
- **Alternativas consideradas**:
  - Roteamento `/api/` sem versão e em português: Descartado em favor de alinhamento com padrões internacionais de APIs e longevidade da arquitetura.
- **Racional**: O versionamento explícito desacopla a evolução da API e prepara o backend para futuras iterações sem quebras contratuais.

### 3. Unificação de `users` e `clients` no Módulo `users`
- **Decisão**: A camada de persistência (`users.repository.ts`) realiza o JOIN entre a tabela `users` (credenciais, e-mail, role) e a tabela `clients` (nome completo, telefone, cidade), expondo um contrato coeso de usuário na API.
- **Alternativas consideradas**:
  - Expor dois módulos e endpoints separados (`/api/v1/users` e `/api/v1/clients`): Descartado por gerar overhead e requisições adicionais desnecessárias para clientes da API.
- **Racional**: Preserva a integridade e normalização do banco relacional sem transferir a complexidade de junção para quem consome o backend.

### 4. Criptografia e JWT com APIs Nativas do Bun e Web Crypto
- **Decisão**: Hash de senha via `Bun.password.hash(pwd, "argon2id")` / `verify(pwd, hash)` e tokens JWT assinados via HMAC-SHA256 utilizando `crypto.subtle`.
- **Alternativas consideradas**:
  - Instalar bibliotecas externas (`bcrypt`, `jsonwebtoken`, `jose`): Descartado por adicionar dependências desnecessárias e reduzir a performance.
- **Racional**: Bun possui suporte de ponta a Argon2id e à Web Crypto API padrão, alcançando execução em milissegundos com zero dependências externas.

### 5. Validação de Schemas com Helpers Nativos TypeScript
- **Decisão**: Validação de corpo de requisição e query params através de funções tipadas puras em cada módulo (`*.schema.ts`).
- **Alternativas consideradas**:
  - Instalar `zod` ou `yup`: Descartado para manter o backend estritamente leve e sem sobrecarga de compilação.
- **Racional**: As entidades da V1 possuem esquemas objetivos e regras bem delimitadas, perfeitamente validadas por verificadores nativos.

## Risks / Trade-offs

- **[Risco] Dessincronização entre tabelas `users` e `clients` no cadastro**: Se a inserção em `clients` falhar após criar `users`, pode gerar registros órfãos.
  - *Mitigação*: Utilizar transações explícitas no PostgreSQL (`BEGIN/COMMIT/ROLLBACK`) na criação e no soft delete conjunto de usuários e clientes.
- **[Risco] Tentativa de login com usuário desativado logicamente**: Um usuário com credenciais corretas mas `deleted_at IS NOT NULL` poderia conseguir autenticar.
  - *Mitigação*: Todas as consultas de autenticação e busca incluem obrigatoriamente a cláusula `WHERE deleted_at IS NULL`.
- **[Risco] Vendedor operando dados de fornecedores aos quais não está vinculado**: Falha no isolamento de governança multi-empresa.
  - *Mitigação*: O middleware `role.ts` e as validações de serviço consultam ativamente a tabela `user_suppliers` para checar se o vínculo vendedor-fornecedor está ativo (`deleted_at IS NULL`).

## Migration Plan

1. **Validação do Banco**: Confirmar a integridade das migrações 001 a 007 em `packages/database`.
2. **Setup Estrutural**: Criar a árvore de diretórios em `apps/backend/src/` com utilitários e middlewares.
3. **Módulos Sequenciais**: Implementar `auth` -> `users` -> `suppliers` -> `user-suppliers`.
4. **Roteador Principal**: Conectar todos os módulos em `routes/index.ts` e exportar a instância de servidor em `server.ts` e `index.ts`.
5. **Verificação Automatizada**: Executar a suíte de testes com `bun test` e validar tipos com `bun run check-types`.
