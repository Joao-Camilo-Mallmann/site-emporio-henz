import { SQL } from "bun";

function getDatabaseUrl(): string {
  const user = process.env.POSTGRES_USER || "postgres";
  const password = process.env.POSTGRES_PASSWORD || "postgres";
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
