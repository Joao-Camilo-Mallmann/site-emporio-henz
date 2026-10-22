// Contrato da API de produtos (collection Bruno, pasta `Products/`).

import type { Paginated, PaginationParams } from "./pagination";

export type AvailabilityType = "IN_STOCK" | "ON_DEMAND";

export type VariationType = "COLOR" | "FABRIC" | "WOOD" | "FINISH";

/** Atributos livres guardados em JSONB (`specifications`, `finishDetails`). */
export type ProductAttributes = Record<string, unknown>;

export interface ProductVariationDto {
  id: string;
  productId?: string;
  name: string;
  variationType: VariationType;
  colorsHex: string[];
  finishDetails: ProductAttributes | null;
  /** URL relativa (`/api/v1/uploads/...`) ou `null` sem amostra enviada. */
  sampleImageUrl: string | null;
  sortOrder: number;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  variationId: string | null;
  /** URLs relativas (`/api/v1/uploads/...`). Use `toApiAssetUrl` para exibir. */
  thumbnailUrl: string;
  fullImageUrl: string;
  sortOrder: number;
  createdAt: string;
}

/**
 * Item da listagem `GET /produtos`. Traz os dados cadastrais e a miniatura da
 * capa, sem `variations` nem `images`.
 */
export interface ProductListItemDto {
  id: string;
  categoryId: string;
  subtypeId: string | null;
  supplierId: string;
  name: string;
  slug: string;
  collectionLine: string | null;
  mainMaterial: string | null;
  referencePrice: number;
  maxInstallments: number;
  availabilityType: AvailabilityType;
  estimatedDays: number;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  description: string | null;
  specifications: ProductAttributes | null;
  active: boolean;
  /** Miniatura da capa (`null` sem foto ativa). */
  thumbnailUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Produto completo de `GET /produtos/:id`, `POST /produtos` e `PUT /produtos/:id`. */
export interface ProductDto extends ProductListItemDto {
  /** Variações ativas ordenadas por `sortOrder`. */
  variations: ProductVariationDto[];
  /** Fotos ativas ordenadas por `sortOrder` (presente em `GET /produtos/:id`). */
  images?: ProductImageDto[];
}

export interface ProductVariationPayload {
  /** Só na atualização: preserva a variação existente. */
  id?: string;
  name: string;
  variationType: VariationType;
  colorsHex: string[];
  finishDetails?: Record<string, string>;
  sortOrder: number;
  inStock: boolean;
}

/** Corpo de `POST /produtos`. O JSON não leva imagens. */
export interface ProductCreatePayload {
  categoryId: string;
  subtypeId?: string;
  supplierId: string;
  name: string;
  slug: string;
  collectionLine?: string;
  mainMaterial?: string;
  referencePrice: number;
  maxInstallments: number;
  availabilityType: AvailabilityType;
  /** Obrigatório (>= 1) em `ON_DEMAND`; omitido em `IN_STOCK`. */
  estimatedDays?: number;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  description?: string;
  specifications?: Record<string, string>;
  active: boolean;
  variations: ProductVariationPayload[];
}

/** Corpo de `PUT /produtos/:id`. */
export type ProductUpdatePayload = Partial<ProductCreatePayload>;

/** Filtros de `GET /produtos` (listagem pública e administrativa). */
export interface ProductAdminFilterParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  subtypeId?: string;
  supplierId?: string;
  availabilityType?: AvailabilityType;
  minPrice?: number;
  maxPrice?: number;
  /** Só o Administrador enxerga produtos inativos. */
  active?: boolean;
}

export type PaginatedProductsResponse = Paginated<ProductListItemDto>;
