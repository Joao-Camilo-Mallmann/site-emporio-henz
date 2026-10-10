export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_PAGE = 10_000;
export const MAX_SEARCH_LENGTH = 100;

function parseBoundedInt(
  raw: string | null,
  max: number,
  fallback: number,
): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= max
    ? value
    : fallback;
}

export function parsePagination(url: URL): { page: number; limit: number } {
  return {
    page: parseBoundedInt(url.searchParams.get("page"), MAX_PAGE, 1),
    limit: parseBoundedInt(
      url.searchParams.get("limit"),
      MAX_PAGE_LIMIT,
      DEFAULT_PAGE_LIMIT,
    ),
  };
}

export function parseSearch(url: URL): string | undefined {
  const search = url.searchParams.get("search")?.trim();
  return search ? search.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

// Escapa os curingas do LIKE/ILIKE para que o termo seja buscado literalmente.
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, "\\$&");
}
