-- ==============================================================================
-- 008. CATEGORIES (Categorias e Ambientes da Casa)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_active 
    ON categories (slug) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_active 
    ON categories (active) 
    WHERE deleted_at IS NULL;
