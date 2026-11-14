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
  slug?: string;
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

/**
 * Corpo de `PUT /produtos/:id`. A API só altera o campo que vem no corpo:
 * `null` limpa os campos opcionais e `{}` limpa especificações e detalhes de
 * acabamento. Campo omitido (`undefined`) mantém o valor gravado.
 */
export type ProductUpdatePayload = Omit<
  Partial<ProductCreatePayload>,
  "subtypeId" | "collectionLine" | "mainMaterial" | "description"
> & {
  subtypeId?: string | null;
  collectionLine?: string | null;
  mainMaterial?: string | null;
  description?: string | null;
};

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

export type UploadState = "pending" | "uploading" | "done" | "error";

/** Valor de `<input type="number">` com `v-model`: número, ou `""` se vazio. */
export type NumericInput = number | "";

/** Mapa `id do campo no DOM → mensagem de erro`, na ordem visual da tela. */
export type FieldErrors = Record<string, string>;

export interface KeyValueRow {
  /** Chave local, estável, para o `v-for` e para o `id` dos inputs. */
  id: string;
  key: string;
  value: string;
}

export interface SampleFormItem {
  file: File;
  /** Object URL do arquivo local (`URL.createObjectURL`). */
  previewUrl: string;
  uploadState: UploadState;
  uploadError?: string;
  /** `sampleImageUrl` devolvido pela API depois do envio. */
  uploadedUrl: string | null;
}

export interface VariationFormItem {
  /** Chave local; o `id` real só existe depois do `POST /produtos`. */
  key: string;
  id: string | null;
  name: string;
  variationType: VariationType;
  colorsHex: string[];
  finishDetails: KeyValueRow[];
  inStock: boolean;
  sample: SampleFormItem | null;
  /**
   * Amostra já gravada na API (`sampleImageUrl`), só na edição. Um novo
   * arquivo em `sample` substitui esta amostra depois do `PUT`.
   */
  existingSampleUrl: string | null;
}

export interface PhotoFormItem {
  key: string;
  file: File;
  /** Object URL do arquivo local (`URL.createObjectURL`). */
  previewUrl: string;
  /** Variação associada pela chave local, ou `null` para foto geral. */
  variationKey: string | null;
  uploadState: UploadState;
  uploadError?: string;
  uploaded: ProductImageDto | null;
}

export interface ProductFormState {
  name: string;
  slug: string;
  /** `true` depois que o usuário edita o slug: ele deixa de seguir o nome. */
  slugEdited: boolean;
  categoryId: string;
  subtypeId: string;
  supplierId: string;
  collectionLine: string;
  mainMaterial: string;
  description: string;
  referencePrice: NumericInput;
  maxInstallments: NumericInput;
  availabilityType: AvailabilityType;
  estimatedDays: NumericInput;
  heightMm: NumericInput;
  widthMm: NumericInput;
  depthMm: NumericInput;
  variations: VariationFormItem[];
  photos: PhotoFormItem[];
  specifications: KeyValueRow[];
  active: boolean;
}
