import { sql } from "@/config/database";
import type { SQL } from "bun";

type SqlFragment = SQL.Query<any>;

// Versão SQL do `slugify` (src/lib/slug.ts), só com funções nativas do
// PostgreSQL: sem extensão nem função criada por migração. `translate` cobre
// os acentos do português e do espanhol, o que o NFD do `slugify` remove.
// A coluna chega como fragmento literal (sql`p.name`), nunca como parâmetro.
export function slugSql(column: SqlFragment): SqlFragment {
  return sql`trim(BOTH '-' FROM regexp_replace(translate(lower(${column}), 'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny'), '[^a-z0-9]+', '-', 'g'))`;
}

// Condição de busca (RF05): `search` já vem na forma de slug (parseSearchSlug)
// e escapado (escapeLike); casa se alguma coluna, na forma de slug, o contém.
// Slug de coluna NULL é NULL, e NULL LIKE é falso dentro do OR, então colunas
// opcionais dispensam COALESCE.
export function slugSearchCondition(
  search: string | null,
  columns: SqlFragment[],
): SqlFragment {
  const matches = columns
    .map((column) => sql`${slugSql(column)} LIKE ('%' || ${search} || '%')`)
    .reduce((acc, match) => sql`${acc} OR ${match}`);
  return sql`(${search}::text IS NULL OR ${matches})`;
}
