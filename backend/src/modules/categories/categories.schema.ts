import { ConflictError, NotFoundError } from "@/lib/errors";
import { parsePagination, parseSearch } from "@/lib/pagination";
import {
  isValidUuid,
  NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  slugify,
} from "@/lib/slug";
import {
  categoriesRepository,
  CategoriesRepository,
} from "./categories.repository";
import {
  CategoryQueryFilters,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./categories.types";

export { isValidUuid, slugify };

const NAME_TOO_LONG = `O nome da categoria deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
const SLUG_TOO_LONG = `O slug deve ter no máximo ${SLUG_MAX_LENGTH} caracteres.`;

export function validateCreateCategory(body: unknown): {
  error?: string;
  value?: CreateCategoryDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { name, slug, active } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    return {
      error:
        "O nome da categoria é obrigatório e deve ter no mínimo 2 caracteres.",
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
      name: name.trim(),
      slug: finalSlug,
      active: active !== undefined ? active : true,
    },
  };
}

export function validateUpdateCategory(body: unknown): {
  error?: string;
  value?: UpdateCategoryDto;
} {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { name, slug, active } = body as Record<string, unknown>;

  const hasAnyField =
    name !== undefined || slug !== undefined || active !== undefined;

  if (!hasAnyField) {
    return { error: "Ao menos um campo deve ser fornecido para atualização." };
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length < 2)
  ) {
    return { error: "O nome da categoria deve ter no mínimo 2 caracteres." };
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
      name: typeof name === "string" ? name.trim() : undefined,
      slug: finalSlug,
      active,
    },
  };
}

export function validateCategoryQuery(url: URL): CategoryQueryFilters {
  const { page, limit } = parsePagination(url);
  const activeParam = url.searchParams.get("active");

  let active: boolean | undefined = undefined;
  if (activeParam === "true") active = true;
  if (activeParam === "false") active = false;

  return {
    page,
    limit,
    search: parseSearch(url),
    active,
  };
}

// Regras que consultam o banco. O controller chama depois do `validate*`;
// o service recebe os dados já validados.

const CATEGORY_NOT_FOUND = "Categoria não encontrada.";

function slugConflict(slug: string): ConflictError {
  return new ConflictError(
    `Já existe uma categoria ativa com o slug '${slug}'.`,
  );
}

export async function assertCanCreateCategory(
  dto: CreateCategoryDto,
  repo: CategoriesRepository = categoriesRepository,
): Promise<void> {
  const slug = dto.slug || slugify(dto.name);
  if (await repo.existsCategorySlugActive(slug)) {
    throw slugConflict(slug);
  }
}

export async function assertCanUpdateCategory(
  id: string,
  dto: UpdateCategoryDto,
  repo: CategoriesRepository = categoriesRepository,
): Promise<void> {
  if (!(await repo.findCategoryById(id))) {
    throw new NotFoundError(CATEGORY_NOT_FOUND);
  }

  if (dto.slug && (await repo.existsCategorySlugActive(dto.slug, id))) {
    throw slugConflict(dto.slug);
  }
}

// Produtos excluídos logicamente não contam (RF04, UC09 E2).
export async function assertCanDeleteCategory(
  id: string,
  repo: CategoriesRepository = categoriesRepository,
): Promise<void> {
  if (!(await repo.findCategoryById(id))) {
    throw new NotFoundError(CATEGORY_NOT_FOUND);
  }

  const linkedProducts = await repo.countLinkedProducts(id);
  if (linkedProducts > 0) {
    const produtos =
      linkedProducts === 1
        ? "1 produto vinculado"
        : `${linkedProducts} produtos vinculados`;
    throw new ConflictError(
      `Não é possível excluir a categoria: há ${produtos}. Exclua os produtos ou mova-os para outra categoria antes.`,
    );
  }
}
