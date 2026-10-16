-- ==============================================================================
-- 012. PRODUCT_IMAGES (Carrossel de Fotos: Thumbnail vs Full)
-- ==============================================================================
-- As fotos são arquivos no volume de uploads do backend; as colunas guardam só
-- o caminho relativo a esse diretório, nunca o conteúdo da imagem.

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variation_id UUID DEFAULT NULL REFERENCES product_variations(id) ON DELETE RESTRICT,
    thumbnail_path VARCHAR(255) NOT NULL,
    full_image_path VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_active
    ON product_images (product_id, sort_order)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_images_variation_active
    ON product_images (variation_id)
    WHERE deleted_at IS NULL;
