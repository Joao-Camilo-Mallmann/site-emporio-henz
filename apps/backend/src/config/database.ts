import { createDbClient, sql } from "./db";

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as connected`;
    return Boolean(result && result.length > 0);
  } catch (error) {
    console.error(
      "Aviso: Falha ao conectar ao banco de dados PostgreSQL:",
      error,
    );
    return false;
  }
}

export { createDbClient, sql };
export default sql;
