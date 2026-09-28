-- ==============================================================================
-- 007. SEED DEFAULT ADMIN (Usuário Administrador Padrão da Plataforma)
-- ==============================================================================
-- Atende a US-DB-01 (Issue #11)
-- Credenciais: admin@gmail.com / admin123
-- Papel (role): 3 (Administrador)
-- Criptografia: Argon2id (padrão nativo Bun.password)
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_admin_role SMALLINT := 3;
    v_admin_email VARCHAR(255) := 'admin@gmail.com';
    -- Hash Argon2id gerado via Bun.password.hash("admin123", "argon2id")
    v_password_hash VARCHAR(255) := '$argon2id$v=19$m=65536,t=2,p=1$hDEpOdTbCWOzrLgBMZcLekMNtkFRX5Za0QSVR7BVbkA$XimdAzVU4spfUM7AaCfowHQCkcjKh9hbP+BplaRVdS0';
BEGIN
    -- 1. Verifica se já existe um usuário ativo com este e-mail
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = v_admin_email AND deleted_at IS NULL;

    -- 2. Se não existir, insere na tabela users
    IF v_user_id IS NULL THEN
        INSERT INTO users (
            email, 
            password_hash, 
            role, 
            city, 
            created_at, 
            updated_at, 
            deleted_at
        )
        VALUES (
            v_admin_email,
            v_password_hash,
            v_admin_role,
            'Cruzeiro do Sul',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            NULL
        )
        RETURNING id INTO v_user_id;
    END IF;

    -- 3. Garante existência do registro cadastral 1:1 na tabela clients
    IF NOT EXISTS (
        SELECT 1 FROM clients WHERE user_id = v_user_id AND deleted_at IS NULL
    ) THEN
        INSERT INTO clients (
            user_id, 
            full_name, 
            phone, 
            created_at, 
            updated_at, 
            deleted_at
        )
        VALUES (
            v_user_id,
            'Administrador Geral',
            '(51) 99999-9999',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            NULL
        );
    END IF;
END $$;
