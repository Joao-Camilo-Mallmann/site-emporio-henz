# Documentação de Banco de Dados — Empório Henz

Este diretório concentra os artefatos de modelagem, diagramas conceituais e lógicos, e especificações da camada de persistência do Portal Empório Henz.

---

## 🏛️ Diretrizes Arquiteturais (Database First)

Conforme definido em [docs/padrao-historias-tarefas.md](../padrao-historias-tarefas.md) e no [PRD.md](../PRD.md):

1. **Database First**: Toda funcionalidade nova tem suas tabelas, migrações e índices definidos e validados no PostgreSQL antes de qualquer implementação em back-end ou front-end.
2. **Soft Delete**: Nenhuma exclusão física (`DELETE`) em entidades de negócio. Sempre utilizar exclusão lógica através da coluna `deleted_at TIMESTAMP WITH TIME ZONE NULL`.
3. **Índices Parciais Únicos**: Campos com unicidade (como slugs ou emails de cadastros ativos) utilizam índices parciais com `WHERE deleted_at IS NULL`.
4. **Idempotência**: Todas as migrações SQL em `packages/database/src/migrations/` devem ser idempotentes (`CREATE TABLE IF NOT EXISTS`, etc.).

---

## 📁 Arquivos e Artefatos do Diretório

| Arquivo                                        | Descrição                                                                               |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------- |
| [diagram.png](./diagram.png)                   | Renderização gráfica em alta resolução do Diagrama Entidade-Relacionamento (DER).       |
| [der_emporio_henz.pdf](./der_emporio_henz.pdf) | Versão em PDF para documentação formal e submissão acadêmica/avaliação.                 |
| [render_diagram.html](./render_diagram.html)   | Ferramenta interativa Mermaid.js em HTML para visualização, edição e exportação do DER. |

---

## 📊 Entidades Principais e Relacionamentos

- **`roles`**: Perfis de acesso do sistema (`1`: Cliente, `2`: Vendedor, `3`: Administrador).
- **`users`**: Contas de acesso autenticadas (e-mail único ativo e senha com hash seguro).
- **`clients`**: Dados complementares do perfil de cliente (1:1 com `users`).
- **`suppliers`**: Marcas e indústrias parceiras de móveis da loja física.
- **`user_suppliers`**: Tabela associativa que vincula vendedores a fornecedores autorizados (isolamento multi-empresa).
- **`categories`** & **`product_subtypes`**: Taxonomia hierárquica do catálogo de móveis.
- **`products`**: Catálogo de móveis com disponibilidade (pronta entrega / encomenda), preço e soft delete.
- **`product_images`**: Galeria de imagens em Base64 / paths de imagens dos produtos.
- **`product_variations`**: Opções de acabamento, cores e tecidos.
- **`lists`** & **`list_items`**: Listas públicas/privadas de clientes (Favoritos, Desejos, Presentes) com link público via UUID.

---

## 🚀 Como Executar as Migrações

- **Localmente com Bun**:
  ```bash
  bun run migrate
  ```
- **Via Docker Compose**:
  ```bash
  docker compose run --rm migration
  ```
- **Código-fonte das migrações**: consulte o pacote [packages/database](../../packages/database).
