-- ==============================================================================
-- 011. PRODUCT_VARIATIONS (Variações de Acabamento, Tecidos, Cores e Madeiras)
-- ==============================================================================
-- A amostra da textura é um arquivo no volume de uploads do backend; a coluna
-- guarda só o caminho relativo a esse diretório, nunca o conteúdo da imagem.

CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    variation_type VARCHAR(50) NOT NULL DEFAULT 'FINISH',
    colors_hex VARCHAR(7)[] NOT NULL DEFAULT '{}'::varchar(7)[],
    sample_image_path VARCHAR(255) DEFAULT NULL,
    finish_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_variations_product_active
    ON product_variations (product_id, sort_order)
    WHERE deleted_at IS NULL;
