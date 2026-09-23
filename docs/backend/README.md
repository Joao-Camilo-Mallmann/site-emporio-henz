# Documentação de Back-end — Empório Henz

Este diretório concentra a documentação de arquitetura de servidor, rotas da API, modelagem orientada a objetos (diagrama de classes) e regras de negócio do Portal Empório Henz.

---

## ⚙️ Diretrizes Arquiteturais (Back-end)

Conforme estabelecido em [agents.md](../../agents.md) e [apps/backend/agents.md](../../apps/backend/agents.md):

1. **Stack Técnica**:
   - **Runtime**: [Bun](https://bun.sh/) (1.4+) executando nativamente com `Bun.serve`.
   - **Linguagem**: TypeScript com modo estrito (`strict: true`).
   - **Banco de Dados**: PostgreSQL 16 conectado via driver nativo/pool de conexões.
   - **Testes**: `bun:test` para testes unitários e de integração.

2. **Padrão de Respostas REST**:
   - Rotas prefixadas por `/api/` (ou `/api/v1/`).
   - Respostas estritamente em JSON com cabeçalhos HTTP semânticos:
     - `200 OK` / `201 Created` / `204 No Content`
     - `400 Bad Request` (validação de payload)
     - `401 Unauthorized` (falta de token ou token inválido)
     - `403 Forbidden` (permissão insuficiente ou violação de vínculo multi-empresa)
     - `404 Not Found`
     - `500 Internal Server Error`

3. **Controle de Acesso e Isolamento Multi-empresa**:
   - **Matriz de Perfis (RBAC)**: Administrador (`3`), Vendedor (`2`), Cliente (`1`).
   - Vendedores só podem cadastrar, atualizar ou desativar produtos de fornecedores aos quais estão vinculados na tabela `user_suppliers`. Violações retornam `403 Forbidden`.
   - Vendedores e Clientes são impedidos de manipular fornecedores/marcas parceiras (`403 Forbidden`).

---

## 📁 Arquivos e Artefatos do Diretório

| Arquivo                                                                  | Descrição                                                                                                                 |
| :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| [diagrama_classes_emporio_henz.pdf](./diagrama_classes_emporio_henz.pdf) | Diagrama de classes UML formal detalhando entidades de domínio, atributos, tipos, métodos e relacionamentos associativos. |

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
  # ou na raiz
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
