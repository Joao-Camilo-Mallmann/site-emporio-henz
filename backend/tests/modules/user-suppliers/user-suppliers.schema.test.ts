import { describe, expect, it } from "bun:test";
import { validateAssignSupplier } from "@/modules/user-suppliers/user-suppliers.schema";

describe("Validação de Schemas de Vínculos", () => {
  it("deve aceitar supplierId com UUID válido", () => {
    const valid = validateAssignSupplier({
      supplierId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.supplierId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("deve rejeitar supplierId que não seja UUID", () => {
    const invalid = validateAssignSupplier({
      supplierId: "id-invalido-123",
    });
    expect(invalid.error).toBeDefined();
  });
});
