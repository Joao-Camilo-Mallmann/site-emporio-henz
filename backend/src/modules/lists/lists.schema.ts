import { AddListItemDto, ListNameDto } from "./lists.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_LIST_NAME = 100;
const MAX_PRODUCT_ID = 100;
const MAX_PRODUCT_NAME = 255;
const MAX_SLUG = 255;
const MAX_IMAGE = 2048;
const MAX_FINISH_LABEL = 100;
const MAX_FINISH_COLOR = 50;
const MAX_PRICE = 9_999_999_999; // limite do NUMERIC(12, 2)

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function readRequiredString(
  raw: unknown,
  field: string,
  max: number,
): { error?: string; value?: string } {
  if (typeof raw !== "string" || raw.trim().length < 1 || raw.trim().length > max) {
    return { error: `O campo ${field} deve ter de 1 a ${max} caracteres.` };
  }
  return { value: raw.trim() };
}

function readOptionalString(
  raw: unknown,
  field: string,
  max: number,
): { error?: string; value?: string } {
  if (raw === undefined || raw === null || raw === "") {
    return {};
  }
  if (typeof raw !== "string" || raw.trim().length > max) {
    return { error: `O campo ${field} deve ter no máximo ${max} caracteres.` };
  }
  return { value: raw.trim() || undefined };
}

export function validateListName(body: unknown): {
  error?: string;
  value?: ListNameDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const name = readRequiredString(
    (body as Record<string, unknown>).name,
    "name",
    MAX_LIST_NAME,
  );
  if (name.error || !name.value) {
    return { error: name.error };
  }

  return { value: { name: name.value } };
}

export function validateAddItem(body: unknown): {
  error?: string;
  value?: AddListItemDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const raw = body as Record<string, unknown>;

  const productId = readRequiredString(raw.productId, "productId", MAX_PRODUCT_ID);
  if (productId.error || !productId.value) return { error: productId.error };

  const name = readRequiredString(raw.name, "name", MAX_PRODUCT_NAME);
  if (name.error || !name.value) return { error: name.error };

  // Produto sem foto cadastrada é aceito; a imagem fica vazia
  const image = readOptionalString(raw.image, "image", MAX_IMAGE);
  if (image.error) return { error: image.error };

  const price = raw.price;
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > MAX_PRICE
  ) {
    return { error: "O campo price deve ser um número maior ou igual a zero." };
  }

  const productSlug = readOptionalString(raw.productSlug, "productSlug", MAX_SLUG);
  if (productSlug.error) return { error: productSlug.error };

  const finishLabel = readOptionalString(
    raw.finishLabel,
    "finishLabel",
    MAX_FINISH_LABEL,
  );
  if (finishLabel.error) return { error: finishLabel.error };

  const finishColor = readOptionalString(
    raw.finishColor,
    "finishColor",
    MAX_FINISH_COLOR,
  );
  if (finishColor.error) return { error: finishColor.error };

  let variationId: string | undefined;
  if (raw.variationId !== undefined && raw.variationId !== null) {
    if (typeof raw.variationId !== "string" || !isValidUuid(raw.variationId.trim())) {
      return { error: "O campo variationId deve ser um UUID válido." };
    }
    variationId = raw.variationId.trim();
  }

  return {
    value: {
      productId: productId.value,
      productSlug: productSlug.value,
      variationId,
      name: name.value,
      price,
      image: image.value ?? "",
      finishLabel: finishLabel.value,
      finishColor: finishColor.value,
    },
  };
}
