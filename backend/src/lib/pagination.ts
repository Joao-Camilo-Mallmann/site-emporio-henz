export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_PAGE = 10_000;
export const MAX_SEARCH_LENGTH = 100;

export interface PaginationParams {
  page: number;
  limit: number;
}

// Envelope único de toda listagem paginada da API.
export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export function parsePagination(url: URL): PaginationParams {
  return {
    page: parseBoundedInt(url.searchParams.get("page"), MAX_PAGE, 1),
    limit: parseBoundedInt(
      url.searchParams.get("limit"),
      MAX_PAGE_LIMIT,
      DEFAULT_PAGE_LIMIT,
    ),
  };
}

// Aplica os padrões e calcula o OFFSET para a consulta SQL.
export function resolvePagination(
  filters: Partial<PaginationParams> = {},
): PaginationParams & { offset: number } {
  const page = filters.page || 1;
  const limit = filters.limit || DEFAULT_PAGE_LIMIT;
  return { page, limit, offset: (page - 1) * limit };
}

export function paginate<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): Paginated<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
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
