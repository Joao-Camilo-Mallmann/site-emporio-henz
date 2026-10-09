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

export interface CatalogResponse {
  items: CatalogProductItem[];
  meta: CatalogPaginationMeta;
}

export interface ProductImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

export interface ProductVariationItem {
  id: string;
  name: string;
  colorHex?: string;
  imageRef?: string;
  available?: boolean;
}

export interface ProductSpecificationItem {
  label: string;
  value: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  price: number;
  installments: string;
  manufacturingTime?: string;
  deliveryCondition?: string;
  discountPixPercent?: number;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  line?: string;
  mainFeatures?: string[];
  images: ProductImageItem[];
  variations: ProductVariationItem[];
  specifications: ProductSpecificationItem[];
  relatedProducts?: CatalogProductItem[];
}

