import { parsePagination, parseSearch } from "@/lib/pagination";
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function validateVariations(
  rawVariations: unknown,
  allowId: boolean,
): { error?: string; value?: ProductVariationInputDto[] } {
  if (!Array.isArray(rawVariations)) {
    return { error: "O campo variations deve ser um array." };
  }

  const variations: ProductVariationInputDto[] = [];

  for (let i = 0; i < rawVariations.length; i++) {
    const item = rawVariations[i];
    if (!isPlainObject(item)) {
      return {
        error: `A variação na posição ${i} deve ser um objeto válido.`,
      };
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
        return {
          error: `O id da variação na posição ${i} não é permitido na criação; ele é gerado pelo servidor.`,
        };
      }
      if (typeof id !== "string" || !isValidUuid(id)) {
        return {
          error: `O id da variação na posição ${i} é inválido.`,
        };
      }
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 1 ||
      name.trim().length > NAME_MAX_LENGTH
    ) {
      return {
        error: `O nome da variação na posição ${i} é obrigatório e deve ter entre 1 e ${NAME_MAX_LENGTH} caracteres.`,
      };
    }

    let finalVariationType: VariationType = "FINISH";
    if (variationType !== undefined) {
      if (
        typeof variationType !== "string" ||
        !VALID_VARIATION_TYPES.includes(variationType as VariationType)
      ) {
        return {
          error: `O tipo da variação na posição ${i} deve ser COLOR, FABRIC, WOOD ou FINISH.`,
        };
      }
      finalVariationType = variationType as VariationType;
    }

    let finalColorsHex: string[] = [];
    if (colorsHex !== undefined) {
      if (
        !Array.isArray(colorsHex) ||
        !colorsHex.every(
          (c) => typeof c === "string" && HEX_COLOR_REGEX.test(c),
        )
      ) {
        return {
          error: `O campo colorsHex da variação na posição ${i} deve conter cores hexadecimais válidas (ex: #FFFFFF).`,
        };
      }
      finalColorsHex = colorsHex;
    }

    if (finishDetails !== undefined && !isPlainObject(finishDetails)) {
      return {
        error: `O campo finishDetails da variação na posição ${i} deve ser um objeto JSON.`,
      };
    }

    if (
      sortOrder !== undefined &&
      (typeof sortOrder !== "number" ||
        !Number.isInteger(sortOrder) ||
        sortOrder < 0)
    ) {
      return {
        error: `O campo sortOrder da variação na posição ${i} deve ser um inteiro maior ou igual a 0.`,
      };
    }

    if (inStock !== undefined && typeof inStock !== "boolean") {
      return {
        error: `O campo inStock da variação na posição ${i} deve ser booleano.`,
      };
    }

    variations.push({
      id: typeof id === "string" ? id : undefined,
      name: name.trim(),
      variationType: finalVariationType,
      colorsHex: finalColorsHex,
      finishDetails: finishDetails ?? {},
      sortOrder: typeof sortOrder === "number" ? sortOrder : i,
      inStock: inStock ?? true,
    });
  }

  return { value: variations };
}

