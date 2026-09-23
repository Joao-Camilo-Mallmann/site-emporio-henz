-- ==============================================================================
-- 001. EXTENSIONS & SETUP INICIAL
-- ==============================================================================

-- Habilita extensão pgcrypto para suporte a UUID nativo caso necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remove quaisquer tabelas de catálogo criadas prematuramente em desenvolvimento
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_subtypes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
