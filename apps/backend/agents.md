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
