import {
  validateCreateSubtype,
  validateSubtypeQuery,
  validateUpdateSubtype,
} from "@/modules/subtypes/subtypes.schema";
import { describe, expect, it } from "bun:test";

describe("Validação de Schemas de Subtipos", () => {
  it("deve validar payload de criação de subtipo com UUID", () => {
    const valid = validateCreateSubtype({
      categoryId: "11111111-1111-4111-a111-111111111111",
      name: "Poltronas do Papai",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.slug).toBe("poltronas-do-papai");
  });

  it("deve rejeitar criação de subtipo com categoryId inválido", () => {
    const invalid = validateCreateSubtype({
      categoryId: "123-invalido",
      name: "Poltronas",
    });
    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update de subtipo", () => {
    const empty = validateUpdateSubtype({});
    expect(empty.error).toBeDefined();
  });

  it("deve validar parâmetros de query para listagem paginada de subtipos", () => {
    const url = new URL(
      "http://localhost/api/v1/subtipos?page=2&limit=10&categoryId=11111111-1111-4111-a111-111111111111&search=mesa",
    );
    const query = validateSubtypeQuery(url);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(10);
    expect(query.categoryId).toBe("11111111-1111-4111-a111-111111111111");
    expect(query.search).toBe("mesa");
  });
});
