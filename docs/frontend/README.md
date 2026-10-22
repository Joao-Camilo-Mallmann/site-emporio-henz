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
| `frontend/src/components/ui/` | Componentes do design system, incluindo `UiPagination.vue` para paginação de listagens |
| `frontend/src/stores/` | Estado global |
| `frontend/src/types/` | Tipos e modelos de domínio; `pagination.ts` define o envelope `Paginated<T>` das listagens |
| `frontend/src/utils/` | Funções utilitárias sem estado: cookies, `slugify` e validação/URLs de imagem (`uploads.ts`) |
| `frontend/src/views/` | Páginas públicas, autenticadas e administrativas (domínios complexos como `categorias/subcategorias/` utilizam subpastas para modularizar componentes privados) |

## Convenções de interface e reaproveitamento de código

> [!IMPORTANT]
> **REAPROVEITE O DESIGN SYSTEM — NUNCA RECRIE COMPONENTES OU ESTILOS DO ZERO:**
> Antes de escrever qualquer HTML ou estilização manual de botões, modais ou cards, consulte os componentes oficiais em `src/components/ui/`. É proibido duplicar classes ou recriar botões, links de ação ou janelas com tags nativas.

- Use somente os tokens semânticos definidos no design system; não adicione cores hexadecimais arbitrárias aos componentes.
- **Componentes do Design System (`src/components/ui/` — obrigatório)**:
  - `<UiButton>`: mandatório para qualquer botão ou disparador de ação na interface. Não use tags `<button>` nativas soltas nem links manuais com aparência de botão. Suporta variantes `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'` e `'link'`, tamanhos `'xs'` a `'xl'`, `'icon'` e `'none'`, além de `block` (100% largura) e `:loading`.
  - `<UiModal>`: mandatório para diálogos, modais e alertas de confirmação.
  - `<UiCard>`, `<UiFloatingActions>` e `<UiFloatingButton>`: componentes canônicos para cartões e ações flutuantes.
  - `<UiPagination>`: obrigatório em toda listagem paginada; detalhes na seção "Paginação de listagens" de [frontend/agents.md](../../frontend/agents.md).
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

## CRUD de produto (`/admin/produtos`)

Três telas abertas a Administrador e Vendedor, ligadas ao card "Produtos" do painel `/admin`: a listagem (`admin-produtos`), o cadastro (`admin-produtos-novo`) e a edição (`admin-produtos-editar`). Regras de negócio no [PRD](../PRD.md) (UC08, RF16, RF17); decisões técnicas na change OpenSpec `fe-admin-product-form`; contrato na pasta `Products/` da [collection Bruno](../backend/collections/bruno/).

| Rota | Tela | Papel |
| --- | --- | --- |
| `/admin/produtos` | `ProdutoListView.vue` | Listagem paginada com filtros, atalho de edição e desativação |
| `/admin/produtos/novo` | `ProdutoNewView.vue` | Cadastro: `POST` e depois os arquivos |
| `/admin/produtos/:id/editar` | `ProdutoEditView.vue` | Edição: `PUT`, arquivos novos e exclusão de foto, amostra ou produto |

A API devolve ao Vendedor só os produtos dos fornecedores vinculados, então as três telas não precisam filtrar por fornecedor no cliente.

### Arquivos

As quatro telas ficam na raiz de `src/views/admin/produtos/`; as peças visuais do formulário ficam em `produtos/formulario/`, como `categorias/` faz com `subcategorias/`, e a lógica sem Vue fica em `src/utils/produtos/`.

