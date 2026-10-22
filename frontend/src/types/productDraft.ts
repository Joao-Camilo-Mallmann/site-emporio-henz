// Estado local do formulário de cadastro de produto (`/admin/produtos/novo`).
// As funções que operam sobre esses tipos ficam em
// `src/views/admin/produtos/formulario/produtoDraft.ts`.

import type {
  AvailabilityType,
  ProductImageDto,
  VariationType,
} from "./products";

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

export interface SampleDraft {
  file: File;
  /** Object URL do arquivo local (`URL.createObjectURL`). */
  previewUrl: string;
  uploadState: UploadState;
  uploadError?: string;
  /** `sampleImageUrl` devolvido pela API depois do envio. */
  uploadedUrl: string | null;
}

export interface VariationDraft {
  /** Chave local; o `id` real só existe depois do `POST /produtos`. */
  key: string;
  id: string | null;
  name: string;
  variationType: VariationType;
  colorsHex: string[];
  finishDetails: KeyValueRow[];
  inStock: boolean;
  sample: SampleDraft | null;
  /**
   * Amostra já gravada na API (`sampleImageUrl`), só na edição. Um novo
   * arquivo em `sample` substitui esta amostra depois do `PUT`.
   */
  existingSampleUrl: string | null;
}

export interface PhotoDraft {
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

export interface ProductDraft {
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
  variations: VariationDraft[];
  photos: PhotoDraft[];
  specifications: KeyValueRow[];
  active: boolean;
}

export interface DraftValidationContext {
  /** Subtipos ativos da categoria escolhida. */
  subtypeIds: string[];
}
