-- ==============================================================================
-- 009. PRODUCT_SUBTYPES (Subcategorias e Tipologias de Móveis)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS product_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subtypes_slug_active 
    ON product_subtypes (slug) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subtypes_category_id 
    ON product_subtypes (category_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_subtypes_active 
    ON product_subtypes (active) 
    WHERE deleted_at IS NULL;