| Arquivo | Papel |
| --- | --- |
| `src/types/products.ts` | Contrato da API: `ProductListItemDto`, `ProductDto`, `ProductVariationDto`, `ProductImageDto`, `ProductCreatePayload`, `ProductUpdatePayload`, `ProductAdminFilterParams` |
| `src/types/productForm.ts` | Estado local do formulário: `ProductFormState`, `VariationFormItem`, `PhotoFormItem`, `KeyValueRow`, `UploadState`, `FieldErrors` |
| `src/api/produtos.ts` | `listarAdmin`, `buscarDetalhe`, `criar`, `atualizar`, `deletar`, `enviarFoto`, `enviarAmostra`, `removerFoto` e `removerAmostra` (`listar` e `buscarPorId`, usadas pelo catálogo público, seguem com mock de fallback) |
| `src/utils/uploads.ts` | `MAX_IMAGE_BYTES`, `ACCEPTED_IMAGE_TYPES`, `validateImageFile` e `toApiAssetUrl` |
| `src/utils/produtos/` | Lógica pura do formulário, sem Vue: `produtoFormConstantes.ts` (ids de campo, rótulos e limites), `produtoFormEstado.ts` (criação, conversão de e para a API), `produtoFormValidacao.ts` e `produtoFormatadores.ts` (rótulos da listagem). Principais funções: `createEmptyForm`, `formFromProduct`, `validateForm`, `toCreatePayload`, `toUpdatePayload`, `resolveVariationIds`, ids dos campos e rótulos da listagem |
| `src/views/admin/produtos/ProdutoListView.vue` | Listagem: filtros, paginação, miniatura da capa e desativação com confirmação |
| `src/views/admin/produtos/ProdutoNewView.vue` | Casca do cadastro: carga das opções, regra do fornecedor por perfil e gravação em etapas |
| `src/views/admin/produtos/ProdutoEditView.vue` | Casca da edição: carga do produto, `PUT`, arquivos novos e exclusões imediatas |
| `src/views/admin/produtos/ProdutoForm.vue` | Formulário em etapas: indicador de etapas, "Voltar" e "Próximo" com validação por etapa, seções 1, 2, 3 e 6, erros por campo e composição das seções 4 e 5 |
| `formulario/ProdutoVariacoesSection.vue`, `formulario/ProdutoVariacaoCard.vue` | Variações: incluir, mover, remover, cores, detalhes de acabamento, estoque e amostra |
| `formulario/ProdutoFotosSection.vue` | Fotos: seleção múltipla, preview, variação, ordem, capa, estado do envio e grade das fotos já publicadas |
| `formulario/ColorSwatch.vue`, `formulario/KeyValueEditor.vue` | Círculo de cores (1, 2 ou N cores) e editor de chave e valor |

### Fluxo do cadastro

1. **Carga**: `categoriasApi.listar({ limit: 100, active: true })` e `fornecedoresApi.listar({ limit: 100, active: true })` em paralelo. Como o token de Admin traz inativos, categorias e `subtypes` são filtrados por `active` no cliente. Se a carga falhar, a tela mostra o erro com "Tentar de novo" e não exibe o formulário.
2. **Fornecedor**: o Admin escolhe entre todos os ativos. Para o Vendedor, a API devolve só as empresas vinculadas: uma vem pré-selecionada e travada; várias ficam à escolha; nenhuma mostra o aviso e desabilita "Salvar produto".
3. **Validação**: `validateForm` devolve `id do campo → mensagem` na ordem visual. Ao salvar com erro, o formulário marca os campos (`aria-invalid`) e rola até o primeiro. Especificações e detalhes de acabamento descartam linhas vazias, bloqueiam chaves repetidas e enviam os valores como texto.
4. **Arquivos**: fotos e amostras são validadas no navegador (JPEG, PNG ou WebP, até 2 MiB, pelo `type` do arquivo) e mostradas com `URL.createObjectURL`, sem Base64 nem compressão. Os object URLs são revogados ao remover ou trocar o arquivo e ao sair da tela.
5. **Gravação**: `POST /produtos` em JSON. Depois do `201`, cada variação recebe o `id` devolvido pelo `sortOrder` (índice na tela), o formulário trava e os arquivos sobem um por vez: primeiro as amostras, depois as fotos, na ordem da tela.
6. **Resultado**: tudo enviado gera toast de sucesso e volta para `/admin`. Arquivo com erro mostra a mensagem da API e "Tentar de novo", que reenvia só aquele arquivo para o produto já criado; "Concluir assim mesmo" avisa quantos ficaram de fora e volta para `/admin`. Erro no `POST`: `409` marca o campo slug; `400` e `403` aparecem no alerta geral.

