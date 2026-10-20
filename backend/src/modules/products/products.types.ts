import { Paginated } from "@/lib/pagination";

export type AvailabilityType = "IN_STOCK" | "ON_DEMAND";

export type VariationType = "COLOR" | "FABRIC" | "WOOD" | "FINISH";

export interface ProductDbRow {
  id: string;
  category_id: string;
  subtype_id: string | null;
  supplier_id: string | null;
  name: string;
  slug: string;
  collection_line: string | null;
  main_material: string | null;
  reference_price: string | number;
  max_installments: number;
  availability_type: string;
  estimated_days: number;
  height_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  // Miniatura da capa, trazida pelo LEFT JOIN LATERAL das consultas de listagem
  // e detalhe; ausente nos RETURNING de INSERT/UPDATE.
  cover_thumbnail_path?: string | null;
}

export interface ProductVariationDbRow {
  id: string;
  product_id: string;
  name: string;
  variation_type: string;
  colors_hex: string[] | null;
  sample_image_path: string | null;
  finish_details: Record<string, unknown> | null;
  sort_order: number;
  in_stock: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImageDbRow {
  id: string;
  product_id: string;
  variation_id: string | null;
  thumbnail_path: string;
  full_image_path: string;
  sort_order: number;
  created_at: Date;
}

export interface ProductVariationDto {
  id: string;
  productId: string;
  name: string;
  variationType: string;
  colorsHex: string[];
  sampleImageUrl: string | null;
  finishDetails: Record<string, unknown>;
  sortOrder: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  variationId: string | null;
  thumbnailUrl: string;
  fullImageUrl: string;
  sortOrder: number;
  createdAt: string;
}

// Campos mínimos para decidir se o ator pode escrever no produto.
export type ManageableProduct = Pick<ProductDto, "id" | "supplierId" | "active">;

export interface ProductDto {
  id: string;
  categoryId: string;
  subtypeId: string | null;
  supplierId: string | null;
  name: string;
  slug: string;
  collectionLine: string | null;
  mainMaterial: string | null;
  referencePrice: number;
  maxInstallments: number;
  availabilityType: string;
  estimatedDays: number;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  description: string | null;
  specifications: Record<string, unknown>;
  active: boolean;
  // Miniatura da capa: primeira foto ativa sem variação; sem ela, a primeira
  // foto ativa de variação; `null` quando o produto não tem foto.
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto extends ProductDto {
  variations: ProductVariationDto[];
  images: ProductImageDto[];
}

export interface ProductVariationInputDto {
  id?: string;
  name: string;
  variationType?: VariationType;
  colorsHex?: string[];
  finishDetails?: Record<string, unknown>;
  sortOrder?: number;
  inStock?: boolean;
}

export interface CreateProductDto {
  categoryId: string;
  subtypeId?: string | null;
  supplierId: string;
  name: string;
  slug?: string;
  collectionLine?: string | null;
  mainMaterial?: string | null;
  referencePrice: number;
  maxInstallments?: number;
  availabilityType: AvailabilityType;
  estimatedDays: number;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  description?: string | null;
  specifications?: Record<string, unknown>;
  active?: boolean;
  variations?: ProductVariationInputDto[];
}

export interface UpdateProductDto {
  categoryId?: string;
  subtypeId?: string | null;
  supplierId?: string;
  name?: string;
  slug?: string;
  collectionLine?: string | null;
  mainMaterial?: string | null;
  referencePrice?: number;
  maxInstallments?: number;
  availabilityType?: AvailabilityType;
  estimatedDays?: number;
  heightMm?: number;
  widthMm?: number;
  depthMm?: number;
  description?: string | null;
  specifications?: Record<string, unknown>;
  active?: boolean;
  variations?: ProductVariationInputDto[];
}

export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subtypeId?: string;
  supplierId?: string;
  availabilityType?: AvailabilityType;
  active?: boolean;
  supplierIds?: string[];
}

export type PaginatedProductsResult = Paginated<ProductDto>;
