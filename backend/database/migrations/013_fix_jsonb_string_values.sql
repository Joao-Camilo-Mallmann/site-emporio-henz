-- ==============================================================================
-- 013. CORREÇÃO DE JSONB GRAVADO COMO TEXTO (specifications e finish_details)
-- ==============================================================================
-- O repositório de produtos enviava `JSON.stringify(objeto)` para colunas
-- `jsonb`. O driver SQL do Bun codifica de novo um parâmetro de texto quando o
-- destino é JSON, e o valor era gravado como um `jsonb` do tipo string
-- (ex.: "{\"portas\":\"6\"}") em vez de objeto. A API devolvia esse texto e a
-- tela de edição o lia caractere por caractere.
--
-- Esta migração:
-- 1. converte os valores gravados como string de volta para o objeto que eles
--    contêm (`#>> '{}'` extrai o texto do escalar e `::jsonb` o interpreta);
-- 2. impede que um valor que não seja objeto volte a ser gravado.
-- É idempotente: só altera linhas cujo tipo ainda é string.

UPDATE products
SET specifications = (specifications #>> '{}')::jsonb
WHERE jsonb_typeof(specifications) = 'string';

UPDATE product_variations
SET finish_details = (finish_details #>> '{}')::jsonb
WHERE jsonb_typeof(finish_details) = 'string';

-- Um texto que não continha um objeto JSON vira objeto vazio.
UPDATE products
SET specifications = '{}'::jsonb
WHERE jsonb_typeof(specifications) <> 'object';

UPDATE product_variations
SET finish_details = '{}'::jsonb
WHERE jsonb_typeof(finish_details) <> 'object';

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_products_specifications_object;
ALTER TABLE products
    ADD CONSTRAINT chk_products_specifications_object
    CHECK (jsonb_typeof(specifications) = 'object');

ALTER TABLE product_variations
    DROP CONSTRAINT IF EXISTS chk_product_variations_finish_details_object;
ALTER TABLE product_variations
    ADD CONSTRAINT chk_product_variations_finish_details_object
    CHECK (jsonb_typeof(finish_details) = 'object');
