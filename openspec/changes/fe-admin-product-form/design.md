## Context

O contrato da API de produtos está na collection Bruno (`docs/backend/collections/bruno/Products/`):

- `POST /produtos` (JSON, sem imagens) responde `201` com `ProductDetailDto`, que inclui `variations` ordenadas por `sortOrder`, cada uma com `id`.
- `POST /produtos/:id/imagens` (`multipart/form-data`: `file` e `variationId` opcional) responde `201` com `ProductImageDto { id, productId, variationId, thumbnailUrl, fullImageUrl, sortOrder, createdAt }`. O servidor coloca cada foto no fim do carrossel.
- `PUT /produtos/:id/variacoes/:variationId/amostra` (`multipart/form-data`: `file`) responde `200` com a variação e o novo `sampleImageUrl`.
- As URLs de imagem são relativas (`/api/v1/uploads/...`).

Estado atual do frontend:

- `src/api/produtos.ts` chama `/api/produtos`. A `baseURL` do axios já é `${VITE_API_URL}/api/v1`, então a chamada vai para `/api/v1/api/produtos`.
- `ProductCreateInput` (em `src/types/models.ts`) ainda descreve o modelo antigo, com `category: string`, `isAvailable` e `images: string[]`.
- `listar` e `buscarPorId` alimentam o catálogo e o detalhe com mock como fallback.
- A instância do axios fixa `Content-Type: application/json`. Com esse header, o axios 1.x serializa `FormData` como JSON.

A lacuna do RF16 é que o Vendedor não tem rota para listar os próprios vínculos. `GET /users/:userId/suppliers` é exclusiva do Admin, e `GET /suppliers` devolve todos os fornecedores ao Vendedor.

## Goals / Non-Goals

**Goals:**
- Cadastrar produto completo pelo painel: dados, variações, amostras e fotos.
- Seletor de fornecedor que cumpre o RF16 para Admin e Vendedor.
- Validação no navegador igual à da API, para evitar ida e volta inútil.
- Falha parcial de upload recuperável, sem produto duplicado.

**Non-Goals:**
- Listagem e edição de produtos no admin, que ficam para outra história. O card do painel aponta para `/admin/produtos`, e o painel já mostra "em desenvolvimento" para rota inexistente.
- Reordenar fotos depois de salvas (não há rota) e excluir fotos ou amostras (edição).
- Ajustar `listar` e `buscarPorId` e as telas públicas ao novo contrato de imagens (US-FE-09 e US-FE-10).
- Comprimir imagens no navegador.

## Decisions

### D1. `[BE]` Filtrar `GET /suppliers` pelos vínculos do Vendedor
Quando o usuário autenticado é `SELLER`, a listagem faz `JOIN` com `user_suppliers` (`user_id = :authUserId AND deleted_at IS NULL`). O envelope, os filtros (`search`, `active`), a ordenação e a paginação continuam iguais, e o Admin não muda. Vendedor sem vínculo recebe `200` com a lista vazia, não `403`: é uma listagem, e a tela trata o caso vazio.

- *Alternativas*: incluir `suppliers` no `/auth/me`, que mistura sessão com dado de domínio e fica velho quando o vínculo muda; ou abrir `GET /users/:userId/suppliers` ao próprio Vendedor, que é uma segunda rota com a mesma informação.
- *Por quê*: é a mesma regra que `GET /produtos` já aplica ao Vendedor e é a menor mudança para o front.

### D2. Formulário em etapas, com uma seção visível por vez
O save continua sendo um único `POST` com todos os dados, e a API não tem rascunho. Um formulário com seis seções numa página só fica longo e cansativo, então a tela mostra uma seção por vez, num indicador de etapas (lateral em telas largas, faixa rolável no celular). Todas as seções ficam montadas no DOM, apenas escondidas, para o estado e os ids dos campos continuarem valendo.

- *Avanço*: "Próximo" valida só os campos da etapa atual (`fieldStep` mapeia o id do campo para a etapa) e bloqueia com a mensagem junto ao campo. As etapas já alcançadas ficam clicáveis; as futuras não.
- *Salvar*: no cadastro o botão aparece na última etapa e valida tudo; se houver erro, a tela abre a etapa do primeiro campo com erro. Enter numa etapa intermediária avança em vez de salvar.
- *Edição*: o produto já está completo, então todas as etapas ficam livres e "Salvar alterações" aparece em todas.
- *Depois do `201`*: com o formulário travado para o envio dos arquivos, todas as seções voltam a aparecer, porque o estado e o "Tentar de novo" de amostras e fotos moram nas etapas 4 e 5.

