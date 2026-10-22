// Constantes, rótulos, classes e ids de campo do formulário de produto.

import type {
  AvailabilityType,
  UploadState,
  VariationType,
} from "@/types";

// ---------------------------------------------------------------------------
// Constantes e rótulos
// ---------------------------------------------------------------------------

export const TEXT_MAX_LENGTH = 255;
export const NAME_MIN_LENGTH = 2;
export const INSTALLMENTS_MIN = 1;
export const INSTALLMENTS_MAX = 48;
export const DEFAULT_VARIATION_COLOR = "#FFFFFF";

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const VARIATION_TYPE_OPTIONS: ReadonlyArray<{
  value: VariationType;
  label: string;
}> = [
  { value: "COLOR", label: "Cor" },
  { value: "FABRIC", label: "Tecido" },
  { value: "WOOD", label: "Madeira" },
  { value: "FINISH", label: "Acabamento" },
];

export const AVAILABILITY_OPTIONS: ReadonlyArray<{
  value: AvailabilityType;
  label: string;
  hint: string;
}> = [
  {
    value: "IN_STOCK",
    label: "Pronta entrega",
    hint: "Disponível na loja, sem prazo de fabricação.",
  },
  {
    value: "ON_DEMAND",
    label: "Sob encomenda",
    hint: "Fabricado após o pedido, com prazo em dias.",
  },
];

export const UPLOAD_STATE_META: Record<
  UploadState,
  { label: string; icon: string; classes: string; spin?: boolean }
> = {
  pending: {
    label: "Aguardando",
    icon: "mdi:clock-outline",
    classes: "bg-stone-100 text-stone-600 border-stone-200",
  },
  uploading: {
    label: "Enviando",
    icon: "mdi:loading",
    classes: "bg-sky-50 text-secondary border-sky-200",
    spin: true,
  },
  done: {
    label: "Enviada",
    icon: "mdi:check-circle",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  error: {
    label: "Erro no envio",
    icon: "mdi:alert-circle",
    classes: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

// Classes dos campos, iguais às dos formulários existentes (FornecedorForm).
export const LABEL_CLASS = "block text-xs font-semibold text-neutral-dark mb-1.5";
export const HINT_CLASS = "mt-1 block text-xs text-stone-500";
export const ERROR_TEXT_CLASS = "mt-1 text-xs text-rose-600";

export function fieldClass(hasError: boolean): string {
  return [
    "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors",
    "disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed",
    hasError
      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
      : "border-stone-300 focus:border-secondary focus:ring-secondary/20",
  ].join(" ");
}

export const FORM_SECTIONS = [
  {
    id: "secao-dados-basicos",
    title: "Dados básicos",
    hint: "Nome, categoria e fornecedor",
  },
  {
    id: "secao-preco",
    title: "Preço e disponibilidade",
    hint: "Valor, parcelas e prazo",
  },
  {
    id: "secao-dimensoes",
    title: "Dimensões",
    hint: "Altura, largura e profundidade",
  },
  {
    id: "secao-variacoes",
    title: "Variações de acabamento",
    hint: "Cores, madeiras e amostras",
  },
  { id: "secao-fotos", title: "Fotos", hint: "Imagens do carrossel" },
  {
    id: "secao-especificacoes",
    title: "Especificações técnicas",
    hint: "Ficha técnica e status",
  },
] as const;

// ---------------------------------------------------------------------------
// Ids dos campos no DOM: as chaves de `FieldErrors` são esses ids, o que
// permite marcar o campo e rolar até o primeiro erro.
// ---------------------------------------------------------------------------

export const FIELD_IDS = {
  name: "product-name",
  slug: "product-slug",
  category: "product-category",
  subtype: "product-subtype",
  supplier: "product-supplier",
  collectionLine: "product-collection-line",
  mainMaterial: "product-main-material",
  description: "product-description",
  referencePrice: "product-reference-price",
  maxInstallments: "product-max-installments",
  estimatedDays: "product-estimated-days",
  heightMm: "product-height-mm",
  widthMm: "product-width-mm",
  depthMm: "product-depth-mm",
  specifications: "product-specs",
  active: "product-active",
} as const;

export const variationFieldId = {
  name: (key: string) => `variation-${key}-name`,
  type: (key: string) => `variation-${key}-type`,
  color: (key: string, index: number) => `variation-${key}-color-${index}`,
  details: (key: string) => `variation-${key}-details`,
  inStock: (key: string) => `variation-${key}-in-stock`,
  sample: (key: string) => `variation-${key}-sample`,
};

export function keyValueFieldId(
  prefix: string,
  rowId: string,
  part: "key" | "value",
): string {
  return `${prefix}-${rowId}-${part}`;
}

/**
 * Índice (em `FORM_SECTIONS`) da etapa que contém o campo de id `fieldId`.
 * Serve para validar só a etapa atual e para abrir a etapa do primeiro erro.
 */
export function fieldStep(fieldId: string): number {
  if (
    fieldId === FIELD_IDS.referencePrice ||
    fieldId === FIELD_IDS.maxInstallments ||
    fieldId === FIELD_IDS.estimatedDays
  ) {
    return 1;
  }
  if (
    fieldId === FIELD_IDS.heightMm ||
    fieldId === FIELD_IDS.widthMm ||
    fieldId === FIELD_IDS.depthMm
  ) {
    return 2;
  }
  if (fieldId.startsWith("variation-")) return 3;
  if (fieldId.startsWith(FIELD_IDS.specifications) || fieldId === FIELD_IDS.active) {
    return 5;
  }
  return 0;
}
