## Why

A busca de produtos compara o termo digitado com o texto gravado usando `ILIKE`: ignora maiúsculas, mas não ignora acentos nem separadores. "Sofa retratil" não encontra "Sofá Retrátil", e "roupeiro_roma" não encontra "Roupeiro Roma". O campo de busca da navbar é a porta de entrada do catálogo (RF05), e o cliente digita sem acento, com caixa alta ou copiando um slug. O [PRD](../../../docs/PRD.md) agora exige que a busca textual de produtos seja insensível a maiúsculas, acentos e separadores, comparando termo e campos na forma de slug.

## What Changes

- **[DB]** Migração que habilita a extensão `unaccent` e cria a função SQL imutável `search_slug(text)`, que devolve o texto na mesma forma de slug do `slugify` do backend (sem acentos, minúsculas, sequências de caracteres fora de `a-z0-9` viram um único hífen, sem hífen nas pontas).
- **[BE]** `GET /api/v1/produtos` (pública e administrativa) normaliza o parâmetro `search` com `slugify` e compara com `search_slug(name)`, `search_slug(description)` e `search_slug(collection_line)` por trecho contido. O termo continua literal (curingas escapados) e limitado a 100 caracteres antes da normalização. Um termo que vira vazio depois da normalização (só símbolos) é ignorado, como hoje um termo em branco.
- **[BE]** O mock do repositório de produtos nos testes aplica a mesma normalização, e a suíte cobre acento, caixa, underline e símbolos.
- **[FE]** A busca da navbar envia o termo como digitado na URL do catálogo (`name`), para o resumo "Resultados para …" continuar legível, e a camada de API do catálogo manda ao backend o termo normalizado no parâmetro `search` (o contrato da collection Bruno), em vez de `name`, que a API ignora. O fallback mockado filtra com a mesma normalização, para o comportamento ser igual com ou sem backend.
- A collection Bruno e a documentação de banco e de backend descrevem a normalização.
- As demais listagens (`usuarios`, `fornecedores`, `categorias`, `subtipos`) não mudam: continuam com `ILIKE` literal.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `backend-products-crud`: o filtro `search` da listagem de produtos passa a comparar termo e campos na forma de slug.
- `catalogo-busca-produtos`: a busca da navbar e a camada de API do catálogo normalizam o termo antes de filtrar.

## Impact

- Banco: nova migração `backend/database/migrations/014_search_slug.sql` (extensão `unaccent` e função `search_slug`).
- Backend: `backend/src/modules/products/products.schema.ts` e `products.repository.ts`; reaproveita `slugify` de `backend/src/lib/slug.ts`.
- Testes: `backend/tests/mocks/products.mock.ts`, novos `backend/tests/lib/slug.test.ts` e `backend/tests/modules/products/products.schema.test.ts`, e um caso de busca em `products.service.test.ts`.
- Frontend: `frontend/src/components/layout/AppNavbar.vue`, `frontend/src/api/catalogo.ts`; reaproveita `slugify` de `frontend/src/utils/slug.ts`.
- Documentação: `docs/PRD.md` (já atualizado), `docs/backend/collections/bruno/Products/List Products.bru` e `List Products Admin.bru`, `docs/database/README.md`, `docs/planning/user-stories-backlog.md`.
- Fora do escopo: integrar o catálogo público à API real (hoje a tela cai no mock porque a resposta da API tem outro formato) e estender a normalização às outras listagens.