### D3. Estado do formulário local, com funções puras
Os tipos do estado do formulário (`ProductFormState`, `VariationFormItem`, `PhotoFormItem`, `KeyValueRow`, `UploadState`) ficam em `src/types/productForm.ts`, exportados pelo barrel, porque o `frontend/agents.md` não permite tipos soltos nas views. Os módulos de `src/utils/produtos/` concentram as funções:

- `createEmptyForm()`;
- `validateForm(form, ctx)`, que devolve um mapa `campo → mensagem`;
- `toCreatePayload(form)`;
- `resolveVariationIds(variations, product)` (D4).

Cada variação e cada foto tem uma `key` local, gerada com `crypto.randomUUID()` quando existe. Sem HTTPS nem localhost, o navegador não oferece `randomUUID`, e o código usa um id aleatório no lugar. Uma foto aponta para a variação por `variationKey: string | null`, porque o `id` real só existe depois do `POST`. As funções puras deixam a view enxuta e facilitam testes quando o front tiver um runner.

### D4. Associação das variações pelo `sortOrder`
`toCreatePayload` envia `sortOrder = índice` na ordem da tela. Depois do `201`, cada `VariationFormItem` recebe o `id` de `response.variations.find(v => v.sortOrder === índice)`. O servidor não garante devolver as variações na ordem do array enviado, mas ordena por `sortOrder`, e os índices são únicos.

### D5. Envio dos arquivos em sequência, amostras antes das fotos
O fluxo é `POST /produtos`, depois as amostras e depois as fotos, com um `await` por vez, sem `Promise.all`:

- a ordem do carrossel é a ordem de chegada (`sort_order` = último + 1);
- evita picos de memória e de banda no servidor (reconversão WebP);
- deixa o progresso por arquivo legível.

Cada arquivo tem `UploadState = 'pending' | 'uploading' | 'done' | 'error'` e `uploadError?: string`, com a mensagem da API.

### D6. Falha parcial: produto criado, formulário travado
Depois do `201`, a view guarda `createdProduct` e trava os campos, porque reenviar o `POST` daria `409` por slug duplicado. Arquivos com erro ganham o botão "Tentar de novo", que repete só aquele envio. Há duas saídas:

- tudo enviado: toast de sucesso e `router.push('/admin')`;
- restam erros: um aviso com o número de arquivos não enviados e um botão "Concluir assim mesmo", que redireciona.

```
editando ──Salvar──► criando ──201──► enviando arquivos ──todos ok──► toast + /admin
   ▲                   │                     │
   └──400/403/409──────┘                     └──algum erro──► parcial
                                                   │ "Tentar de novo" (por arquivo)
                                                   └ "Concluir assim mesmo" ──► /admin
```

### D7. Uploads com `FormData` e header explícito
`produtosApi.enviarFoto(id, file, variationId?)` e `produtosApi.enviarAmostra(id, variationId, file)` montam um `FormData` e passam `headers: { "Content-Type": "multipart/form-data" }`. O header fixo da instância faria o axios 1.x serializar o `FormData` como JSON. Com `multipart/form-data`, o navegador completa o `boundary`. O `timeout` padrão de 30 s basta para 2 MiB.

### D8. Validação de arquivo no navegador
O arquivo `src/utils/uploads.ts` exporta:

- `MAX_IMAGE_BYTES = 2_097_152` e `ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']`;
- `validateImageFile(file): string | null`, com mensagem que traz o tamanho enviado e o limite, ou os formatos aceitos;
- `toApiAssetUrl(path)`, que prefixa as URLs relativas da API com `VITE_API_URL`, a mesma base do axios (o Vite não tem proxy de `/api`).

O navegador confere só o `type` do `File`. Quem decide de verdade é o servidor, que confere pelo conteúdo. O preview usa `URL.createObjectURL`, e o object URL é revogado ao remover o arquivo, ao trocar a amostra e no `onBeforeUnmount`. Quando a foto termina de subir, a miniatura passa a usar `toApiAssetUrl(thumbnailUrl)`.

### D9. Carga das opções
- **Categorias**: `categoriasApi.listar({ limit: 100, active: true })`. O interceptor sempre manda o token, e com token de Admin a API inclui categorias e subtipos inativos. O filtro `active` cobre as categorias, e os `subtypes` são filtrados no cliente por `active`.
- **Fornecedores**: `fornecedoresApi.listar({ limit: 100, active: true })`. As regras de pré-seleção, trava e lista vazia seguem a spec, com `authStore.isVendedor` para saber o perfil.
- As duas cargas rodam em paralelo no `onMounted`. Se alguma falhar, a tela mostra o erro com o botão "Tentar de novo" e não exibe o formulário.

