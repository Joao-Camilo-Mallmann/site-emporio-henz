-- Habilita extensão pgcrypto para suporte a UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS & CLIENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT NOT NULL DEFAULT 1, -- 1=Cliente, 2=Vendedor, 3=Admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_id_active ON clients (user_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 2. CATEGORIES, SUBTYPES & SUPPLIERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_active ON categories (slug) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS product_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subtypes_slug_active ON product_subtypes (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subtypes_category_active ON product_subtypes (category_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- ==============================================================================
-- 3. PRODUCTS & SPECIFICATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    subtype_id UUID REFERENCES product_subtypes(id),
    supplier_id UUID REFERENCES suppliers(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    collection_line VARCHAR(150),
    main_material VARCHAR(150),
    reference_price NUMERIC(10, 2),
    max_installments INTEGER DEFAULT 10,
    availability_type VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK', -- 'IN_STOCK' ou 'ON_DEMAND'
    estimated_days INTEGER DEFAULT 0,
    height_mm INTEGER,
    width_mm INTEGER,
    depth_mm INTEGER,
    description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_active ON products (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_subtype_active ON products (subtype_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_material_active ON products (main_material) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products (deleted_at);

-- ==============================================================================
-- 4. VARIATIONS & IMAGES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    variation_type VARCHAR(50) NOT NULL DEFAULT 'COLOR', -- 'COLOR', 'FABRIC', 'WOOD', 'FINISH'
    colors_hex VARCHAR(7)[] DEFAULT ARRAY[]::VARCHAR(7)[],
    sample_image_base64 TEXT,
    finish_details JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_variations_product_active ON product_variations (product_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    variation_id UUID REFERENCES product_variations(id),
    thumbnail_base64 TEXT,
    full_base64 TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_product_active ON product_images (product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_variation_active ON product_images (variation_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 5. LISTS & LIST_ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    list_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOM', -- 'FAVORITES', 'WISHLIST', 'GIFT_LIST', 'CUSTOM'
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    share_slug UUID NOT NULL DEFAULT gen_random_uuid(),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_share_slug_active ON lists (share_slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lists_client_active ON lists (client_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lists(id),
    product_id UUID NOT NULL REFERENCES products(id),
    variation_id UUID REFERENCES product_variations(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_active ON list_items (list_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_list_items_product_active ON list_items (product_id) WHERE deleted_at IS NULL;
