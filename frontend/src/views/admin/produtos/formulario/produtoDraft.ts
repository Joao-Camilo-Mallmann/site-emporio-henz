// Rascunho do formulário de cadastro de produto: criação, validação e payload
// (design D3, D4 e D10 da change `fe-admin-product-form`). Os tipos ficam em
// `src/types/productDraft.ts`.

import type {
  AvailabilityType,
  DraftValidationContext,
  FieldErrors,
  KeyValueRow,
  NumericInput,
  PhotoDraft,
  ProductCreatePayload,
  ProductDraft,
  ProductDto,
  ProductListItemDto,
  ProductUpdatePayload,
  UploadState,
  VariationDraft,
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

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  { id: "secao-dados-basicos", title: "Dados básicos" },
  { id: "secao-preco", title: "Preço e disponibilidade" },
  { id: "secao-dimensoes", title: "Dimensões" },
  { id: "secao-variacoes", title: "Variações de acabamento" },
  { id: "secao-fotos", title: "Fotos" },
  { id: "secao-especificacoes", title: "Especificações técnicas" },
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

export function createVariationDraft(): VariationDraft {
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

export function createPhotoDraft(file: File, previewUrl: string): PhotoDraft {
  return {
    key: createLocalKey(),
    file,
    previewUrl,
    variationKey: null,
    uploadState: "pending",
    uploaded: null,
  };
}

export function createEmptyDraft(): ProductDraft {
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

export function variationLabel(variation: VariationDraft, index: number): string {
  return variation.name.trim() || `Variação ${index + 1}`;
}

/** A capa é a primeira foto sem variação; sem ela, a primeira da lista. */
export function coverPhotoKey(photos: PhotoDraft[]): string | null {
  const general = photos.find((photo) => !photo.variationKey);
  return (general ?? photos[0])?.key ?? null;
}

/** Estados de envio de todas as amostras e fotos, na ordem de envio. */
export function listUploadStates(draft: ProductDraft): UploadState[] {
  const samples = draft.variations.flatMap((variation) =>
    variation.sample ? [variation.sample.uploadState] : [],
  );
  return [...samples, ...draft.photos.map((photo) => photo.uploadState)];
}

/** Revoga os object URLs dos previews locais (amostras e fotos). */
export function revokeDraftObjectUrls(draft: ProductDraft): void {
  for (const variation of draft.variations) {
    if (variation.sample) URL.revokeObjectURL(variation.sample.previewUrl);
  }
  for (const photo of draft.photos) {
    URL.revokeObjectURL(photo.previewUrl);
  }
}

// ---------------------------------------------------------------------------
// Validação (mesmas regras da API)
// ---------------------------------------------------------------------------

function isFilledRow(row: KeyValueRow): boolean {
  return row.key.trim() !== "" || row.value.trim() !== "";
}

function validateKeyValueRows(
  rows: KeyValueRow[],
  prefix: string,
  errors: FieldErrors,
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!isFilledRow(row)) continue;

    const key = row.key.trim();
    const keyId = keyValueFieldId(prefix, row.id, "key");
    if (!key) {
      errors[keyId] = "Informe o nome do item ou apague a linha.";
      continue;
    }
    if (!row.value.trim()) {
      errors[keyValueFieldId(prefix, row.id, "value")] =
        "Informe o valor ou apague a linha.";
      continue;
    }

    const normalized = key.toLowerCase();
    if (seen.has(normalized)) {
      errors[keyId] = `"${key}" está repetido. Use cada nome uma vez só.`;
      continue;
    }
    seen.add(normalized);
  }
}

function validateRequiredInteger(
  value: NumericInput,
  id: string,
  emptyMessage: string,
  errors: FieldErrors,
): void {
  const parsed = toNumber(value);
  if (parsed === null) {
    errors[id] = emptyMessage;
  } else if (!Number.isInteger(parsed) || parsed < 1) {
    errors[id] = "Use um número inteiro maior que zero.";
  }
}

function validateOptionalText(value: string, id: string, errors: FieldErrors) {
  if (value.trim().length > TEXT_MAX_LENGTH) {
    errors[id] = `Use no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }
}

/**
 * Valida o rascunho e devolve `id do campo → mensagem`, na ordem visual da
 * tela. Mapa vazio significa que o rascunho pode ser enviado.
 */
export function validateDraft(
  draft: ProductDraft,
  ctx: DraftValidationContext,
): FieldErrors {
  const errors: FieldErrors = {};

  // 1. Dados básicos
  const name = draft.name.trim();
  if (!name) {
    errors[FIELD_IDS.name] = "Informe o nome do produto.";
  } else if (name.length < NAME_MIN_LENGTH) {
    errors[FIELD_IDS.name] =
      `O nome deve ter pelo menos ${NAME_MIN_LENGTH} caracteres.`;
  } else if (name.length > TEXT_MAX_LENGTH) {
    errors[FIELD_IDS.name] =
      `O nome deve ter no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }

  const slug = draft.slug.trim();
  if (!slug) {
    errors[FIELD_IDS.slug] = "Informe o slug do produto.";
  } else if (!SLUG_PATTERN.test(slug)) {
    errors[FIELD_IDS.slug] =
      "Use só letras minúsculas sem acento, números e hífens (ex.: roupeiro-roma).";
  } else if (slug.length > TEXT_MAX_LENGTH) {
    errors[FIELD_IDS.slug] =
      `O slug deve ter no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }

  if (!draft.categoryId) {
    errors[FIELD_IDS.category] = "Escolha a categoria.";
  }
  if (draft.subtypeId && !ctx.subtypeIds.includes(draft.subtypeId)) {
    errors[FIELD_IDS.subtype] = "Escolha um subtipo desta categoria.";
  }
  if (!draft.supplierId) {
    errors[FIELD_IDS.supplier] = "Escolha o fornecedor.";
  }
  validateOptionalText(draft.collectionLine, FIELD_IDS.collectionLine, errors);
  validateOptionalText(draft.mainMaterial, FIELD_IDS.mainMaterial, errors);

  // 2. Preço e disponibilidade
  const price = toNumber(draft.referencePrice);
  if (price === null) {
    errors[FIELD_IDS.referencePrice] = "Informe o preço de referência.";
  } else if (price < 0) {
    errors[FIELD_IDS.referencePrice] = "O preço não pode ser negativo.";
  }

  const installments = toNumber(draft.maxInstallments);
  if (
    installments === null ||
    !Number.isInteger(installments) ||
    installments < INSTALLMENTS_MIN ||
    installments > INSTALLMENTS_MAX
  ) {
    errors[FIELD_IDS.maxInstallments] =
      `Informe um número inteiro de ${INSTALLMENTS_MIN} a ${INSTALLMENTS_MAX}.`;
  }

  if (draft.availabilityType === "ON_DEMAND") {
    validateRequiredInteger(
      draft.estimatedDays,
      FIELD_IDS.estimatedDays,
      "Informe o prazo de fabricação em dias.",
      errors,
    );
  }

  // 3. Dimensões
  validateRequiredInteger(
    draft.heightMm,
    FIELD_IDS.heightMm,
    "Informe a altura em mm.",
    errors,
  );
  validateRequiredInteger(
    draft.widthMm,
    FIELD_IDS.widthMm,
    "Informe a largura em mm.",
    errors,
  );
  validateRequiredInteger(
    draft.depthMm,
    FIELD_IDS.depthMm,
    "Informe a profundidade em mm.",
    errors,
  );

  // 4. Variações
  for (const variation of draft.variations) {
    const variationName = variation.name.trim();
    if (!variationName) {
      errors[variationFieldId.name(variation.key)] =
        "Informe o nome da variação.";
    } else if (variationName.length > TEXT_MAX_LENGTH) {
      errors[variationFieldId.name(variation.key)] =
        `Use no máximo ${TEXT_MAX_LENGTH} caracteres.`;
    }

    variation.colorsHex.forEach((color, index) => {
      if (!isHexColor(normalizeHexColor(color))) {
        errors[variationFieldId.color(variation.key, index)] =
          "Use o formato #RRGGBB.";
      }
    });

    validateKeyValueRows(
      variation.finishDetails,
      variationFieldId.details(variation.key),
      errors,
    );
  }

  // 6. Especificações técnicas
  validateKeyValueRows(draft.specifications, FIELD_IDS.specifications, errors);

  return errors;
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

/** Monta o corpo de `POST /produtos`. Chame só com o rascunho validado. */
export function toCreatePayload(draft: ProductDraft): ProductCreatePayload {
  const onDemand = draft.availabilityType === "ON_DEMAND";

  return {
    categoryId: draft.categoryId,
    subtypeId: draft.subtypeId || undefined,
    supplierId: draft.supplierId,
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    collectionLine: optionalText(draft.collectionLine),
    mainMaterial: optionalText(draft.mainMaterial),
    referencePrice: toNumber(draft.referencePrice) ?? 0,
    maxInstallments: toNumber(draft.maxInstallments) ?? INSTALLMENTS_MIN,
    availabilityType: draft.availabilityType,
    estimatedDays: onDemand
      ? (toNumber(draft.estimatedDays) ?? undefined)
      : undefined,
    heightMm: toNumber(draft.heightMm) ?? 0,
    widthMm: toNumber(draft.widthMm) ?? 0,
    depthMm: toNumber(draft.depthMm) ?? 0,
    description: optionalText(draft.description),
    specifications: rowsToRecord(draft.specifications),
    active: draft.active,
    variations: draft.variations.map((variation, index) => ({
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
  variations: VariationDraft[],
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
// Edição: produto da API → rascunho do formulário
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
 * Monta o rascunho a partir do produto devolvido por `GET /produtos/:id`.
 * As fotos já gravadas não viram `PhotoDraft`: elas são exibidas à parte e
 * `draft.photos` guarda só os arquivos novos da sessão de edição.
 */
export function draftFromProduct(product: ProductDto): ProductDraft {
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
 * Monta o corpo de `PUT /produtos/:id`. É o mesmo corpo do cadastro: as
 * variações existentes vão com `id` (preservadas), as novas sem `id`
 * (inseridas) e as omitidas recebem soft delete na API.
 */
export function toUpdatePayload(draft: ProductDraft): ProductUpdatePayload {
  return toCreatePayload(draft);
}

// ---------------------------------------------------------------------------
// Rótulos da listagem
// ---------------------------------------------------------------------------

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function availabilityLabel(product: ProductListItemDto): string {
  const option = AVAILABILITY_OPTIONS.find(
    (item) => item.value === product.availabilityType,
  );
  if (product.availabilityType === "ON_DEMAND" && product.estimatedDays > 0) {
    return `${option?.label ?? "Sob encomenda"} (${product.estimatedDays} dias)`;
  }
  return option?.label ?? "—";
}

/** "2300 × 2700 × 600 mm" a partir das dimensões do produto. */
export function formatDimensions(product: ProductListItemDto): string {
  const parts = [product.heightMm, product.widthMm, product.depthMm];
  if (parts.some((part) => typeof part !== "number" || part <= 0)) return "—";
  return `${parts.join(" × ")} mm`;
}
