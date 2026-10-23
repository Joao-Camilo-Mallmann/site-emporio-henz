import { describe, expect, it } from "bun:test";
import {
  validateCreateSupplier,
  validateUpdateSupplier,
} from "@/modules/suppliers/suppliers.schema";

describe("Validação de Schemas de Fornecedores", () => {
  it("deve validar dados válidos de fornecedor", () => {
    const valid = validateCreateSupplier({
      name: "Fábrica de Cadeiras Estrela",
      contact: "51 9999-0000",
      active: true,
    });

    expect(valid.error).toBeUndefined();
    expect(valid.value?.name).toBe("Fábrica de Cadeiras Estrela");
  });

  it("deve rejeitar nome menor que 2 caracteres", () => {
    const invalid = validateCreateSupplier({
      name: "A",
    });

    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update", () => {
    const empty = validateUpdateSupplier({});
    expect(empty.error).toBeDefined();
  });
});
