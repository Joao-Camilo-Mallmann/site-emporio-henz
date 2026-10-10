import { sql } from "@/config/database";

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

    console.log(`✓ Seeder de admin concluído com sucesso: ${email} (${fullName})`);
  } catch (error) {
    console.error("✗ Falha ao executar o seeder de admin:", error);
    throw error;
  }
}

interface CategorySeedData {
  name: string;
  slug: string;
  subtypes: Array<{ name: string; slug: string }>;
}

export const INITIAL_CATEGORIES: CategorySeedData[] = [
  {
    name: "Quarto",
    slug: "quarto",
    subtypes: [
      { name: "Camas", slug: "camas" },
      { name: "Roupeiros", slug: "roupeiros" },
      { name: "Cabeceiras", slug: "cabeceiras" },
      { name: "Cômodas", slug: "comodas" },
      { name: "Mesas de Cabeceira", slug: "mesas-de-cabeceira" },
    ],
  },
  {
    name: "Sala de Estar",
    slug: "sala-de-estar",
    subtypes: [
      { name: "Sofás", slug: "sofas" },
      { name: "Poltronas", slug: "poltronas" },
      { name: "Mesas de Centro", slug: "mesas-de-centro" },
      { name: "Racks e Painéis", slug: "racks-e-paineis" },
      { name: "Puffs", slug: "puffs" },
    ],
  },
  {
    name: "Sala de Jantar",
    slug: "sala-de-jantar",
    subtypes: [
      { name: "Mesas de Jantar", slug: "mesas-de-jantar" },
      { name: "Cadeiras", slug: "cadeiras" },
      { name: "Aparadores", slug: "aparadores" },
      { name: "Cristaleiras", slug: "cristaleiras" },
      { name: "Buffets", slug: "buffets" },
    ],
  },
  {
    name: "Cozinha",
    slug: "cozinha",
    subtypes: [
      { name: "Armários", slug: "armarios" },
      { name: "Balcões", slug: "balcoes" },
      { name: "Bancadas", slug: "bancadas" },
      { name: "Banquetas", slug: "banquetas" },
      { name: "Ilhas Gourmet", slug: "ilhas-gourmet" },
    ],
  },
  {
    name: "Escritório",
    slug: "escritorio",
    subtypes: [
      { name: "Mesas de Escritório", slug: "mesas-de-escritorio" },
      { name: "Cadeiras Presidente", slug: "cadeiras-presidente" },
      { name: "Estantes de Livros", slug: "estantes-de-livros" },
      { name: "Gaveteiros", slug: "gaveteiros" },
    ],
  },
  {
    name: "Banheiro",
    slug: "banheiro",
    subtypes: [
      { name: "Gabinetes", slug: "gabinetes" },
      { name: "Espelheiras", slug: "espelheiras" },
      { name: "Armários Aéreos", slug: "armarios-aereos" },
      { name: "Prateleiras", slug: "prateleiras" },
    ],
  },
];

export async function seedCategoriesAndSubtypes() {
  console.log("🌱 Executando seeder de Categorias e Subtipos oficiais...");

  // Apenas insere o que nunca existiu: registros já presentes (inclusive
  // renomeados, desativados ou deletados pelo Administrador) não são alterados.
  try {
    await sql.begin(async (tx) => {
      for (const cat of INITIAL_CATEGORIES) {
        // 1. Busca ou insere a categoria
        const existingCat = await tx<{ id: string; deleted: boolean }[]>`
          SELECT id, deleted_at IS NOT NULL AS deleted
          FROM categories
          WHERE slug = ${cat.slug}
          ORDER BY deleted_at IS NULL DESC
          LIMIT 1;
        `;

        let categoryId: string;

        if (existingCat.length > 0) {
          if (existingCat[0]!.deleted) {
            console.log(`ℹ Categoria ${cat.slug} foi deletada; mantida assim.`);
            continue;
          }
          categoryId = existingCat[0]!.id;
        } else {
          const insertedCat = await tx<{ id: string }[]>`
            INSERT INTO categories (name, slug, active)
            VALUES (${cat.name}, ${cat.slug}, TRUE)
            RETURNING id;
          `;
          categoryId = insertedCat[0]!.id;
          console.log(`+ Categoria inserida: ${cat.name} (${cat.slug})`);
        }

        // 2. Insere os subtipos que nunca existiram
        for (const sub of cat.subtypes) {
          const existingSub = await tx<{ id: string }[]>`
            SELECT id FROM product_subtypes WHERE slug = ${sub.slug} LIMIT 1;
          `;

          if (existingSub.length === 0) {
            await tx`
              INSERT INTO product_subtypes (category_id, name, slug, active)
              VALUES (${categoryId}, ${sub.name}, ${sub.slug}, TRUE);
            `;
            console.log(
              `  + Subtipo inserido: ${sub.name} (${sub.slug}) -> ${cat.name}`,
            );
          }
        }
      }
    });

    console.log("✓ Seeder de categorias e subtipos concluído com sucesso.");
  } catch (error) {
    console.error("✗ Falha ao executar o seeder de categorias e subtipos:", error);
    throw error;
  }
}

export async function runAllSeeds() {
  await seedAdmin();
  await seedCategoriesAndSubtypes();
}

if (import.meta.main) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
