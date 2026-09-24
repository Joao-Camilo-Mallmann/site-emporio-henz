import { CreateUserDto, UpdateUserDto, UserQueryFilters } from "./users.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = [1, 2, 3];

export function validateCreateUser(
  body: unknown,
): { error?: string; value?: CreateUserDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { email, password, role, fullName, phone, city } = body as Record<
    string,
    unknown
  >;

  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email.trim().toLowerCase())
  ) {
    return { error: "O e-mail informado é inválido." };
  }

  if (typeof password !== "string" || password.length < 6) {
    return { error: "A senha é obrigatória e deve ter pelo menos 6 caracteres." };
  }

  if (typeof role !== "number" || !VALID_ROLES.includes(role)) {
    return {
      error: "O papel (role) deve ser 1 (Cliente), 2 (Vendedor) ou 3 (Admin).",
    };
  }

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return {
      error: "O nome completo é obrigatório e deve conter ao menos 2 caracteres.",
    };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return { error: "O telefone deve ser um texto válido." };
  }

  if (city !== undefined && city !== null && typeof city !== "string") {
    return { error: "A cidade deve ser um texto válido." };
  }

  return {
    value: {
      email: email.trim().toLowerCase(),
      password,
      role,
      fullName: fullName.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
    },
  };
}

export function validateUpdateUser(
  body: unknown,
): { error?: string; value?: UpdateUserDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { fullName, phone, city, role, password } = body as Record<
    string,
    unknown
  >;

  const hasAnyField =
    fullName !== undefined ||
    phone !== undefined ||
    city !== undefined ||
    role !== undefined ||
    password !== undefined;

  if (!hasAnyField) {
    return { error: "Ao menos um campo deve ser fornecido para atualização." };
  }

  if (
    fullName !== undefined &&
    (typeof fullName !== "string" || fullName.trim().length < 2)
  ) {
    return { error: "O nome completo deve conter ao menos 2 caracteres." };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return { error: "O telefone deve ser um texto válido." };
  }

  if (city !== undefined && city !== null && typeof city !== "string") {
    return { error: "A cidade deve ser um texto válido." };
  }

  if (role !== undefined && (typeof role !== "number" || !VALID_ROLES.includes(role))) {
    return {
      error: "O papel (role) deve ser 1 (Cliente), 2 (Vendedor) ou 3 (Admin).",
    };
  }

  if (
    password !== undefined &&
    (typeof password !== "string" || password.length < 6)
  ) {
    return { error: "A nova senha deve ter ao menos 6 caracteres." };
  }

  return {
    value: {
      fullName: typeof fullName === "string" ? fullName.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      role,
      password,
    },
  };
}

export function validateUserQuery(url: URL): UserQueryFilters {
  const pageParam = Number(url.searchParams.get("page"));
  const limitParam = Number(url.searchParams.get("limit"));
  const searchParam = url.searchParams.get("search");
  const roleParam = Number(url.searchParams.get("role"));

  const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit =
    !isNaN(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 20;

  return {
    page,
    limit,
    search: searchParam?.trim() || undefined,
    role: VALID_ROLES.includes(roleParam) ? roleParam : undefined,
  };
}
