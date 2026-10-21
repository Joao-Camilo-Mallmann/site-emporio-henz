import { SQL } from "bun";

// Monta a URL de conexão a partir das variáveis POSTGRES_*. Usuário e senha são
// codificados para que caracteres como @, : ou / na senha não quebrem a URL.
function getDatabaseUrl(): string {
  const user = encodeURIComponent(process.env.POSTGRES_USER || "postgres");
  const password = encodeURIComponent(
    process.env.POSTGRES_PASSWORD || "postgres",
  );
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const db = process.env.POSTGRES_DB || "emporio_henz";

  return `postgres://${user}:${password}@${host}:${port}/${db}`;
}

const connectionUrl = getDatabaseUrl();

export const sql = new SQL(connectionUrl);

export function createDbClient(url?: string): SQL {
  return new SQL(url || getDatabaseUrl());
}

export default sql;