export function validateCreateProduct(body: unknown): {
  error?: string;
  value?: CreateProductDto;
} {
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

  if (typeof categoryId !== "string" || !isValidUuid(categoryId)) {
    return {
      error: "O campo categoryId é obrigatório e deve ser um UUID válido.",
    };
  }

  if (
    subtypeId !== undefined &&
    subtypeId !== null &&
    (typeof subtypeId !== "string" || !isValidUuid(subtypeId))
  ) {
    return {
      error: "O campo subtypeId deve ser um UUID válido ou nulo.",
    };
  }

  if (typeof supplierId !== "string" || !isValidUuid(supplierId)) {
    return {
      error: "O campo supplierId é obrigatório e deve ser um UUID válido.",
    };
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    return {
      error:
        "O nome do produto é obrigatório e deve ter no mínimo 2 caracteres.",
    };
  }

  if (name.trim().length > NAME_MAX_LENGTH) {
    return {
      error: `O nome do produto deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  let finalSlug: string;
  if (slug !== undefined && slug !== null) {
    if (typeof slug !== "string" || slug.trim().length === 0) {
      return { error: "O slug informado é inválido." };
    }
    finalSlug = slugify(slug);
    if (!finalSlug) {
      return { error: "O slug informado resultou em uma sequência vazia." };
    }
  } else {
    finalSlug = slugify(name);
    if (!finalSlug) {
      return {
        error:
          "O nome informado não gera um slug válido; informe o slug manualmente.",
      };
    }
  }

  if (finalSlug.length > SLUG_MAX_LENGTH) {
    return {
      error: `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`,
    };
  }

  if (
    collectionLine !== undefined &&
    collectionLine !== null &&
    (typeof collectionLine !== "string" ||
      collectionLine.trim().length > NAME_MAX_LENGTH)
  ) {
    return {
      error: `O campo collectionLine deve ser um texto de até ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  if (
    mainMaterial !== undefined &&
    mainMaterial !== null &&
    (typeof mainMaterial !== "string" ||
      mainMaterial.trim().length > NAME_MAX_LENGTH)
  ) {
    return {
      error: `O campo mainMaterial deve ser um texto de até ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  if (
    typeof referencePrice !== "number" ||
    !Number.isFinite(referencePrice) ||
    referencePrice < 0
  ) {
    return {
      error:
        "O preço de referência (referencePrice) é obrigatório e deve ser um número maior ou igual a 0.",
    };
  }

  if (
    maxInstallments !== undefined &&
    (!isPositiveInt(maxInstallments) || maxInstallments > 48)
  ) {
    return {
      error:
        "O número máximo de parcelas (maxInstallments) deve ser um inteiro entre 1 e 48.",
    };
  }

  if (
    typeof availabilityType !== "string" ||
    !VALID_AVAILABILITY_TYPES.includes(availabilityType as AvailabilityType)
  ) {
    return {
      error: "O campo availabilityType deve ser IN_STOCK ou ON_DEMAND.",
    };
  }

  const typedAvailability = availabilityType as AvailabilityType;
  let finalEstimatedDays = 0;

  if (typedAvailability === "ON_DEMAND") {
    if (!isPositiveInt(estimatedDays)) {
      return {
        error:
          "Para produtos sob encomenda (ON_DEMAND), o prazo estimado (estimatedDays) é obrigatório e deve ser um inteiro maior ou igual a 1.",
      };
    }
    finalEstimatedDays = estimatedDays;
  }

  if (
    !isPositiveInt(heightMm) ||
    !isPositiveInt(widthMm) ||
    !isPositiveInt(depthMm)
  ) {
    return {
      error:
        "As dimensões em milímetros (heightMm, widthMm e depthMm) são obrigatórias e devem ser inteiros maiores que 0.",
    };
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return { error: "A descrição deve ser um texto ou nulo." };
  }

  if (specifications !== undefined && !isPlainObject(specifications)) {
    return {
      error:
        "As especificações técnicas (specifications) devem ser um objeto JSON.",
    };
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  let validatedVariations: ProductVariationInputDto[] | undefined;
  if (variations !== undefined) {
    const varResult = validateVariations(variations, false);
    if (varResult.error) {
      return { error: varResult.error };
    }
    validatedVariations = varResult.value;
  }

  return {
    value: {
      categoryId,
      subtypeId: typeof subtypeId === "string" ? subtypeId : null,
      supplierId,
      name: name.trim(),
      slug: finalSlug,
      collectionLine:
        typeof collectionLine === "string" ? collectionLine.trim() : null,
      mainMaterial:
        typeof mainMaterial === "string" ? mainMaterial.trim() : null,
      referencePrice,
      maxInstallments:
        typeof maxInstallments === "number" ? maxInstallments : 1,
      availabilityType: typedAvailability,
      estimatedDays: finalEstimatedDays,
      heightMm,
      widthMm,
      depthMm,
      description: typeof description === "string" ? description : null,
      specifications: specifications ?? {},
      active: active ?? true,
      variations: validatedVariations,
    },
  };
}

export function validateUpdateProduct(body: unknown): {
  error?: string;
  value?: UpdateProductDto;
} {
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

  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" || !isValidUuid(categoryId))
  ) {
    return { error: "O campo categoryId deve ser um UUID válido." };
  }

  if (
    subtypeId !== undefined &&
    subtypeId !== null &&
    (typeof subtypeId !== "string" || !isValidUuid(subtypeId))
  ) {
    return { error: "O campo subtypeId deve ser um UUID válido ou nulo." };
  }

  if (
    supplierId !== undefined &&
    (typeof supplierId !== "string" || !isValidUuid(supplierId))
  ) {
    return { error: "O campo supplierId deve ser um UUID válido." };
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      return {
        error: "O nome do produto deve ter no mínimo 2 caracteres.",
      };
    }
    if (name.trim().length > NAME_MAX_LENGTH) {
      return {
        error: `O nome do produto deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
      };
    }
  }

  let finalSlug: string | undefined;
  if (slug !== undefined) {
    if (typeof slug !== "string" || slug.trim().length === 0) {
      return { error: "O slug deve ser um texto válido." };
    }
    finalSlug = slugify(slug);
    if (!finalSlug) {
      return { error: "O slug informado resultou em uma sequência vazia." };
    }
    if (finalSlug.length > SLUG_MAX_LENGTH) {
      return {
        error: `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`,
      };
    }
  }

  if (
    collectionLine !== undefined &&
    collectionLine !== null &&
    (typeof collectionLine !== "string" ||
      collectionLine.trim().length > NAME_MAX_LENGTH)
  ) {
    return {
      error: `O campo collectionLine deve ser um texto de até ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  if (
    mainMaterial !== undefined &&
    mainMaterial !== null &&
    (typeof mainMaterial !== "string" ||
      mainMaterial.trim().length > NAME_MAX_LENGTH)
  ) {
    return {
      error: `O campo mainMaterial deve ser um texto de até ${NAME_MAX_LENGTH} caracteres.`,
    };
  }

  if (
    referencePrice !== undefined &&
    (typeof referencePrice !== "number" ||
      !Number.isFinite(referencePrice) ||
      referencePrice < 0)
  ) {
    return {
      error:
        "O preço de referência (referencePrice) deve ser um número maior ou igual a 0.",
    };
  }

  if (
    maxInstallments !== undefined &&
    (!isPositiveInt(maxInstallments) || maxInstallments > 48)
  ) {
    return {
      error:
        "O número máximo de parcelas (maxInstallments) deve ser um inteiro entre 1 e 48.",
    };
  }

  let typedAvailability: AvailabilityType | undefined;
  if (availabilityType !== undefined) {
    if (
      typeof availabilityType !== "string" ||
      !VALID_AVAILABILITY_TYPES.includes(availabilityType as AvailabilityType)
    ) {
      return {
        error: "O campo availabilityType deve ser IN_STOCK ou ON_DEMAND.",
      };
    }
    typedAvailability = availabilityType as AvailabilityType;
  }

  let finalEstimatedDays: number | undefined;
  if (typedAvailability === "IN_STOCK") {
    finalEstimatedDays = 0;
  } else if (typedAvailability === "ON_DEMAND") {
    if (estimatedDays !== undefined) {
      if (!isPositiveInt(estimatedDays)) {
        return {
          error:
            "Para produtos sob encomenda (ON_DEMAND), o prazo estimado (estimatedDays) é obrigatório e deve ser um inteiro maior ou igual a 1.",
        };
      }
      finalEstimatedDays = estimatedDays;
    }
  } else if (estimatedDays !== undefined) {
    if (
      typeof estimatedDays !== "number" ||
      !Number.isInteger(estimatedDays) ||
      estimatedDays < 0
    ) {
      return {
        error:
          "O prazo estimado (estimatedDays) deve ser um inteiro maior ou igual a 0.",
      };
    }
    finalEstimatedDays = estimatedDays;
  }

  if (heightMm !== undefined && !isPositiveInt(heightMm)) {
    return { error: "A altura (heightMm) deve ser um inteiro maior que 0." };
  }

  if (widthMm !== undefined && !isPositiveInt(widthMm)) {
    return { error: "A largura (widthMm) deve ser um inteiro maior que 0." };
  }

  if (depthMm !== undefined && !isPositiveInt(depthMm)) {
    return {
      error: "A profundidade (depthMm) deve ser um inteiro maior que 0.",
    };
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return { error: "A descrição deve ser um texto ou nulo." };
  }

  if (specifications !== undefined && !isPlainObject(specifications)) {
    return {
      error:
        "As especificações técnicas (specifications) devem ser um objeto JSON.",
    };
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  let validatedVariations: ProductVariationInputDto[] | undefined;
  if (variations !== undefined) {
    const varResult = validateVariations(variations, true);
    if (varResult.error) {
      return { error: varResult.error };
    }
    validatedVariations = varResult.value;
  }

  return {
    value: {
      categoryId,
      subtypeId:
        subtypeId === undefined
          ? undefined
          : typeof subtypeId === "string"
            ? subtypeId
            : null,
      supplierId,
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
      referencePrice,
      maxInstallments,
      availabilityType: typedAvailability,
      estimatedDays: finalEstimatedDays,
      heightMm,
      widthMm,
      depthMm,
      description:
        description === undefined
          ? undefined
          : typeof description === "string"
            ? description
            : null,
      specifications,
      active,
      variations: validatedVariations,
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
    search: parseSearch(url),
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
