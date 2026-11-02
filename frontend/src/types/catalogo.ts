import type { Paginated, PaginationParams } from "./pagination";

export type CatalogAvailability = "IN_STOCK" | "ON_DEMAND";

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
  estimatedDays?: number;
}

/**
 * Filtros do catálogo público, com os nomes usados na URL (`?categoria=`,
 * `?subcategoria=`...). A camada `api/catalogo.ts` traduz para o contrato de
 * `GET /produtos` (`categoryId`, `subtypeId`, `availabilityType`, `minPrice`,
 * `maxPrice`, `search`).
 */
export interface CatalogFilterParams extends PaginationParams {
  /** Termo como digitado; vai à API normalizado como slug em `search`. */
  name?: string;
  /** Slug da categoria (ou nome, comparado na forma de slug). */
  categoria?: string;
  /** Slug do subtipo (ou nome, comparado na forma de slug). */
  subcategoria?: string;
  /** Com uma opção marcada filtra; com nenhuma ou as duas não filtra. */
  disponibilidade?: CatalogAvailability[];
  minPreco?: number;
  maxPreco?: number;
}

export type CatalogResponse = Paginated<CatalogProductItem>;

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

