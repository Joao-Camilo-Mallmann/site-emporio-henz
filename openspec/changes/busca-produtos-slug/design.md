## Context

`ProductsRepository.listPaginated` recebe `filters.search` já aparado e limitado a 100 caracteres por `parseSearch` (`src/lib/pagination.ts`), escapa os curingas com `escapeLike` e monta `p.name ILIKE '%termo%' OR COALESCE(p.description,'') ILIKE ... OR COALESCE(p.collection_line,'') ILIKE ...`, duas vezes (contagem e página). O `ILIKE` resolve só a caixa. O projeto já tem `slugify` em `backend/src/lib/slug.ts` e em `frontend/src/utils/slug.ts`, com a mesma regra (NFD, remove marcas diacríticas, minúsculas, `[^a-z0-9]+` vira `-`, sem hífen nas pontas), usada para gerar os slugs de categoria, subtipo e produto.

No frontend, `AppNavbar.handleSearch` manda `?name=<termo>` para `/catalogo`; `CatalogoView` lê `name` e repassa o objeto de filtros inteiro para `catalogoApi.buscarProdutos`, que faz `GET /produtos` com esses parâmetros e espera `{ items, meta }`. A API lê `search` e devolve `{ data, pagination }`, então a resposta nunca passa pela checagem e a tela cai no fallback mockado, que filtra com `toLowerCase().includes`.

## Goals / Non-Goals

**Goals:**

- Busca de produtos insensível a maiúsculas, acentos e separadores, com a mesma regra no banco, no backend, no mock de teste e no frontend.
- Manter o termo literal (sem curingas), o limite de 100 caracteres e a semântica de trecho contido.
- Manter o resumo "Resultados para “…”" com o texto que o cliente digitou.

**Non-Goals:**

- Integrar o catálogo público à API real (mapear `categoria`, `materiais`, `cores`, `marcas` e o envelope `{ data, pagination }`). Fica como tarefa própria.
- Normalizar a busca de usuários, fornecedores, categorias e subtipos.
- Busca por palavras em qualquer ordem, ranking ou `pg_trgm`.

## Decisions

### 1. Uma única forma canônica: o slug

O termo e os campos são comparados na forma de slug, a mesma que o projeto já usa para URLs. "Sofá Retrátil 3 lugares" vira `sofa-retratil-3-lugares`; o termo "sofa_retratil" vira `sofa-retratil` e é encontrado por `LIKE '%sofa-retratil%'`. Como todo separador vira um único hífen, "sofa  retratil", "sofa-retratil" e "SOFA_RETRÁTIL" caem no mesmo texto. A regra fica numa função só em cada camada: `slugify` (TS) e `search_slug` (SQL).

Alternativa descartada: só remover acentos com `unaccent(...) ILIKE unaccent(...)`. Resolve o acento, mas não o underline nem os espaços duplos, e deixa duas regras diferentes (slug para URL, outra para busca).

### 2. `search_slug(text)` no banco, com `unaccent`

Migração `014_search_slug.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION search_slug(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
AS $$
  SELECT trim(BOTH '-' FROM regexp_replace(lower(public.unaccent(input)), '[^a-z0-9]+', '-', 'g'));
$$;
```

- `unaccent` vem com o PostgreSQL (`postgres:16-alpine` inclui o contrib) e é extensão confiável desde o PG 13, então o dono do banco a cria sem superusuário.
- A função é declarada `IMMUTABLE` de propósito, mesmo `unaccent` sendo `STABLE`: o dicionário padrão não muda, e isso permite criar um índice de expressão no futuro sem reescrever a função. Esta mudança não cria índice: `LIKE '%…%'` já varre a tabela, e o catálogo é pequeno.
- Para `ç`, `ã`, `é` etc. o resultado é igual ao `slugify` do TypeScript (NFD + remoção de marcas). A diferença fica em letras sem decomposição, como `ø` e `ß`, irrelevantes para o catálogo em português.

Alternativa descartada: `translate(lower(x), 'áàâã…', 'aaaa…')` sem extensão. Não depende de `CREATE EXTENSION`, mas exige manter a lista de letras à mão e diverge do `slugify`.

### 3. Normalização no schema, comparação no repository

- `validateProductQuery` (`products.schema.ts`) continua chamando `parseSearch(url)` (aparar e cortar em 100 caracteres) e aplica `slugify` no resultado; se sobrar vazio, `search` fica `undefined`. A validação do parâmetro fica inteira no schema, como manda a seção 6 de `backend/agents.md`.
- `listPaginated` troca os três `ILIKE` por `search_slug(p.name) LIKE ('%' || ${search} || '%')`, idem para `description` e `collection_line`, nas duas consultas. O `COALESCE` deixa de ser necessário porque `search_slug(NULL)` é `NULL` e `NULL LIKE …` é falso dentro de um `OR` com outras condições; o `escapeLike` continua, por segurança, embora o slug não contenha `%`, `_` nem `\`.
- `ProductQueryFilters.search` passa a documentar que já está na forma de slug.

### 4. Frontend: URL legível, API no contrato

- `AppNavbar.handleSearch` apara e junta espaços repetidos antes de mandar `name` na URL. O resumo da página mostra esse texto.
- `catalogoApi.buscarProdutos` monta os parâmetros da API com `search: slugify(params.name)` (omitido quando vazio) no lugar de `name`, porque `search` é o nome do parâmetro na collection Bruno. Os demais parâmetros seguem como estão até a integração do catálogo.
- O fallback mockado compara `slugify(nome)`, `slugify(categoria)` e `slugify(subcategoria)` com o termo normalizado, para o comportamento ser o mesmo com ou sem backend.
- A listagem administrativa (`ProdutoListView`) não muda: manda o texto aparado e o backend normaliza.

### 5. Mock de teste espelha o banco

`MockProductsRepository.listPaginated` compara `slugify(p.name)`, `slugify(p.description)` e `slugify(p.collectionLine)` com o termo, para os testes de service descreverem o comportamento real (hoje o mock nem olha `collection_line`).

## Risks / Trade-offs

- `CREATE EXTENSION` falha se o papel do banco não puder criar extensões confiáveis. No Docker o papel é o dono do banco, então funciona; em outro ambiente, criar a extensão antes da migração.
- Termos só com símbolos ("***") passam a ser ignorados em vez de buscar o texto literal. Nenhum produto tem nome só de símbolos, então nada se perde.
- O resumo "Resultados para “…”" mostra o termo como digitado, não o slug: o cliente vê o que escreveu.

## Migration Plan

1. Aplicar a migração `014` (o backend aplica no start).
2. Subir o backend com o schema e o repository novos.
3. Subir o frontend. Nenhum passo de rollback de dados: a função e a extensão podem ficar no banco mesmo que o código volte.
