import { parsePagination, parseSearch } from "@/lib/pagination";
import {
  isValidUuid,
  NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  slugify,
} from "@/lib/slug";
import {
  CreateSubtypeDto,
  SubtypeQueryFilters,
  UpdateSubtypeDto,
} from "./subtypes.types";

export { isValidUuid, slugify };

const NAME_TOO_LONG = `O nome do subtipo deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
const SLUG_TOO_LONG = `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`;

export function validateCreateSubtype(body: unknown): {
  error?: string;
  value?: CreateSubtypeDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { categoryId, name, slug, active } = body as Record<string, unknown>;

  if (typeof categoryId !== "string" || !isValidUuid(categoryId)) {
    return {
      error: "O campo categoryId é obrigatório e deve ser um UUID válido.",
    };
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    return {
      error:
        "O nome do subtipo é obrigatório e deve ter no mínimo 2 caracteres.",
    };
  }

  if (name.trim().length > NAME_MAX_LENGTH) {
    return { error: NAME_TOO_LONG };
  }

  let finalSlug: string | undefined;
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
    return { error: SLUG_TOO_LONG };
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  return {
    value: {
      categoryId,
      name: name.trim(),
      slug: finalSlug,
      active: active !== undefined ? active : true,
    },
  };
}

export function validateUpdateSubtype(body: unknown): {
  error?: string;
  value?: UpdateSubtypeDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { categoryId, name, slug, active } = body as Record<string, unknown>;

  const hasAnyField =
    categoryId !== undefined ||
    name !== undefined ||
    slug !== undefined ||
    active !== undefined;

  if (!hasAnyField) {
    return { error: "Ao menos um campo deve ser fornecido para atualização." };
  }

  if (
    categoryId !== undefined &&
    (typeof categoryId !== "string" || !isValidUuid(categoryId))
  ) {
    return { error: "O categoryId deve ser um UUID válido." };
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length < 2)
  ) {
    return { error: "O nome do subtipo deve ter no mínimo 2 caracteres." };
  }

  if (typeof name === "string" && name.trim().length > NAME_MAX_LENGTH) {
    return { error: NAME_TOO_LONG };
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
      return { error: SLUG_TOO_LONG };
    }
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  return {
    value: {
      categoryId,
      name: typeof name === "string" ? name.trim() : undefined,
      slug: finalSlug,
      active,
    },
  };
}

export function validateSubtypeQuery(url: URL): SubtypeQueryFilters {
  const { page, limit } = parsePagination(url);
  const categoryIdParam = url.searchParams.get("categoryId");
  const activeParam = url.searchParams.get("active");

  let active: boolean | undefined = undefined;
  if (activeParam === "true") active = true;
  if (activeParam === "false") active = false;

  return {
    page,
    limit,
    search: parseSearch(url),
    categoryId:
      categoryIdParam && isValidUuid(categoryIdParam)
        ? categoryIdParam
        : undefined,
    active,
  };
}
