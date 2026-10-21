-- ==============================================================================
-- 010. PRODUCTS (Catálogo de Móveis e Itens de Decoração)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subtype_id UUID DEFAULT NULL REFERENCES product_subtypes(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    collection_line VARCHAR(255) DEFAULT NULL,
    main_material VARCHAR(255) DEFAULT NULL,
    reference_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_installments INTEGER NOT NULL DEFAULT 1,
    availability_type VARCHAR(20) NOT NULL DEFAULT 'IN_STOCK' CHECK (availability_type IN ('IN_STOCK', 'ON_DEMAND')),
    estimated_days INTEGER NOT NULL DEFAULT 0,
    height_mm INTEGER NOT NULL CHECK (height_mm > 0),
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    depth_mm INTEGER NOT NULL CHECK (depth_mm > 0),
    description TEXT DEFAULT NULL,
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_active
    ON products (slug)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON products (category_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_subtype_active
    ON products (subtype_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_active
    ON products (supplier_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_active
    ON products (active)
    WHERE deleted_at IS NULL;
