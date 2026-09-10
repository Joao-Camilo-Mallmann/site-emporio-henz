-- ==============================================================================
-- Empório Henz - Esquema Relacional PostgreSQL e Carga Inicial (Seeds)
-- Baseado no DER e PRD do Projeto (docs/PRD.md e apps/backend/agents.md)
-- ==============================================================================

-- Extensão para geração nativa de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABELAS DE AUTENTICAÇÃO E USUÁRIOS
-- ------------------------------------------------------------------------------

-- Tabela de Usuários (Autenticação centralizada por email, sem CPF)
-- Roles: 1 = Cliente, 2 = Vendedor, 3 = Administrador
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT NOT NULL DEFAULT 1 CHECK (role IN (1, 2, 3)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users (email) WHERE deleted_at IS NULL;

-- Tabela de Clientes (Perfil cadastral com vínculo 1:1 com users)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT uq_clients_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. TABELAS DE CATÁLOGO: CATEGORIAS, SUBTIPOS E FORNECEDORES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_active ON categories (slug) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS product_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subtypes_slug_active ON product_subtypes (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subtypes_category_id ON product_subtypes (category_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    contact VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- ------------------------------------------------------------------------------
-- 3. PRODUTOS, VARIAÇÕES E IMAGENS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subtype_id UUID REFERENCES product_subtypes(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    collection_line VARCHAR(100),
    main_material VARCHAR(100),
    reference_price NUMERIC(10, 2),
    max_installments INT DEFAULT 10,
    availability_type VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK' CHECK (availability_type IN ('IN_STOCK', 'ON_DEMAND')),
    estimated_days INT DEFAULT 0,
    height_mm INT,
    width_mm INT,
    depth_mm INT,
    description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_active ON products (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_subtype ON products (subtype_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_material ON products (main_material) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active) WHERE deleted_at IS NULL;

-- Trigger para atualizar automaticamente o updated_at em products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Variações de acabamento e cores (bicolor, tecidos, etc.)
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    variation_type VARCHAR(50) NOT NULL DEFAULT 'FINISH',
    colors_hex VARCHAR(7)[] DEFAULT ARRAY[]::VARCHAR(7)[],
    sample_image_base64 TEXT,
    finish_details JSONB DEFAULT '{}'::jsonb NOT NULL,
    sort_order INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations (product_id) WHERE deleted_at IS NULL;

-- Imagens do produto (Thumbnail leve <50KB e Full <2MB para carrossel)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
    thumbnail_base64 TEXT,
    full_base64 TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_images_product ON product_images (product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_variation ON product_images (variation_id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 4. LISTAS DO CLIENTE (FAVORITOS, DESEJOS, PRESENTES E PASTAS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    list_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOM' CHECK (list_type IN ('FAVORITES', 'WISHLIST', 'GIFT_LIST', 'CUSTOM')),
    is_system BOOLEAN DEFAULT FALSE,
    share_slug UUID UNIQUE DEFAULT gen_random_uuid(),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_lists_client ON lists (client_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT uq_list_item UNIQUE (list_id, product_id, variation_id)
);

CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items (list_id) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 5. CARGA INICIAL (SEEDS)
-- ==============================================================================

-- 5.1 Usuários e Perfis
-- Senha padrão temporária para seeds: Henz@2026 (bcrypt hash seguro simulado)
INSERT INTO users (id, email, password_hash, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@emporiohenz.com.br', '$2a$12$e80Mv.pY0e/gWqfWnKzVRe118rNnL9/5B.wW12U8kS7q9P/2Q6WCe', 3),
    ('22222222-2222-2222-2222-222222222222', 'vendas@emporiohenz.com.br', '$2a$12$e80Mv.pY0e/gWqfWnKzVRe118rNnL9/5B.wW12U8kS7q9P/2Q6WCe', 2),
    ('33333333-3333-3333-3333-333333333333', 'cliente@exemplo.com.br', '$2a$12$e80Mv.pY0e/gWqfWnKzVRe118rNnL9/5B.wW12U8kS7q9P/2Q6WCe', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, user_id, full_name, phone)
VALUES 
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Maria Antônia Silveira', '(51) 99876-5432')
ON CONFLICT (id) DO NOTHING;

-- 5.2 Categorias e Subtipos
INSERT INTO categories (id, name, slug)
VALUES 
    ('ca000001-0000-0000-0000-000000000001', 'Salas de Jantar', 'salas-de-jantar'),
    ('ca000002-0000-0000-0000-000000000002', 'Salas de Estar', 'salas-de-estar'),
    ('ca000003-0000-0000-0000-000000000003', 'Quartos', 'quartos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_subtypes (id, category_id, name, slug)
VALUES 
    ('ba000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Mesas de Jantar', 'mesas-de-jantar'),
    ('ba000002-0000-0000-0000-000000000002', 'ca000002-0000-0000-0000-000000000002', 'Poltronas', 'poltronas'),
    ('ba000003-0000-0000-0000-000000000003', 'ca000002-0000-0000-0000-000000000002', 'Aparadores', 'aparadores'),
    ('ba000004-0000-0000-0000-000000000004', 'ca000003-0000-0000-0000-000000000003', 'Roupeiros', 'roupeiros')
ON CONFLICT (id) DO NOTHING;

-- 5.3 Fornecedores / Fabricantes
INSERT INTO suppliers (id, name, contact)
VALUES 
    ('fa000001-0000-0000-0000-000000000001', 'Móveis Henz Linha Autoral', 'contato@emporiohenz.com.br'),
    ('fa000002-0000-0000-0000-000000000002', 'Primavera Estofados', 'comercial@primaveraestofados.com.br')
ON CONFLICT (id) DO NOTHING;

-- 5.4 Produtos Iniciais (Sincronizados com mockProdutos e especificações do PRD)
INSERT INTO products (
    id, category_id, subtype_id, supplier_id, name, slug, collection_line,
    main_material, reference_price, max_installments, availability_type,
    estimated_days, height_mm, width_mm, depth_mm, description, specifications, active
)
VALUES 
    (
        'aa000001-0000-0000-0000-000000000001',
        'ca000001-0000-0000-0000-000000000001',
        'ba000001-0000-0000-0000-000000000001',
        'fa000001-0000-0000-0000-000000000001',
        'Mesa de Jantar Orgânica Carvalho',
        'mesa-de-jantar-organica-carvalho',
        'Linha Nature',
        'Madeira Maciça Carvalho',
        8950.00,
        10,
        'IN_STOCK',
        0,
        760,
        2200,
        1100,
        'Mesa de jantar contemporânea com tampo em carvalho maciço e bordas orgânicas chanfradas.',
        '{"acabamento": "Verniz PU fosco acetinado", "tampo_espessura_mm": 40, "pes": "Estrutura geométrica em carvalho", "lugares": 8}'::jsonb,
        TRUE
    ),
    (
        'aa000002-0000-0000-0000-000000000002',
        'ca000002-0000-0000-0000-000000000002',
        'ba000002-0000-0000-0000-000000000002',
        'fa000002-0000-0000-0000-000000000002',
        'Poltrona Lina Couro Natural',
        'poltrona-lina-couro-natural',
        'Linha Contemporânea',
        'Tauari e Couro Natural',
        4320.00,
        10,
        'IN_STOCK',
        0,
        820,
        850,
        880,
        'Poltrona de alto conforto com estrutura em tauari e estofamento em couro natural conhaque.',
        '{"revestimento": "Couro Natural Legítimo", "densidade_espuma": "D28 Soft com manta siliconada", "base": "Giratória metálica embutida"}'::jsonb,
        TRUE
    ),
    (
        'aa000003-0000-0000-0000-000000000003',
        'ca000002-0000-0000-0000-000000000002',
        'ba000003-0000-0000-0000-000000000003',
        'fa000001-0000-0000-0000-000000000001',
        'Aparador Minimalista Freijó',
        'aparador-minimalista-freijo',
        'Linha Essência',
        'Lâmina Natural de Freijó',
        5600.00,
        10,
        'ON_DEMAND',
        25,
        800,
        1800,
        450,
        'Aparador com portas ripadas e puxadores embutidos, acabamento fosco suave ao toque.',
        '{"portas": 4, "gavetas_internas": 2, "corredicas": "Telescópicas com amortecimento soft-close"}'::jsonb,
        TRUE
    ),
    (
        'aa000004-0000-0000-0000-000000000004',
        'ca000003-0000-0000-0000-000000000003',
        'ba000004-0000-0000-0000-000000000004',
        'fa000001-0000-0000-0000-000000000001',
        'Roupeiro Roma Linha Itália',
        'roupeiro-roma-linha-italia',
        'Linha Itália',
        '100% MDF',
        11200.00,
        10,
        'ON_DEMAND',
        30,
        2300,
        2430,
        565,
        'Roupeiro premium com portas de correr, divisão ele/ela, gavetas com amortecimento e portas com perfis integrados.',
        '{"portas": 3, "espelho": "Porta central com espelho prata bisotado", "cabideiros": "Alumínio estriado com suporte central", "iluminacao": "LED embutido com sensor"}'::jsonb,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- 5.5 Variações dos Produtos
INSERT INTO product_variations (
    id, product_id, name, variation_type, colors_hex, finish_details, sort_order, in_stock
)
VALUES 
    (
        'da000001-0000-0000-0000-000000000001',
        'aa000001-0000-0000-0000-000000000001',
        'Carvalho Natural',
        'WOOD',
        ARRAY['#C49A45']::VARCHAR(7)[],
        '{"tampo": "Carvalho Natural", "estrutura": "Carvalho Natural"}'::jsonb,
        1,
        TRUE
    ),
    (
        'da000002-0000-0000-0000-000000000002',
        'aa000001-0000-0000-0000-000000000001',
        'Carvalho Ebanizado',
        'WOOD',
        ARRAY['#222222']::VARCHAR(7)[],
        '{"tampo": "Carvalho Tingido Preto Ebanizado", "estrutura": "Carvalho Tingido Preto"}'::jsonb,
        2,
        TRUE
    ),
    (
        'da000003-0000-0000-0000-000000000003',
        'aa000002-0000-0000-0000-000000000002',
        'Couro Natural Conhaque / Tauari',
        'FABRIC',
        ARRAY['#9B4F22', '#D2A679']::VARCHAR(7)[],
        '{"estofamento": "Couro Legítimo Conhaque", "madeira": "Tauari Natural"}'::jsonb,
        1,
        TRUE
    ),
    (
        'da000004-0000-0000-0000-000000000004',
        'aa000004-0000-0000-0000-000000000004',
        'Itaúba Âmbar / Carvalho Mel',
        'FINISH',
        ARRAY['#5C3D28', '#BA8C52']::VARCHAR(7)[],
        '{"caixaria": "Itaúba Âmbar", "portas": "Carvalho Mel", "puxador": "Bronze Fosco"}'::jsonb,
        1,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- 5.6 Imagens dos Produtos (Imagens com placeholders Base64 otimizados)
INSERT INTO product_images (
    id, product_id, variation_id, thumbnail_base64, full_base64, sort_order
)
VALUES 
    (
        'ea000001-0000-0000-0000-000000000001',
        'aa000001-0000-0000-0000-000000000001',
        'da000001-0000-0000-0000-000000000001',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75" viewBox="0 0 100 75"><rect width="100" height="75" fill="%23c49a45"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="10">Mesa Carvalho</text></svg>',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23c49a45"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="28">Mesa de Jantar Carvalho Natural</text></svg>',
        1
    ),
    (
        'ea000002-0000-0000-0000-000000000002',
        'aa000002-0000-0000-0000-000000000002',
        'da000003-0000-0000-0000-000000000003',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75" viewBox="0 0 100 75"><rect width="100" height="75" fill="%239b4f22"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="10">Poltrona Lina</text></svg>',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%239b4f22"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="28">Poltrona Lina Couro Conhaque</text></svg>',
        1
    )
ON CONFLICT (id) DO NOTHING;

-- 5.7 Listas Padrão do Sistema para o Cliente
INSERT INTO lists (id, client_id, name, list_type, is_system, is_public)
VALUES 
    ('fa100001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Favoritos', 'FAVORITES', TRUE, FALSE),
    ('fa100002-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'Lista de Desejos', 'WISHLIST', TRUE, FALSE),
    ('fa100003-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'Lista de Presentes', 'GIFT_LIST', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5.8 Itens de Lista Iniciais
INSERT INTO list_items (list_id, product_id, variation_id)
VALUES 
    ('fa100001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'da000001-0000-0000-0000-000000000001'),
    ('fa100001-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000002', 'da000003-0000-0000-0000-000000000003')
ON CONFLICT (list_id, product_id, variation_id) DO NOTHING;
