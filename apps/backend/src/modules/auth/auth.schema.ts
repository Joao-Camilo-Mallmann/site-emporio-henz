import { LoginDto, RegisterDto } from "./auth.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(
  body: unknown,
): { error?: string; value?: RegisterDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { fullName, email, password, phone, city } = body as Record<
    string,
    unknown
  >;

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return {
      error: "O nome completo é obrigatório e deve ter pelo menos 2 caracteres.",
    };
  }

  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email.trim().toLowerCase())
  ) {
    return { error: "O e-mail informado é inválido." };
  }

  if (typeof password !== "string" || password.length < 6) {
    return { error: "A senha é obrigatória e deve ter pelo menos 6 caracteres." };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return { error: "O telefone deve ser um texto válido." };
  }

  if (city !== undefined && city !== null && typeof city !== "string") {
    return { error: "A cidade deve ser um texto válido." };
  }

  return {
    value: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
    },
  };
}

export function validateLogin(
  body: unknown,
): { error?: string; value?: LoginDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { email, password } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email.trim().toLowerCase())
  ) {
    return { error: "O e-mail informado é inválido." };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "A senha é obrigatória." };
  }

  return {
    value: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}
