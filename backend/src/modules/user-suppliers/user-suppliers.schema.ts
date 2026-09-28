import { AssignSupplierDto } from "./user-suppliers.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateAssignSupplier(
  body: unknown,
): { error?: string; value?: AssignSupplierDto } {
  if (!body || typeof body !== "object") {
    return { error: "O corpo da requisição deve ser um objeto JSON válido." };
  }

  const { supplierId } = body as Record<string, unknown>;

  if (typeof supplierId !== "string" || !UUID_REGEX.test(supplierId.trim())) {
    return { error: "O ID do fornecedor (supplierId) deve ser um UUID válido." };
  }

  return {
    value: {
      supplierId: supplierId.trim(),
    },
  };
}
