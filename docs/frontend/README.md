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

## Convenções de interface e reaproveitamento de código

> [!IMPORTANT]
> **REAPROVEITE O DESIGN SYSTEM — NUNCA RECRIE COMPONENTES OU ESTILOS DO ZERO:**
> Antes de escrever qualquer HTML ou estilização manual de botões, modais ou cards, consulte os componentes oficiais em `src/components/ui/`. É proibido duplicar classes ou recriar botões, links de ação ou janelas com tags nativas.

- Use somente os tokens semânticos definidos no design system; não adicione cores hexadecimais arbitrárias aos componentes.
- **Componentes do Design System (`src/components/ui/` — obrigatório)**:
  - `<UiButton>`: mandatório para qualquer botão ou disparador de ação na interface. Não use tags `<button>` nativas soltas nem links manuais com aparência de botão. Suporta variantes `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'` e `'link'`, tamanhos `'xs'` a `'xl'`, `'icon'` e `'none'`, além de `block` (100% largura) e `:loading`.
  - `<UiModal>`: mandatório para diálogos, modais e alertas de confirmação.
  - `<UiCard>`, `<UiFloatingActions>` e `<UiFloatingButton>`: componentes canônicos para cartões e ações flutuantes.
- Componentes em `src/components/` são importados automaticamente por `unplugin-vue-components`.
- Feedbacks transitórios usam `useToast()` e `vue3-toastify`.
- Estados de carregamento, erro, vazio e sucesso devem ser explícitos.

### Guia Rápido de Uso do `<UiButton>` (Copie e Reutilize)

| Caso de Uso | Código Pronto | Dica |
| :--- | :--- | :--- |
| **Ação Principal / Submit** | `<UiButton type="submit" variant="primary" size="lg" block :loading="loading">Salvar</UiButton>` | Use `block` em formulários móveis/cards para largura total |
| **Ação Secundária** | `<UiButton variant="secondary" size="md" @click="handleAction">Ação</UiButton>` | Cor de destaque azul para novos cadastros |
| **Cancelar / Voltar** | `<UiButton variant="outline" size="md" @click="handleCancel">Cancelar</UiButton>` | Borda sutil com hover da marca |
| **Ação em Tabela / Ícone** | `<UiButton variant="ghost" size="icon" title="Editar" aria-label="Editar" @click="edit"><Icon icon="mdi:pencil-outline" class="w-4 h-4" /></UiButton>` | Sem caixas pesadas na tabela |
| **Link Inline no Texto** | `<UiButton variant="link" size="none" @click="go">Criar conta</UiButton>` | Mantém no fluxo do texto sem estourar altura |
| **Perigo / Desativar** | `<UiButton variant="danger" size="sm" @click="remove">Excluir</UiButton>` | Alertas críticos ou exclusão |

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
