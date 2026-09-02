# Diretrizes e Padrões — Frontend (`apps/web`)

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - **SEMPRE CONSULTAR ESTE ARQUIVO** ao trabalhar no frontend.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novas features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).

---

## 1. Stack Tecnológico

- **Framework**: Vue 3 (Composition API com `<script setup lang="ts">`).
- **Build Tool**: Vite 6 (`@vitejs/plugin-vue`, `@tailwindcss/vite`).
- **Estilização**: Tailwind CSS v4 via `@import "tailwindcss";` em `src/style.css`.
- **Roteamento**: Vue Router 4 em `src/router/`.
- **Gerenciamento de Estado**: Pinia em `src/stores/`.
- **Cliente HTTP**: Axios centralizado em `src/plugins/axios.ts`.
- **Tipagem**: `vue-tsc` para verificação estrita de tipos TypeScript.

---

## 2. Estrutura de Camadas e Diretórios (`src/`)

### 2.1. Plugins (`src/plugins/`)

- Centraliza a configuração de bibliotecas de terceiros.
- `plugins/axios.ts`: Instância do Axios com `baseURL` (padrão `http://localhost:3001`), timeout e interceptors.
- `plugins/pinia.ts`: Criação e exportação da instância do Pinia.
- `plugins/index.ts`: Fornece a função `registerPlugins(app)` para montagem limpa no `main.ts`.

### 2.2. Tipos e Modelos de Domínio (`src/types/`)

- Centraliza todos os tipos, interfaces e classes da aplicação:
  - `types/models.ts`: Interfaces de domínio (`IProduct`), classes de domínio (`Product` com getters como `formattedPrice` e `formattedDimensions`), além de tipos de filtros e inputs (`ProductFilterParams`, `ProductCreateInput`).
  - `types/api.ts`: Interfaces de rede (`BackendStatus`, `ApiResponse`).
  - `types/components.ts`: Interfaces de props para componentes (`UiButtonProps`, `UiCardProps`).
  - `types/index.ts`: Ponto único de exportação (barrel export via `@/types`).

### 2.3. Camada de Serviços de Rotas de API (`src/api/`)

- Encapsula as requisições HTTP utilizando o Axios configurado.
- Padrão obrigatório: módulos exportando um objeto default com métodos assíncronos (`listar`, `buscarPorId`, `insert`, `atualizar`, `deletar`):
  ```typescript
  import { api as axios } from "@/plugins/axios";
  import type {
    IProduct,
    ProductFilterParams,
    ProductCreateInput,
  } from "@/types";

  export default {
    async listar(params?: ProductFilterParams): Promise<IProduct[]> {
      const response = await axios.get<IProduct[]>("/api/produtos", { params });
      return response.data;
    },
    async buscarPorId(id: string): Promise<IProduct> {
      const response = await axios.get<IProduct>(`/api/produtos/${id}`);
      return response.data;
    },
    async insert(dados: ProductCreateInput): Promise<IProduct> {
      const response = await axios.post<IProduct>("/api/produtos", dados);
      return response.data;
    },
    async atualizar(
      id: string,
      dados: Partial<ProductCreateInput>,
    ): Promise<IProduct> {
      const response = await axios.put<IProduct>(`/api/produtos/${id}`, dados);
      return response.data;
    },
    async deletar(id: string): Promise<{ success: boolean; message: string }> {
      const response = await axios.delete<{
        success: boolean;
        message: string;
      }>(`/api/produtos/${id}`);
      return response.data;
    },
  };
  ```
- Barrel export em `src/api/index.ts` permitindo `import { produtosApi, sistemaApi } from "@/api"`.

### 2.4. Stores (`src/stores/`)

- As stores do Pinia consomem exclusivamente os serviços de `src/api/` e tipam o estado utilizando `src/types/`.

---

## 3. Comandos do Frontend

```bash
bun dev          # Inicia servidor Vite na porta 3000
bun run build    # Type-check com vue-tsc e build de produção com Vite
bun run lint     # Lint com ESLint
bun check-types  # Checagem estrita de tipos com vue-tsc
```
