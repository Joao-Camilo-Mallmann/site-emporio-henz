# Front-end

Documentação técnica da aplicação Vue do Empório Henz. Regras de produto pertencem ao [PRD](../PRD.md); este guia descreve a implementação no diretório `frontend/`.

## Referências

- [Código da aplicação](../../frontend/)
- [README operacional](../../frontend/README.md)
- [Regras do front-end](../../frontend/agents.md)
- [Cores e tokens oficiais](./design-system-cores.md)
- [Contrato da API](../backend/collections/README.md)

## Stack

- Vue 3 com Composition API e `<script setup lang="ts">`.
- Vite para desenvolvimento e build.
- Tailwind CSS v4 para estilos.
- Pinia para estado global.
- Vue Router para navegação.
- Axios para comunicação com a API.

## Estrutura do código

| Diretório | Responsabilidade |
| --- | --- |
| `frontend/src/api/` | Clientes HTTP por domínio |
| `frontend/src/components/` | Componentes reutilizáveis e layout |
| `frontend/src/composables/` | Comportamentos reutilizáveis |
| `frontend/src/plugins/` | Axios, Pinia e integrações globais |
| `frontend/src/router/` | Rotas e guards de navegação |
| `frontend/src/stores/` | Estado global |
| `frontend/src/views/` | Páginas públicas, autenticadas e administrativas |

## Convenções de interface

- Use somente os tokens semânticos definidos no design system; não adicione cores hexadecimais arbitrárias aos componentes.
- Use `<UiButton>` para botões e disparadores de ação.
- Componentes em `src/components/` são importados automaticamente por `unplugin-vue-components`.
- Feedbacks transitórios usam `useToast()` e `vue3-toastify`.
- Estados de carregamento, erro, vazio e sucesso devem ser explícitos.

## Executar

```bash
cd frontend
bun install
bun run dev
```

A aplicação fica disponível em `http://localhost:3000`. A URL da API é configurada por `VITE_API_URL`.

## Validar

```bash
cd frontend
bun run check-types
bun run lint
bun run build
```
