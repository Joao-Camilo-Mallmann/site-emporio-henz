import { sql } from "./db";

export async function seedAdmin() {
  console.log("🌱 Executando seeder do Administrador Padrão...");

  const email = "admin@gmail.com";
  const passwordPlain = "admin123";
  const role = 3; // Administrador
  const fullName = "Administrador Geral";
  const phone = "(51) 99999-9999";
  const city = "Cruzeiro do Sul";

  // Gera o hash Argon2id nativo via Bun.password
  const passwordHash = await Bun.password.hash(passwordPlain, "argon2id");

  try {
    // 1. Busca usuário ativo existente
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL LIMIT 1;
    `;

    let userId: string;

    if (existing.length > 0) {
      userId = existing[0]!.id;
      console.log(
        `ℹ Usuário ${email} já existe (${userId}). Atualizando credenciais...`,
      );
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, role = ${role}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId};
      `;
    } else {
      console.log(`+ Inserindo novo usuário ${email}...`);
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO users (email, password_hash, role, city)
        VALUES (${email}, ${passwordHash}, ${role}, ${city})
        RETURNING id;
      `;
      userId = inserted[0]!.id;
    }

    // 2. Garante o registro correspondente em clients
    const existingClient = await sql<{ id: string }[]>`
      SELECT id FROM clients WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1;
    `;

    if (existingClient.length === 0) {
      console.log(
        `+ Inserindo perfil cadastral em clients para ${fullName}...`,
      );
      await sql`
        INSERT INTO clients (user_id, full_name, phone)
        VALUES (${userId}, ${fullName}, ${phone});
      `;
    } else {
      console.log(`✓ Perfil cadastral já vinculado em clients.`);
    }

    console.log(`✓ Seeder concluído com sucesso: ${email} (${fullName})`);
  } catch (error) {
    console.error("✗ Falha ao executar o seeder:", error);
    throw error;
  }
}

if (import.meta.main) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
