import { LoginDto, RegisterDto, UpdateProfileDto } from "./auth.types";

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

  if (typeof password !== "string" || password.length < 8) {
    return { error: "A senha é obrigatória e deve ter pelo menos 8 caracteres." };
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

export function validateUpdateProfile(
  body: unknown,
): { error?: string; value?: UpdateProfileDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { fullName, phone, city, password } = body as Record<string, unknown>;

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return {
      error: "O nome completo é obrigatório e deve ter pelo menos 2 caracteres.",
    };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return { error: "O telefone deve ser um texto válido." };
  }

  if (city !== undefined && city !== null && typeof city !== "string") {
    return { error: "A cidade deve ser um texto válido." };
  }

  if (password !== undefined && password !== null && password !== "") {
    if (typeof password !== "string") {
      return { error: "A nova senha deve ser um texto válido." };
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return {
        error:
          "A nova senha deve ter no mínimo 8 caracteres e conter letra maiúscula, letra minúscula, número e caractere especial.",
      };
    }
  }

  return {
    value: {
      fullName: fullName.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      password:
        typeof password === "string" && password.length > 0
          ? password
          : undefined,
    },
  };
}
