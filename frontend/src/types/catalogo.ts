export type CatalogSortOption =
  | "relevancia"
  | "menor-preco"
  | "maior-preco"
  | "recentes";

export interface CatalogVariationBadge {
  color: string;
  label?: string;
}

export interface CatalogProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  installments: string;
  image: string;
  category: string;
  subcategory?: string;
  material?: string;
  brand?: string;
  finishes: CatalogVariationBadge[];
  availability?: "IN_STOCK" | "ON_DEMAND";
}

export interface CatalogFilterParams {
  name?: string;
  categoria?: string;
  subcategoria?: string;
  materiais?: string[];
  cores?: string[];
  marcas?: string[];
  minPreco?: number;
  maxPreco?: number;
  ordem?: CatalogSortOption;
  page?: number;
  limit?: number;
}

export interface CatalogPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
