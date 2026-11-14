import { parsePagination, parseSearchSlug } from "@/lib/pagination";
import {
  isValidUuid,
  NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  slugify,
} from "@/lib/slug";
import {
  AvailabilityType,
  CreateProductDto,
  ProductQueryFilters,
  ProductValidationResult,
  ProductVariationInputDto,
  UpdateProductDto,
  VariationType,
} from "@/modules/products/products.types";

export { isValidUuid, slugify };

const VALID_AVAILABILITY_TYPES: AvailabilityType[] = ["IN_STOCK", "ON_DEMAND"];
const VALID_VARIATION_TYPES: VariationType[] = [
  "COLOR",
  "FABRIC",
  "WOOD",
  "FINISH",
];
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const DIMENSION_LABELS = [
  { key: "heightMm", label: "A altura (heightMm)" },
  { key: "widthMm", label: "A largura (widthMm)" },
  { key: "depthMm", label: "A profundidade (depthMm)" },
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function addError(
  errors: Record<string, string>,
  field: string,
  message: string,
): void {
  if (!(field in errors)) errors[field] = message;
}

function failureResult<T>(
  errors: Record<string, string>,
): ProductValidationResult<T> {
  const first = Object.entries(errors)[0];
  if (!first) return { error: "Dados do produto inválidos." };
  return { error: first[1], field: first[0], errors };
}

function validateOptionalShortText(
  value: unknown,
  field: "collectionLine" | "mainMaterial",
  errors: Record<string, string>,
): void {
  if (
    value !== undefined &&
    value !== null &&
    (typeof value !== "string" || value.trim().length > NAME_MAX_LENGTH)
  ) {
    addError(
      errors,
      field,
      `O campo ${field} deve ser um texto de até ${NAME_MAX_LENGTH} caracteres.`,
    );
  }
}

function validateNormalizedSlug(
  rawSlug: unknown,
  emptyMessage: string,
  errors: Record<string, string>,
): string | undefined {
  if (typeof rawSlug !== "string" || rawSlug.trim().length === 0) {
    addError(errors, "slug", emptyMessage);
    return undefined;
  }
  const finalSlug = slugify(rawSlug);
  if (!finalSlug) {
    addError(errors, "slug", "O slug informado resultou em uma sequência vazia.");
    return undefined;
  }
  if (finalSlug.length > SLUG_MAX_LENGTH) {
    addError(
      errors,
      "slug",
      `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`,
    );
    return undefined;
  }
  return finalSlug;
}

function validateVariationItem(
  item: unknown,
  index: number,
  allowId: boolean,
  errors: Record<string, string>,
): ProductVariationInputDto | null {
  if (!isPlainObject(item)) {
    addError(
      errors,
      `variations.${index}.name`,
      `A variação na posição ${index} deve ser um objeto válido.`,
    );
    return null;
  }

  const {
    id,
    name,
    variationType,
    colorsHex,
    finishDetails,
    sortOrder,
    inStock,
  } = item;

  if (id !== undefined) {
    if (!allowId) {
      addError(
        errors,
        `variations.${index}.id`,
        `O id da variação na posição ${index} não é permitido na criação; ele é gerado pelo servidor.`,
      );
    } else if (typeof id !== "string" || !isValidUuid(id)) {
      addError(
        errors,
        `variations.${index}.id`,
        `O id da variação na posição ${index} é inválido.`,
      );
    }
  }

  if (
    typeof name !== "string" ||
    name.trim().length < 1 ||
    name.trim().length > NAME_MAX_LENGTH
  ) {
    addError(
      errors,
      `variations.${index}.name`,
      `O nome da variação na posição ${index} é obrigatório e deve ter entre 1 e ${NAME_MAX_LENGTH} caracteres.`,
    );
  }

  let finalVariationType: VariationType = "FINISH";
  if (variationType !== undefined) {
    if (
      typeof variationType !== "string" ||
      !VALID_VARIATION_TYPES.includes(variationType as VariationType)
    ) {
      addError(
        errors,
        `variations.${index}.variationType`,
        `O tipo da variação na posição ${index} deve ser COLOR, FABRIC, WOOD ou FINISH.`,
      );
    } else {
      finalVariationType = variationType as VariationType;
    }
  }

  let finalColorsHex: string[] = [];
  if (colorsHex !== undefined) {
    if (!Array.isArray(colorsHex)) {
      addError(
        errors,
        `variations.${index}.colorsHex`,
        `O campo colorsHex da variação na posição ${index} deve ser um array de cores hexadecimais.`,
      );
    } else {
      colorsHex.forEach((color, colorIndex) => {
        if (typeof color !== "string" || !HEX_COLOR_REGEX.test(color)) {
          addError(
            errors,
            `variations.${index}.colorsHex.${colorIndex}`,
            `A cor ${colorIndex + 1} da variação na posição ${index} deve ser um código hexadecimal válido (ex: #FFFFFF).`,
          );
        }
      });
      finalColorsHex = colorsHex.filter(
        (color): color is string => typeof color === "string",
      );
    }
  }

  if (finishDetails !== undefined && !isPlainObject(finishDetails)) {
    addError(
      errors,
      `variations.${index}.finishDetails`,
      `O campo finishDetails da variação na posição ${index} deve ser um objeto JSON.`,
    );
  }

  if (
    sortOrder !== undefined &&
    (typeof sortOrder !== "number" ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0)
  ) {
    addError(
      errors,
      `variations.${index}.sortOrder`,
      `O campo sortOrder da variação na posição ${index} deve ser um inteiro maior ou igual a 0.`,
    );
  }

  if (inStock !== undefined && typeof inStock !== "boolean") {
    addError(
      errors,
      `variations.${index}.inStock`,
      `O campo inStock da variação na posição ${index} deve ser booleano.`,
    );
  }

  return {
    id: typeof id === "string" ? id : undefined,
    name: typeof name === "string" ? name.trim() : "",
    variationType: finalVariationType,
    colorsHex: finalColorsHex,
    finishDetails: isPlainObject(finishDetails) ? finishDetails : {},
    sortOrder: typeof sortOrder === "number" ? sortOrder : index,
    inStock: typeof inStock === "boolean" ? inStock : true,
  };
}

function validateVariations(
  rawVariations: unknown,
  allowId: boolean,
  errors: Record<string, string>,
): ProductVariationInputDto[] | undefined {
  if (!Array.isArray(rawVariations)) {
    addError(errors, "variations", "O campo variations deve ser um array.");
    return undefined;
  }

  const variations: ProductVariationInputDto[] = [];
  for (let i = 0; i < rawVariations.length; i++) {
    const parsed = validateVariationItem(rawVariations[i], i, allowId, errors);
    if (parsed) variations.push(parsed);
  }
  return variations;
}

function validateCommonOptionalFields(
  body: Record<string, unknown>,
  errors: Record<string, string>,
  allowIdInVariations: boolean,
): {
  maxInstallmentsValid: boolean;
  specifications?: Record<string, unknown>;
  variations?: ProductVariationInputDto[];
} {
  const {
    subtypeId,
    collectionLine,
    mainMaterial,
    maxInstallments,
    description,
    specifications,
    active,
    variations,
  } = body;

  if (
    subtypeId !== undefined &&
    subtypeId !== null &&
    (typeof subtypeId !== "string" || !isValidUuid(subtypeId))
  ) {
    addError(
      errors,
      "subtypeId",
      "O campo subtypeId deve ser um UUID válido ou nulo.",
    );
  }

  validateOptionalShortText(collectionLine, "collectionLine", errors);
  validateOptionalShortText(mainMaterial, "mainMaterial", errors);

  let maxInstallmentsValid = true;
  if (
    maxInstallments !== undefined &&
    (!isPositiveInt(maxInstallments) || maxInstallments > 48)
  ) {
    maxInstallmentsValid = false;
    addError(
      errors,
      "maxInstallments",
      "O número máximo de parcelas (maxInstallments) deve ser um inteiro entre 1 e 48.",
    );
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    addError(errors, "description", "A descrição deve ser um texto ou nulo.");
  }

  if (specifications !== undefined && !isPlainObject(specifications)) {
    addError(
      errors,
      "specifications",
      "As especificações técnicas (specifications) devem ser um objeto JSON.",
    );
  }

  if (active !== undefined && typeof active !== "boolean") {
    addError(errors, "active", "O status ativo deve ser um valor booleano.");
  }

  const validatedVariations =
    variations !== undefined
      ? validateVariations(variations, allowIdInVariations, errors)
      : undefined;

  return {
    maxInstallmentsValid,
    specifications: isPlainObject(specifications) ? specifications : undefined,
    variations: validatedVariations,
  };
}

export function validateCreateProduct(
  body: unknown,
): ProductValidationResult<CreateProductDto> {
  if (!isPlainObject(body)) {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const errors: Record<string, string> = {};
  const {
    categoryId,
    subtypeId,
    supplierId,
    name,
    slug,
    collectionLine,
    mainMaterial,
    referencePrice,
    maxInstallments,
    availabilityType,
    estimatedDays,
    heightMm,
    widthMm,
    depthMm,
    description,
    active,
  } = body;

  const validName = typeof name === "string" && name.trim().length >= 2;
  if (!validName) {
    addError(
      errors,
      "name",
      "O nome do produto é obrigatório e deve ter no mínimo 2 caracteres.",
    );
  } else if (name.trim().length > NAME_MAX_LENGTH) {
    addError(
      errors,
      "name",
      `O nome do produto deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
    );
  }

  let finalSlug = "";
  if (slug !== undefined && slug !== null) {
    finalSlug =
      validateNormalizedSlug(slug, "O slug informado é inválido.", errors) ??
      "";
  } else if (validName) {
    finalSlug = slugify(name);
    if (!finalSlug) {
      addError(
        errors,
        "slug",
        "O nome informado não gera um slug válido; informe o slug manualmente.",
      );
    } else if (finalSlug.length > SLUG_MAX_LENGTH) {
      addError(
        errors,
        "slug",
        `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`,
      );
    }
  }

  if (typeof categoryId !== "string" || !isValidUuid(categoryId)) {
    addError(
      errors,
      "categoryId",
      "O campo categoryId é obrigatório e deve ser um UUID válido.",
    );
  }

  if (typeof supplierId !== "string" || !isValidUuid(supplierId)) {
    addError(
      errors,
      "supplierId",
      "O campo supplierId é obrigatório e deve ser um UUID válido.",
    );
  }

  if (
    typeof referencePrice !== "number" ||
    !Number.isFinite(referencePrice) ||
    referencePrice < 0
  ) {
    addError(
      errors,
      "referencePrice",
      "O preço de referência (referencePrice) é obrigatório e deve ser um número maior ou igual a 0.",
    );
  }

  if (
    typeof availabilityType !== "string" ||
    !VALID_AVAILABILITY_TYPES.includes(availabilityType as AvailabilityType)
  ) {
    addError(
      errors,
      "availabilityType",
      "O campo availabilityType deve ser IN_STOCK ou ON_DEMAND.",
    );
  }

  let finalEstimatedDays = 0;
  if (availabilityType === "ON_DEMAND") {
    if (!isPositiveInt(estimatedDays)) {
      addError(
        errors,
        "estimatedDays",
        "Para produtos sob encomenda (ON_DEMAND), o prazo estimado (estimatedDays) é obrigatório e deve ser um inteiro maior ou igual a 1.",
      );
    } else {
      finalEstimatedDays = estimatedDays;
    }
  }

  for (const dim of DIMENSION_LABELS) {
    if (!isPositiveInt(body[dim.key])) {
      addError(
        errors,
        dim.key,
        `${dim.label} é obrigatória e deve ser um inteiro maior que 0.`,
      );
    }
  }

  const common = validateCommonOptionalFields(body, errors, false);

  if (Object.keys(errors).length > 0) {
    return failureResult(errors);
  }

  return {
    value: {
      categoryId: categoryId as string,
      subtypeId: typeof subtypeId === "string" ? subtypeId : null,
      supplierId: supplierId as string,
      name: (name as string).trim(),
      slug: finalSlug,
      collectionLine:
        typeof collectionLine === "string" ? collectionLine.trim() : null,
      mainMaterial:
        typeof mainMaterial === "string" ? mainMaterial.trim() : null,
      referencePrice: referencePrice as number,
      maxInstallments:
        typeof maxInstallments === "number" ? maxInstallments : 1,
      availabilityType: availabilityType as AvailabilityType,
      estimatedDays: finalEstimatedDays,
      heightMm: heightMm as number,
      widthMm: widthMm as number,
      depthMm: depthMm as number,
      description: typeof description === "string" ? description : null,
      specifications: common.specifications ?? {},
      active: typeof active === "boolean" ? active : true,
      variations: common.variations,
    },
  };
}

export function validateUpdateProduct(
  body: unknown,
): ProductValidationResult<UpdateProductDto> {
  if (!isPlainObject(body)) {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const {
    categoryId,
    subtypeId,
    supplierId,
    name,
    slug,
    collectionLine,
    mainMaterial,
    referencePrice,
    maxInstallments,
    availabilityType,
    estimatedDays,
    heightMm,
    widthMm,
    depthMm,
    description,
    specifications,
    active,
    variations,
  } = body;

  const hasAnyField =
    categoryId !== undefined ||
    subtypeId !== undefined ||
    supplierId !== undefined ||
    name !== undefined ||
    slug !== undefined ||
    collectionLine !== undefined ||
    mainMaterial !== undefined ||
    referencePrice !== undefined ||
    maxInstallments !== undefined ||
    availabilityType !== undefined ||
    estimatedDays !== undefined ||
    heightMm !== undefined ||
    widthMm !== undefined ||
    depthMm !== undefined ||
    description !== undefined ||
    specifications !== undefined ||
    active !== undefined ||
    variations !== undefined;

  if (!hasAnyField) {
    return { error: "Ao menos um campo deve ser fornecido para atualização." };
  }

  const errors: Record<string, string> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      addError(
        errors,
        "name",
        "O nome do produto deve ter no mínimo 2 caracteres.",
      );
    } else if (name.trim().length > NAME_MAX_LENGTH) {
      addError(
        errors,
        "name",
        `O nome do produto deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
      );
    }
  }

  let finalSlug: string | undefined;
  if (slug !== undefined) {
    finalSlug = validateNormalizedSlug(
      slug,
      "O slug deve ser um texto válido.",
      errors,
    );
  }

  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" || !isValidUuid(categoryId))
  ) {
    addError(errors, "categoryId", "O campo categoryId deve ser um UUID válido.");
  }

  if (
    supplierId !== undefined &&
    (typeof supplierId !== "string" || !isValidUuid(supplierId))
  ) {
    addError(errors, "supplierId", "O campo supplierId deve ser um UUID válido.");
  }

  if (
    referencePrice !== undefined &&
    (typeof referencePrice !== "number" ||
      !Number.isFinite(referencePrice) ||
      referencePrice < 0)
  ) {
    addError(
      errors,
      "referencePrice",
      "O preço de referência (referencePrice) deve ser um número maior ou igual a 0.",
    );
  }

  let typedAvailability: AvailabilityType | undefined;
  if (availabilityType !== undefined) {
    if (
      typeof availabilityType !== "string" ||
      !VALID_AVAILABILITY_TYPES.includes(availabilityType as AvailabilityType)
    ) {
      addError(
        errors,
        "availabilityType",
        "O campo availabilityType deve ser IN_STOCK ou ON_DEMAND.",
      );
    } else {
      typedAvailability = availabilityType as AvailabilityType;
    }
  }

  let finalEstimatedDays: number | undefined;
  if (typedAvailability === "IN_STOCK") {
    finalEstimatedDays = 0;
  } else if (typedAvailability === "ON_DEMAND") {
    if (estimatedDays !== undefined) {
      if (!isPositiveInt(estimatedDays)) {
        addError(
          errors,
          "estimatedDays",
          "Para produtos sob encomenda (ON_DEMAND), o prazo estimado (estimatedDays) é obrigatório e deve ser um inteiro maior ou igual a 1.",
        );
      } else {
        finalEstimatedDays = estimatedDays;
      }
    }
  } else if (estimatedDays !== undefined) {
    if (
      typeof estimatedDays !== "number" ||
      !Number.isInteger(estimatedDays) ||
      estimatedDays < 0
    ) {
      addError(
        errors,
        "estimatedDays",
        "O prazo estimado (estimatedDays) deve ser um inteiro maior ou igual a 0.",
      );
    } else {
      finalEstimatedDays = estimatedDays;
    }
  }

  for (const dim of DIMENSION_LABELS) {
    if (body[dim.key] !== undefined && !isPositiveInt(body[dim.key])) {
      addError(
        errors,
        dim.key,
        `${dim.label} deve ser um inteiro maior que 0.`,
      );
    }
  }

  const common = validateCommonOptionalFields(body, errors, true);

  if (Object.keys(errors).length > 0) {
    return failureResult(errors);
  }

  return {
    value: {
      categoryId: categoryId as string | undefined,
      subtypeId:
        subtypeId === undefined
          ? undefined
          : typeof subtypeId === "string"
            ? subtypeId
            : null,
      supplierId: supplierId as string | undefined,
      name: typeof name === "string" ? name.trim() : undefined,
      slug: finalSlug,
      collectionLine:
        collectionLine === undefined
          ? undefined
          : typeof collectionLine === "string"
            ? collectionLine.trim()
            : null,
      mainMaterial:
        mainMaterial === undefined
          ? undefined
          : typeof mainMaterial === "string"
            ? mainMaterial.trim()
            : null,
      referencePrice: referencePrice as number | undefined,
      maxInstallments: maxInstallments as number | undefined,
      availabilityType: typedAvailability,
      estimatedDays: finalEstimatedDays,
      heightMm: heightMm as number | undefined,
      widthMm: widthMm as number | undefined,
      depthMm: depthMm as number | undefined,
      description:
        description === undefined
          ? undefined
          : typeof description === "string"
            ? description
            : null,
      specifications: common.specifications,
      active: active as boolean | undefined,
      variations: common.variations,
    },
  };
}