### Etapas do formulário

O `ProdutoForm.vue` mostra uma das seis seções por vez, com indicador de etapas à esquerda em telas largas e como faixa rolável no celular. Todas as seções ficam montadas (`v-show`), então o estado e os ids dos campos não se perdem. O indicador mostra a barra de progresso e o estado de cada etapa: atual, concluída, com erro (depois de tentar avançar) ou bloqueada. No celular ele vira uma versão compacta, com o título da etapa atual e os círculos numerados.

- **Cadastro**: "Próximo" valida só a etapa atual (`fieldStep`, em `src/utils/produtos/produtoFormConstantes.ts`, liga o id do campo à etapa) e só libera a seguinte sem erros. Só as etapas já alcançadas ficam clicáveis. "Salvar produto" aparece na última etapa e valida tudo; com erro, a tela abre a etapa do primeiro campo inválido. Enter numa etapa intermediária avança.
- **Edição**: a prop `steps-unlocked` libera todas as etapas e mostra "Salvar alterações" em todas.
- **Depois do `201` ou do `200`**: o indicador some e todas as seções reaparecem, porque o "Tentar de novo" das amostras e fotos fica nas etapas 4 e 5.

### Fluxo da listagem

1. **Carga**: `produtosApi.listarAdmin` com `page`, `limit`, `search`, `categoryId`, `supplierId`, `availabilityType` e `active`. Categorias e fornecedores vêm em paralelo por `Promise.allSettled`, só para alimentar os seletores e traduzir os ids em nome: se essa carga falhar, a tabela mostra o id truncado e a listagem continua.
2. **Filtros**: qualquer mudança volta para a página 1. "Limpar filtros" só aparece com algum filtro aplicado. O status traduz "Ativos" e "Inativos" em `active: true | false`.
3. **Capa**: `thumbnailUrl` passa por `toApiAssetUrl`; sem foto, a linha mostra um ícone no lugar da miniatura.
4. **Desativar**: `UiModal` de confirmação e `DELETE /produtos/:id`. O item fica como inativo na lista em memória, sem recarregar a página.

### Fluxo da edição

1. **Carga**: produto, categorias e fornecedores em paralelo. `formFromProduct` converte o `ProductDetailDto` no estado do formulário, com `slugEdited: true` (o slug não volta a seguir o nome) e as variações com o `id` real. O `404` vira a tela "Produto não encontrado". Se o fornecedor atual não estiver na página de fornecedores ativos, ele é buscado por `id` e entra no seletor, para o `PUT` não trocar o fornecedor do produto.
2. **Gravação**: `PUT /produtos/:id` com o mesmo corpo do cadastro. As variações existentes vão com `id` (preservadas), as novas sem `id` (inseridas) e as omitidas recebem soft delete na API. Depois do `200`, as variações novas recebem o `id` pelo `sortOrder`, o formulário trava e os arquivos novos sobem um por vez, como no cadastro.
3. **Exclusões imediatas**: foto publicada (`DELETE /produtos/:id/imagens/:imageId`), amostra publicada (`DELETE /produtos/:id/variacoes/:variationId/amostra`) e desativação do produto (`DELETE /produtos/:id`) passam por um `UiModal` de confirmação e valem na hora, sem esperar o botão de salvar, porque o JSON do `PUT` não carrega imagem (UC08, A1 e A2).

### Uploads e URLs de imagem

- A instância do axios fixa `Content-Type: application/json`. Por isso `enviarFoto` e `enviarAmostra` passam `headers: { "Content-Type": "multipart/form-data" }`; sem isso, o axios 1.x serializaria o `FormData` como JSON. O navegador completa o `boundary`.
- As URLs de imagem da API são relativas (`/api/v1/uploads/...`). `toApiAssetUrl` prefixa a mesma origem do axios (`apiBase`, de `VITE_API_URL`), porque o Vite não faz proxy de `/api`.
- As cores das variações são dados do produto e entram por `:style` (cor sólida, `linear-gradient` para duas cores e `conic-gradient` para três ou mais), nunca como classe com hex.

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
