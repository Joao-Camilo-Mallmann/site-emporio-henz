import { parsePagination } from "@/lib/pagination";
import { isValidUuid } from "@/lib/slug";
import { AddListItemDto, ListNameDto, ListQueryFilters } from "./lists.types";

export { isValidUuid };

const MAX_LIST_NAME = 100;
const MAX_FINISH_LABEL = 100;
const MAX_FINISH_COLOR = 50;

function readRequiredString(
  raw: unknown,
  field: string,
  max: number,
): { error?: string; value?: string } {
  if (
    typeof raw !== "string" ||
    raw.trim().length < 1 ||
    raw.trim().length > max
  ) {
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

export function validateShare(body: unknown): {
  error?: string;
  value?: { isPublic: boolean };
} {
  const isPublic = (body as Record<string, unknown> | null)?.isPublic;
  if (typeof isPublic !== "boolean") {
    return { error: "O campo isPublic deve ser true ou false." };
  }
  return { value: { isPublic } };
}

export function validateAddItem(body: unknown): {
  error?: string;
  value?: AddListItemDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.productId !== "string" || !isValidUuid(raw.productId.trim())) {
    return { error: "O campo productId deve ser um UUID válido." };
  }

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
    if (
      typeof raw.variationId !== "string" ||
      !isValidUuid(raw.variationId.trim())
    ) {
      return { error: "O campo variationId deve ser um UUID válido." };
    }
    variationId = raw.variationId.trim();
  }

  return {
    value: {
      productId: raw.productId.trim(),
      variationId,
      finishLabel: finishLabel.value,
      finishColor: finishColor.value,
    },
  };
}

export function validateListQuery(url: URL): ListQueryFilters {
  return parsePagination(url);
}
