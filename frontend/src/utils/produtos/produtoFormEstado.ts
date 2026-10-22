// Estado do formulário de produto: criação, conversão de e para a API e
// funções de apoio. Os tipos ficam em `src/types/productForm.ts`.

import type {
  KeyValueRow,
  NumericInput,
  PhotoFormItem,
  ProductCreatePayload,
  ProductFormState,
  ProductDto,
  ProductUpdatePayload,
  UploadState,
  VariationFormItem,
} from "@/types";
import {
  DEFAULT_VARIATION_COLOR,
  HEX_COLOR_PATTERN,
  INSTALLMENTS_MIN,
} from "./produtoFormConstantes";

/** Linha do editor de chave e valor com algum campo preenchido. */
export function isFilledRow(row: KeyValueRow): boolean {
  return row.key.trim() !== "" || row.value.trim() !== "";
}

// ---------------------------------------------------------------------------
// Criação
// ---------------------------------------------------------------------------

/**
 * Chave local única. `crypto.randomUUID` só existe em contexto seguro
 * (HTTPS ou localhost); fora dele, cai num identificador aleatório simples.
 */
export function createLocalKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createKeyValueRow(key = "", value = ""): KeyValueRow {
  return { id: createLocalKey(), key, value };
}

export function createVariationItem(): VariationFormItem {
  return {
    key: createLocalKey(),
    id: null,
    name: "",
    variationType: "COLOR",
    colorsHex: [DEFAULT_VARIATION_COLOR],
    finishDetails: [],
    inStock: true,
    sample: null,
    existingSampleUrl: null,
  };
}

export function createPhotoItem(file: File, previewUrl: string): PhotoFormItem {
  return {
    key: createLocalKey(),
    file,
    previewUrl,
    variationKey: null,
    uploadState: "pending",
    uploaded: null,
  };
}

export function createEmptyForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    slugEdited: false,
    categoryId: "",
    subtypeId: "",
    supplierId: "",
    collectionLine: "",
    mainMaterial: "",
    description: "",
    referencePrice: "",
    maxInstallments: 1,
    availabilityType: "IN_STOCK",
    estimatedDays: "",
    heightMm: "",
    widthMm: "",
    depthMm: "",
    variations: [],
    photos: [],
    specifications: [createKeyValueRow()],
    active: true,
  };
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

/** Completa o `#` e põe em maiúsculas quando o valor já é uma cor válida. */
export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return isHexColor(withHash) ? withHash.toUpperCase() : trimmed;
}

/** Converte o valor de um input numérico; `null` se vazio ou inválido. */
export function toNumber(value: NumericInput | string | null | undefined): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** "2300" mm → "230 cm"; `null` se o valor não é um número positivo. */
export function formatMmAsCm(value: NumericInput): string | null {
  const mm = toNumber(value);
  if (mm === null || mm <= 0) return null;
  const cm = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
    mm / 10,
  );
  return `${cm} cm`;
}

export function variationLabel(variation: VariationFormItem, index: number): string {
  return variation.name.trim() || `Variação ${index + 1}`;
}

/** A capa é a primeira foto sem variação; sem ela, a primeira da lista. */
export function coverPhotoKey(photos: PhotoFormItem[]): string | null {
  const general = photos.find((photo) => !photo.variationKey);
  return (general ?? photos[0])?.key ?? null;
}

/** Estados de envio de todas as amostras e fotos, na ordem de envio. */
export function listUploadStates(form: ProductFormState): UploadState[] {
  const samples = form.variations.flatMap((variation) =>
    variation.sample ? [variation.sample.uploadState] : [],
  );
  return [...samples, ...form.photos.map((photo) => photo.uploadState)];
}

/** Revoga os object URLs dos previews locais (amostras e fotos). */
export function revokeFormObjectUrls(form: ProductFormState): void {
  for (const variation of form.variations) {
    if (variation.sample) URL.revokeObjectURL(variation.sample.previewUrl);
  }
  for (const photo of form.photos) {
    URL.revokeObjectURL(photo.previewUrl);
  }
}


// ---------------------------------------------------------------------------
// Payload e associação pós-201
// ---------------------------------------------------------------------------

