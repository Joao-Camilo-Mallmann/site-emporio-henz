import type { PaginationParams } from "./pagination";

export type CatalogAvailability = "IN_STOCK" | "ON_DEMAND";

export type ColorGroupSlug =
  | "madeira-clara"
  | "madeira-escura"
  | "off-white-bege"
  | "preto"
  | "madeira-media"
  | "branco"
  | "cinza"
  | "verde"
  | "azul"
  | "terracota-rose-vinho"
  | "amarelo-dourado";

export interface ColorGroupOption {
  slug: ColorGroupSlug;
  name: string;
  hex: string;
  /** Verdadeiro para tons claros, que usam ícone escuro no estado selecionado. */
  light?: boolean;
}

export interface FurnitureColorOption {
  slug: string;
  name: string;
  hex: string;
  group: ColorGroupSlug;
  light?: boolean;
}

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
  supplierId?: string;
  supplierName?: string;
  material?: string;
  brand?: string;
  finishes: CatalogVariationBadge[];
  availability?: "IN_STOCK" | "ON_DEMAND";
  estimatedDays?: number;
}

/** Estado de filtros da tela do catálogo, espelhado na URL (`?categoria=&subcategoria=&fornecedor=&cores=&name=...`). */
export interface CatalogFilterParams {
  name?: string;
  categoria?: string;
  subcategoria?: string;
  fornecedor?: string;
  disponibilidade?: CatalogAvailability[];
  cores?: ColorGroupSlug[];
  minPreco?: number;
  maxPreco?: number;
  page?: number;
  limit?: number;
}

/** Parâmetros de `GET /produtos` usados pelo catálogo público (collection Bruno `Products/List Products`). */
export interface CatalogApiParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  subtypeId?: string;
  supplierId?: string;
  availabilityType?: CatalogAvailability;
  colors?: string;
  minPrice?: number;
  maxPrice?: number;
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
  colorsHex?: string[];
  sampleImageUrl?: string | null;
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
  discountPixPercent?: number;
  description: string;
  category: string;
  subcategory?: string;
  supplierId?: string;
  supplierName?: string;
  brand?: string;
  line?: string;
  mainFeatures?: string[];
  images: ProductImageItem[];
  variations: ProductVariationItem[];
  specifications: ProductSpecificationItem[];
  relatedProducts?: CatalogProductItem[];
}