### D10. Especificações e detalhes de acabamento em chave e valor
O componente `KeyValueEditor.vue` (em `src/components/produtos/`) serve às especificações do produto e ao `finishDetails` da variação. Linhas vazias são descartadas, e chaves repetidas (comparadas sem caixa e sem espaços nas pontas) bloqueiam o envio. Os valores vão como texto, do jeito digitado. Converter `"6"` em `6` mudaria o que o usuário digitou, como em "06", e o JSONB aceita os dois.

### D11. Cores definidas pelo usuário em `:style`
A proibição de hex arbitrário vale para os tokens de estilo da interface. As cores das variações são dados do produto e entram por `:style` (`background` ou `conic-gradient` para três ou mais cores). O seletor usa `<input type="color">` junto a um campo de texto `#RRGGBB`.

### D12. Estrutura de arquivos
As telas seguem o padrão `views/admin/<domínio>/`, como em fornecedores e categorias, e não o caminho único `views/admin/ProdutoFormView.vue` citado no backlog. As peças visuais ficam em `src/components/produtos/`, resolvidas pelo auto-import, e a lógica sem Vue em `src/utils/produtos/`. Cada arquivo fica entre 150 e 500 linhas (regra do `frontend/agents.md`), o que define onde as peças pequenas foram juntadas.

```
src/types/products.ts                   tipos do contrato (DTOs e payloads), exportados no barrel
src/types/productForm.ts                tipos do estado do formulário, exportados no barrel
src/api/produtos.ts                     listagem, detalhe, cadastro, edição, desativação e uploads
src/utils/uploads.ts                    validação de arquivo e toApiAssetUrl
src/utils/produtos/
  produtoFormConstantes.ts              ids de campo, rótulos, limites, formatadores e apiErrorMessage
  produtoFormEstado.ts                  criação do estado e conversão de e para a API (D3, D4)
  produtoFormValidacao.ts               validação com as regras da API
src/composables/useProdutoTela.ts       opções dos seletores, erro de gravação e envio dos arquivos (D5, D6, D9)
src/views/admin/produtos/
  ProdutoListView.vue                   listagem paginada com filtros e desativação
  ProdutoNewView.vue                    cadastro: carga das opções e gravação
  ProdutoEditView.vue                   edição: carga do produto, PUT e exclusões imediatas
  ProdutoForm.vue                       formulário em etapas, validação por etapa e etapa 6
src/components/produtos/
  ProdutoTelaLayout.vue                 moldura do cadastro e da edição e painel de envio
  ProdutoFormNavegacao.vue              indicador de etapas e rodapé de ações
  ProdutoDadosBasicosSection.vue        etapa 1
  ProdutoPrecoDimensoesSection.vue      etapas 2 e 3
  ProdutoVariacoesSection.vue           etapa 4: lista de variações
  ProdutoVariacaoAcabamento.vue         cores, detalhes de acabamento e estoque
  ProdutoVariacaoAmostra.vue            amostra de textura nova ou publicada
  ProdutoFotosSection.vue               etapa 5: fotos com preview, variação, ordem, capa e envio
  KeyValueEditor.vue                    editor de chave e valor
  ProdutoListCabecalho.vue              cabeçalho e filtros da listagem
  ProdutoListTabela.vue                 tabela e estados da listagem
```

Inputs e alertas reutilizam as classes dos formulários existentes (`FornecedorForm.vue`). Todas as ações usam `<UiButton>`, listas de escolha usam `<UiSelect>` e diálogos usam `<UiModal>`, sem `<button>` nem `<select>` nativos.

## Risks / Trade-offs

- [Mais de 100 fornecedores ou categorias] → O seletor carrega só a primeira página (`limit` máximo é 100). Isso é aceitável no tamanho atual da loja. Se crescer, troca-se por busca com `search`.
- [Usuário fecha a aba no meio dos envios] → O produto fica criado sem parte das fotos. A edição, que é outra história, completa depois. O formulário avisa durante o envio que a página não deve ser fechada.
- [Filtro de `GET /suppliers` muda o retorno para o Vendedor] → No front, só esta tela consome a rota como Vendedor (as telas de fornecedores são exclusivas do Admin). Os testes do backend cobrem Admin, Vendedor com vínculo, Vendedor sem vínculo e vínculo revogado.
- [Validação de formato pelo `type` do arquivo] → Um arquivo renomeado passa no navegador e é barrado pela API com `400`. A mensagem aparece no estado de erro daquele arquivo.
- [Escopo da reescrita de `src/api/produtos.ts`] → `listar` e `buscarPorId` ficam intactos, para não quebrar o catálogo e o detalhe com mock como fallback.