// Limite de preço do filtro: número finito >= 0. Ausente ou inválido é ignorado,
// como os demais filtros da listagem.
function parsePriceParam(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function validateProductQuery(url: URL): ProductQueryFilters {
  const { page, limit } = parsePagination(url);
  const categoryIdParam = url.searchParams.get("categoryId");
  const subtypeIdParam = url.searchParams.get("subtypeId");
  const supplierIdParam = url.searchParams.get("supplierId");
  const availabilityParam = url.searchParams.get("availabilityType");
  const activeParam = url.searchParams.get("active");
  const statusParam = url.searchParams.get("status");

  let active: boolean | undefined = undefined;
  if (activeParam === "true" || statusParam === "active") active = true;
  if (activeParam === "false" || statusParam === "inactive") active = false;

  const availabilityType: AvailabilityType | undefined =
    availabilityParam === "IN_STOCK" || availabilityParam === "ON_DEMAND"
      ? availabilityParam
      : undefined;

  return {
    page,
    limit,
    // Termo já na forma de slug (RF05); a validação fica em parseSearchSlug.
    search: parseSearchSlug(url),
    categoryId:
      categoryIdParam && isValidUuid(categoryIdParam)
        ? categoryIdParam
        : undefined,
    subtypeId:
      subtypeIdParam && isValidUuid(subtypeIdParam)
        ? subtypeIdParam
        : undefined,
    supplierId:
      supplierIdParam && isValidUuid(supplierIdParam)
        ? supplierIdParam
        : undefined,
    availabilityType,
    minPrice: parsePriceParam(url.searchParams.get("minPrice")),
    maxPrice: parsePriceParam(url.searchParams.get("maxPrice")),
    active,
  };
}