/** Linhas preenchidas viram objeto; valores seguem como texto (design D10). */
export function rowsToRecord(
  rows: KeyValueRow[],
): Record<string, string> | undefined {
  const entries = rows
    .filter(isFilledRow)
    .map((row) => [row.key.trim(), row.value.trim()] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Monta o corpo de `POST /produtos`. Chame só com o formulário validado. */
export function toCreatePayload(form: ProductFormState): ProductCreatePayload {
  const onDemand = form.availabilityType === "ON_DEMAND";

  return {
    categoryId: form.categoryId,
    subtypeId: form.subtypeId || undefined,
    supplierId: form.supplierId,
    name: form.name.trim(),
    slug: form.slug.trim(),
    collectionLine: optionalText(form.collectionLine),
    mainMaterial: optionalText(form.mainMaterial),
    referencePrice: toNumber(form.referencePrice) ?? 0,
    maxInstallments: toNumber(form.maxInstallments) ?? INSTALLMENTS_MIN,
    availabilityType: form.availabilityType,
    estimatedDays: onDemand
      ? (toNumber(form.estimatedDays) ?? undefined)
      : undefined,
    heightMm: toNumber(form.heightMm) ?? 0,
    widthMm: toNumber(form.widthMm) ?? 0,
    depthMm: toNumber(form.depthMm) ?? 0,
    description: optionalText(form.description),
    specifications: rowsToRecord(form.specifications),
    active: form.active,
    variations: form.variations.map((variation, index) => ({
      id: variation.id ?? undefined,
      name: variation.name.trim(),
      variationType: variation.variationType,
      colorsHex: variation.colorsHex.map((color) => normalizeHexColor(color)),
      finishDetails: rowsToRecord(variation.finishDetails),
      sortOrder: index,
      inStock: variation.inStock,
    })),
  };
}

/**
 * Associa cada variação local ao `id` devolvido pela API pelo `sortOrder`
 * (design D4): a variação na posição `i` foi enviada com `sortOrder = i`.
 * Devolve `chave local → id`.
 */
export function resolveVariationIds(
  variations: VariationFormItem[],
  product: ProductDto,
): Map<string, string> {
  const ids = new Map<string, string>();
  variations.forEach((variation, index) => {
    const created = product.variations.find((item) => item.sortOrder === index);
    if (created) ids.set(variation.key, created.id);
  });
  return ids;
}

// ---------------------------------------------------------------------------
// Edição: produto da API → estado do formulário
// ---------------------------------------------------------------------------

/** Objeto JSONB (`specifications`, `finishDetails`) → linhas do editor. */
export function recordToRows(
  record: Record<string, unknown> | null | undefined,
): KeyValueRow[] {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) =>
    createKeyValueRow(key, value === null || value === undefined ? "" : String(value)),
  );
}

/** Número vindo da API para o `v-model` de um input numérico. */
function toNumericInput(value: number | null | undefined): NumericInput {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

/**
 * Monta o estado do formulário a partir do produto devolvido por `GET /produtos/:id`.
 * As fotos já gravadas não viram `PhotoFormItem`: elas são exibidas à parte e
 * `form.photos` guarda só os arquivos novos da sessão de edição.
 */
export function formFromProduct(product: ProductDto): ProductFormState {
  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    // O slug já existe: ele não acompanha mais mudanças no nome.
    slugEdited: true,
    categoryId: product.categoryId ?? "",
    subtypeId: product.subtypeId ?? "",
    supplierId: product.supplierId ?? "",
    collectionLine: product.collectionLine ?? "",
    mainMaterial: product.mainMaterial ?? "",
    description: product.description ?? "",
    referencePrice: toNumericInput(product.referencePrice),
    maxInstallments: toNumericInput(product.maxInstallments) || INSTALLMENTS_MIN,
    availabilityType: product.availabilityType,
    estimatedDays:
      product.availabilityType === "ON_DEMAND"
        ? toNumericInput(product.estimatedDays)
        : "",
    heightMm: toNumericInput(product.heightMm),
    widthMm: toNumericInput(product.widthMm),
    depthMm: toNumericInput(product.depthMm),
    variations: [...(product.variations ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((variation) => ({
        key: createLocalKey(),
        id: variation.id,
        name: variation.name ?? "",
        variationType: variation.variationType,
        colorsHex:
          variation.colorsHex.length > 0
            ? variation.colorsHex.map((color) => normalizeHexColor(color))
            : [DEFAULT_VARIATION_COLOR],
        finishDetails: recordToRows(variation.finishDetails),
        inStock: variation.inStock,
        sample: null,
        existingSampleUrl: variation.sampleImageUrl,
      })),
    photos: [],
    specifications: recordToRows(product.specifications),
    active: product.active,
  };
}

/**
 * Monta o corpo de `PUT /produtos/:id`. Parte do mesmo corpo do cadastro
 * (variações existentes com `id`, novas sem `id`, omitidas recebem soft
 * delete na API), mas manda os campos opcionais vazios de forma explícita:
 * a API ignora campo `undefined`, então sem isso a edição não conseguiria
 * limpar subtipo, linha, material, descrição, especificações nem os detalhes
 * de acabamento.
 */
export function toUpdatePayload(form: ProductFormState): ProductUpdatePayload {
  const base = toCreatePayload(form);
  return {
    ...base,
    subtypeId: form.subtypeId || null,
    collectionLine: optionalText(form.collectionLine) ?? null,
    mainMaterial: optionalText(form.mainMaterial) ?? null,
    description: optionalText(form.description) ?? null,
    specifications: rowsToRecord(form.specifications) ?? {},
    variations: base.variations.map((variation, index) => ({
      ...variation,
      finishDetails: rowsToRecord(form.variations[index].finishDetails) ?? {},
    })),
  };
}
