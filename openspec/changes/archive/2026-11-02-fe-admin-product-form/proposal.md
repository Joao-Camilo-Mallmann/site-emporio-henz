## Why

O backend de produtos está pronto: cadastro (`POST /produtos`) e upload de fotos e amostras (`POST /produtos/:id/imagens` e `PUT /produtos/:id/variacoes/:variationId/amostra`). Mas o painel ainda não tem tela para cadastrar produto, e o catálogo depende de cadastro manual pela API. A [US-FE-08] fecha essa ponta. O RF16 exige que o Vendedor veja no seletor só as empresas às quais está vinculado, com a empresa travada quando houver um vínculo só, mas hoje o Vendedor não tem rota para descobrir os próprios vínculos: `GET /users/:userId/suppliers` é exclusiva do Admin, e `GET /suppliers` devolve todos os fornecedores.

## What Changes

- **[BE]** `GET /api/v1/suppliers` passa a devolver ao Vendedor só os fornecedores com vínculo ativo em `user_suppliers`. O envelope `{ data, pagination }` e os filtros continuam iguais. O Admin segue vendo todos.
- **[BE]** A collection Bruno passa a documentar o corpo `201` de `POST /produtos` (`ProductDetailDto` com `variations[].id` e `sortOrder`) e o novo comportamento de `GET /suppliers` para o Vendedor.
- **[FE]** Nova tela `/admin/produtos/novo`, aberta a Admin e Vendedor, com seis seções, mostradas uma etapa por vez:
  - dados básicos;
  - preço e disponibilidade;
  - dimensões em mm;
  - variações de acabamento, com seletor de cores sólidas ou bicolores e amostra de textura;
  - fotos com preview local;
  - especificações técnicas em chave e valor.
- **[FE]** Fluxo de gravação: `POST /produtos` em JSON sem imagens. Depois, as amostras das variações e as fotos, uma por requisição e em sequência, com progresso e erro por arquivo. Se algum envio falhar, o produto não é recriado: a tela permite reenviar só o arquivo que falhou.
- **[FE]** Validação de tamanho (até 2 MiB) e formato (JPEG, PNG ou WebP) no navegador antes do envio, sem Base64 e sem compressão no front.
- **[FE]** Seletor de fornecedor por perfil: o Admin vê todos os ativos; o Vendedor vê só os vinculados, com a empresa pré-selecionada e travada quando há um vínculo só. Sem vínculo, a tela avisa e não permite salvar.
- **[FE]** Reescrita de `src/api/produtos.ts` e dos tipos de produto do admin para o contrato da Bruno. O caminho `/api/produtos` estava errado, porque a `baseURL` já termina em `/api/v1`.
- **[FE]** Card "Produtos" no painel `/admin` para Admin e Vendedor, com atalho "Novo Produto".
- **[FE]** Nova tela `/admin/produtos`: listagem paginada do painel, com busca, filtros por categoria, fornecedor, disponibilidade e status, miniatura da capa, atalho de edição e desativação com confirmação. A API já restringe o resultado do Vendedor aos fornecedores vinculados.
- **[FE]** Nova tela `/admin/produtos/:id/editar`: o mesmo formulário do cadastro preenchido pelo produto, gravando com `PUT /produtos/:id` e enviando depois só os arquivos novos. Fotos e amostras já publicadas são excluídas na hora, porque o JSON de edição não carrega imagem (UC08, A1 e A2).

## Capabilities

### New Capabilities
- `admin-cadastro-produtos`: telas administrativas do CRUD de produto (listagem, cadastro e edição) com variações, amostras e fotos, incluindo validação no navegador, seletor de fornecedor por perfil, envio sequencial dos arquivos e exclusão lógica de produto, foto e amostra.

### Modified Capabilities
- `backend-suppliers`: a listagem `GET /api/v1/suppliers` passa a restringir o resultado do Vendedor aos fornecedores vinculados.

## Impact

- **Backend**: `backend/src/modules/suppliers/` (repository, service e controller da listagem), testes em `backend/tests/` e collection Bruno em `docs/backend/collections/bruno/Suppliers/List Suppliers.bru` e `Products/Create Product.bru`. Nenhuma migração nova.
- **Frontend**:
  - `src/api/produtos.ts`, `src/types/` (novo `products.ts` no barrel) e `src/router/index.ts`;
  - `src/views/admin/AdminDashboardView.vue`;
  - nova pasta `src/views/admin/produtos/`, com a listagem, o cadastro, a edição e os componentes das seções;
  - um helper para montar a URL das imagens com `VITE_API_URL`.
- **Documentação**: `docs/PRD.md` (UC08, origem da lista de fornecedores do Vendedor), `docs/frontend/README.md`, `docs/backend/README.md` e o backlog (`US-FE-08`).
- **Fora do escopo**: reordenação de fotos já publicadas e o ajuste das telas públicas (catálogo e detalhe) ao novo contrato de imagens.
