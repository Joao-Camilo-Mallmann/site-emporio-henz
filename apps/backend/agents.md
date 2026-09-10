# Diretrizes e Padrões — Backend (`apps/backend`)

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - **SEMPRE CONSULTAR ESTE ARQUIVO** ao trabalhar no backend.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novos endpoints ou features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).

---

## 1. Stack Tecnológico

- **Runtime**: Bun (versão 1.4+)
- **Servidor HTTP**: `Bun.serve` nativo com roteamento declarativo e tipado via TypeScript (sem frameworks pesados externos).
- **Banco de Dados**: **PostgreSQL** para persistência relacional com regra estrita de **Soft Delete** (`deleted_at` em todas as entidades; nunca executar `DELETE` físico de registros).
  - **Identificação de Usuários**: Chave única `email` (sem CPF).
  - **Perfis de Acesso (Roles)**: `1 = Cliente`, `2 = Vendedor`, `3 = Administrador` (armazenados em `users.role` como `smallint`).
  - **Separação Users e Clients**: `users` gerencia credenciais e role; `clients` armazena dados cadastrais (nome e telefone) vinculado 1:1 com `users`.
  - **Produtos e Especificações**: Dimensões estruturadas (`height_mm`, `width_mm`, `depth_mm`), `collection_line`, `main_material` (para filtros rápidos de catálogo), preço fixo de referência (`reference_price`), texto descritivo amplo (`description TEXT`) e tabela técnica flexível em `specifications JSONB`.
  - **Variações de Acabamento Flexíveis**: `product_variations` com array de cores (`colors_hex VARCHAR(7)[]` para 1, 2 [bicolor] ou N cores), miniatura Base64 da textura real (`sample_image_base64`) e `finish_details JSONB` para detalhar partes (estrutura, portas, puxadores, tecido).
  - **Listas do Cliente**: 3 fixas do sistema (`FAVORITES`, `WISHLIST`, `GIFT_LIST` com `is_system = true`) e pastas livres adicionais; `list_items` suporta `variation_id` opcional.
  - **Armazenamento Otimizado de Imagens**: Em `product_images`, manter `thumbnail_base64` (< 50 KB para cards do catálogo) e `full_base64` (< 2 MB para página de produto), com `variation_id` opcional para troca dinâmica de fotos na seleção de cor.
- **Porta Padrão**: `3001` (configurável via `process.env.PORT`).
- **CORS**: Pré-configurado para suportar preflight `OPTIONS` e requisições do frontend Vite (`http://localhost:3000`).

---

## 2. Padrões de Roteamento e Respostas HTTP

- **Função auxiliar JSON**: Sempre utilizar a função `json(data, status = 200)` para padronizar headers de `Content-Type: application/json` e CORS.
- **Tratamento de Erros**:
  - `404 Not Found` padronizado em JSON com `{ error: "Not Found", message: string }`.
  - `500 Internal Server Error` protegido por `try/catch` global retornando JSON padronizado.
- **Variáveis de Ambiente**: Sempre registrar qualquer variável de ambiente no `turbo.json` (seção `globalEnv`, como `PORT`) para cumprir a regra `turbo/no-undeclared-env-vars`.

---

## 3. Endpoints Implementados

- `GET /`: Status da API e listagem de endpoints disponíveis.
- `GET /health` e `GET /api/health`: Healthcheck com uptime, status e timestamp ISO.
- `GET /api/produtos`: Listagem com filtros por query params (`search` e `category`).
- `GET /api/produtos/:id`: Busca por ID específico.
- `POST /api/produtos`: Criação de novo produto.
- `PUT /api/produtos/:id`: Atualização de produto existente.
- `DELETE /api/produtos/:id`: Remoção de produto por ID.

---

## 4. Comandos do Backend

```bash
bun dev          # Inicia servidor com hot-reload (bun --watch src/index.ts)
bun run build    # Empacota via bun build src/index.ts --outdir dist --target bun
bun run start    # Executa arquivo em producao
bun run lint     # Lint com ESLint
bun check-types  # Checagem estrita de tipos com tsc
```
