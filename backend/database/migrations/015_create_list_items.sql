-- ==============================================================================
-- 015. LIST_ITEMS (Produtos Salvos em cada Lista)
-- ==============================================================================
-- O catálogo do front ainda usa produtos de exemplo (ids como "p-5"), então nesta
-- versão:
--   * product_id é VARCHAR (guarda o identificador que o catálogo envia) e
--     variation_id é UUID sem FK;
--   * product_name, product_slug, product_price, product_image, finish_label e
--     finish_color guardam um retrato do produto no momento em que foi salvo.
-- Quando o catálogo passar a usar os produtos reais da API, uma migration futura
-- (rascunho em rascunho_vincular_listas_a_produtos.sql) converte product_id para
-- UUID e adiciona as FKs para products e product_variations. Os campos de retrato
-- continuam, pois preservam o que o cliente viu mesmo que o produto mude depois.

CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE RESTRICT,
    product_id VARCHAR(100) NOT NULL,
    variation_id UUID,
    product_slug VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    product_price NUMERIC(12, 2) NOT NULL CHECK (product_price >= 0),
    product_image TEXT NOT NULL,
    finish_label VARCHAR(100),
    finish_color VARCHAR(50),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Mesmo produto com o mesmo acabamento não se repete na mesma lista
CREATE UNIQUE INDEX IF NOT EXISTS idx_list_items_unique_active
    ON list_items (
        list_id,
        product_id,
        COALESCE(finish_label, ''),
        COALESCE(finish_color, '')
    )
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_list_items_list_active
    ON list_items (list_id, added_at DESC)
    WHERE deleted_at IS NULL;
