import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "./db";

export async function runMigrations() {
  console.log("Iniciando runner de migrações...");

  const migrationsDir = join(import.meta.dir, "../migrations");

  if (!existsSync(migrationsDir)) {
    console.warn(`Diretório de migrações não encontrado em: ${migrationsDir}`);
    return;
  }

  try {
    // 1. Garantir existência da tabela de controle _migrations
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Buscar migrações já executadas
    const applied = await sql<{ name: string }[]>`
      SELECT name FROM _migrations ORDER BY id ASC;
    `;
    const appliedNames = new Set(
      applied.map((row: { name: string }) => row.name),
    );

    // 3. Listar arquivos de migração ordenados numericamente/alfabeticamente
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    const pending = sqlFiles.filter((f) => !appliedNames.has(f));

    if (pending.length === 0) {
      console.log("✓ Nenhuma migração pendente. Banco de dados atualizado.");
      return;
    }

    console.log(`Encontrada(s) ${pending.length} migração(ões) pendente(s).`);

    // 4. Aplicar cada migração pendente dentro de transação individual
    for (const file of pending) {
      console.log(`Aplicando: ${file}...`);
      const filePath = join(migrationsDir, file);
      const content = await Bun.file(filePath).text();

      await sql.begin(async (tx: any) => {
        await tx.unsafe(content);
        await tx`
          INSERT INTO _migrations (name) VALUES (${file});
        `;
      });

      console.log(`✓ Concluída: ${file}`);
    }

    console.log("✓ Todas as migrações foram aplicadas com sucesso.");
  } catch (error) {
    console.error("✗ Falha crítica durante a execução das migrações:", error);
    throw error;
  }
}
