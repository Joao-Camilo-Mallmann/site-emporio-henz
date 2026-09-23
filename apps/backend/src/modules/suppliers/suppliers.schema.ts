import { CreateSupplierDto, UpdateSupplierDto } from "./suppliers.types";

export function validateCreateSupplier(
  body: unknown,
): { error?: string; value?: CreateSupplierDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { name, contact, active } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    return {
      error: "O nome do fornecedor é obrigatório e deve ter no mínimo 2 caracteres.",
    };
  }

  if (contact !== undefined && contact !== null && typeof contact !== "string") {
    return { error: "O contato deve ser um texto válido." };
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  return {
    value: {
      name: name.trim(),
      contact: typeof contact === "string" ? contact.trim() : undefined,
      active: active !== undefined ? active : true,
    },
  };
}

export function validateUpdateSupplier(
  body: unknown,
): { error?: string; value?: UpdateSupplierDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { name, contact, active } = body as Record<string, unknown>;

  const hasAnyField =
    name !== undefined || contact !== undefined || active !== undefined;

  if (!hasAnyField) {
    return { error: "Ao menos um campo deve ser fornecido para atualização." };
  }

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length < 2)
  ) {
    return { error: "O nome do fornecedor deve ter no mínimo 2 caracteres." };
  }

  if (contact !== undefined && contact !== null && typeof contact !== "string") {
    return { error: "O contato deve ser um texto válido." };
  }

  if (active !== undefined && typeof active !== "boolean") {
    return { error: "O status ativo deve ser um valor booleano." };
  }

  return {
    value: {
      name: typeof name === "string" ? name.trim() : undefined,
      contact: typeof contact === "string" ? contact.trim() : undefined,
      active,
    },
  };
}
