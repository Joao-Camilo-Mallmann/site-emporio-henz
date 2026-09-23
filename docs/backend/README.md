# Documentação de Back-end — Empório Henz

Este diretório concentra a documentação de arquitetura de servidor, rotas da API, modelagem orientada a objetos (diagrama de classes) e regras de negócio do Portal Empório Henz.

---

## ⚙️ Diretrizes Arquiteturais (Back-end)

Conforme estabelecido em [agents.md](../../agents.md) e [apps/backend/agents.md](../../apps/backend/agents.md):

1. **Stack Técnica**:
   - **Runtime**: [Bun](https://bun.sh/) (1.4+) executando nativamente com `Bun.serve`.
   - **Linguagem**: TypeScript com modo estrito (`strict: true`).
   - **Path Aliases**: Alias `@/` configurado para `apps/backend/src/*` e `@database/` para `packages/database/*`.
   - **Banco de Dados**: PostgreSQL 16 conectado via driver nativo `SQL` do Bun em `packages/database`.
   - **Criptografia e Segurança**: Argon2id nativo via `Bun.password` e JWT com HMAC-SHA256 via Web Crypto API nativa (`crypto.subtle`).
   - **Testes**: `bun:test` para suíte completa de testes unitários e de integração (49+ testes automatizados).

2. **Estrutura Modular em Camadas (`apps/backend/src`)**:
   - `config/`: Configurações de ambiente (`env.ts`) e conexão de banco com health check (`database.ts`).
   - `lib/`: Utilitários reutilizáveis de resposta HTTP (`response.ts`), roteador nativo (`router.ts`), senhas (`password.ts`), JWT (`jwt.ts`) e classes de erro de domínio (`errors.ts`).
   - `middlewares/`: Interceptadores de segurança (`auth.ts` Bearer JWT, `role.ts` RBAC com bloqueio estrito `403 Forbidden` e `error.ts` para tratamento global de exceções).
   - `modules/`: Módulos de domínio desacoplados contendo tipos, schemas de validação pura, repositórios SQL, serviços e controllers:
     - `auth/`: Login, autocadastro de clientes e perfil de sessão (`/api/v1/auth`).
     - `users/`: CRUD administrativo unificado entre tabelas `users` e `clients` com soft delete (`/api/v1/users`).
     - `suppliers/`: CRUD de fornecedores e marcas parceiras com soft delete (`/api/v1/suppliers`).
     - `user-suppliers/`: Gestão de vínculos N:N multi-empresa entre vendedores e fornecedores (`/api/v1/users/:userId/suppliers`).
   - `routes/`: Montagem e versionamento canônico da árvore sob `/api/v1/`.

3. **Padrão de Respostas REST e Tratamento de Erros**:
   - Rotas de negócio canônicas sob `/api/v1/`.
   - Formato padronizado de erro JSON:
     ```json
     {
       "error": "NomeDoErro",
       "message": "Descrição amigável da falha."
     }
     ```
   - Status HTTP semânticos:
     - `200 OK` / `201 Created` / `204 No Content`
     - `400 Bad Request` (validação de payload/query)
     - `401 Unauthorized` (token ausente, inválido ou expirado)
     - `403 Forbidden` (permissão insuficiente de perfil ou violação multi-empresa)
     - `404 Not Found` (recurso ou rota não encontrada)
     - `409 Conflict` (duplicidade cadastral de e-mail ou vínculo ativo)
     - `500 Internal Server Error`

4. **Controle de Acesso e Isolamento Multi-empresa (RBAC)**:
   - **Matriz de Perfis**: Administrador (`3`), Vendedor (`2`), Cliente (`1`).
   - Vendedores só podem operar dados de fornecedores aos quais estão vinculados na tabela `user_suppliers`.
   - Rotas de escrita em fornecedores e gestão de usuários são exclusivas do perfil Administrador (`3`).

---

## 📁 Arquivos e Artefatos do Diretório

| Arquivo | Descrição |
| :--- | :--- |
| [diagrama_classes_emporio_henz.pdf](./diagrama_classes_emporio_henz.pdf) | Diagrama de classes UML formal detalhando entidades de domínio, atributos, tipos, métodos e relacionamentos associativos. |
| [rotas-api-frontend.md](../rotas-api-frontend.md) | **Guia completo de exportação e integração de rotas da API V1 para o Front-end** (endpoints, payloads, responses, headers e tipagens TypeScript). |

---

## 💻 Aplicação Backend (`apps/backend`)

Para detalhes sobre implementação de controladores, rotas, middlewares e inicialização do servidor:

- Diretório do projeto: [apps/backend](../../apps/backend)
- Regras de desenvolvimento para agentes: [apps/backend/agents.md](../../apps/backend/agents.md)
- README do serviço: [apps/backend/README.md](../../apps/backend/README.md)

---

## 🚀 Como Executar o Back-end

- **Desenvolvimento com reload automático (porta 3001)**:
  ```bash
  bun run --filter backend dev
  # ou na raiz do monorepo
  bun run dev
  ```
- **Checagem de Tipos e Linter**:
  ```bash
  bun run check-types
  bun run lint
  ```
- **Execução dos Testes Automatizados**:
  ```bash
  bun test
  ```
- **Build de Produção (Bun Bundle)**:
  ```bash
  bun run --filter backend build
  ```
