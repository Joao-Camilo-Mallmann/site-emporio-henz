# Banco de dados

Documentação da persistência PostgreSQL do Empório Henz. O modelo conceitual completo está na seção de [modelagem do PRD](../PRD.md#8-modelagem); as migrações executáveis ficam em [`backend/database/`](../../backend/database/).

## Referências

- [PRD](../PRD.md)
- [Padrão de histórias e tarefas](../padrao-historias-tarefas.md)
- [Migrações e seed](../../backend/database/)
- [Documentação do back-end](../backend/README.md)

## Princípios

1. **Database First:** modelar e validar tabelas, restrições e índices antes das camadas de API e interface.
2. **Soft delete:** entidades de negócio usam `deleted_at`; não se executa `DELETE` físico nesses registros.
3. **Unicidade ativa:** campos únicos sujeitos a reuso usam índices parciais com `WHERE deleted_at IS NULL`.
4. **Migrações ordenadas:** arquivos SQL recebem prefixos numéricos e são aplicados pelo runner em ordem.
5. **Idempotência:** uma migração já aplicada não deve ser executada novamente.
6. **Imagens fora do banco:** fotos de produto e amostras de variação são arquivos no volume de uploads do backend. As tabelas guardam só o caminho relativo (`thumbnail_path`, `full_image_path` e `sample_image_path`, em `VARCHAR(255)`), nunca o conteúdo da imagem nem Base64.
7. **JSONB sempre objeto:** `products.specifications` e `product_variations.finish_details` guardam um objeto JSON, garantido por `CHECK (jsonb_typeof(...) = 'object')` desde a migração `013`. O backend envia o objeto direto ao driver SQL do Bun, nunca `JSON.stringify(objeto)`: o driver codifica de novo um texto enviado a uma coluna JSON, e o valor seria gravado como string.

## Estrutura

```text
backend/database/
├── migrate.ts       # Runner de migrações
├── seed.ts          # Dados iniciais
└── migrations/      # Arquivos SQL versionados
```

As tabelas atualmente implementadas são `roles`, `users`, `clients`, `suppliers`, `user_suppliers`, `categories`, `product_subtypes`, `products`, `product_variations` e `product_images`. O modelo planejado no PRD também contempla listas (`lists` e `list_items`).

## Executar

```bash
cd backend
bun run migrate
bun run seed
```

Nos containers `backend` e `backend-dev`, o Dockerfile executa as migrações antes de iniciar a API.

## Validar

- Execute as migrações em um banco vazio.
- Execute novamente para confirmar que não existem migrações pendentes.
- Verifique soft delete e índices parciais para registros ativos.
- Mantenha o PRD sincronizado quando uma alteração de persistência afetar o produto.
