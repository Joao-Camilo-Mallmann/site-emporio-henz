import { describe, expect, it } from "bun:test";
import {
  isValidUuid,
  validateAddItem,
  validateListName,
} from "@/modules/lists/lists.schema";
import { SAMPLE_ITEM as ITEM } from "../../mocks/lists.mock";

describe("lists.schema", () => {
  it("isValidUuid aceita UUID e recusa texto qualquer", () => {
    expect(isValidUuid(crypto.randomUUID())).toBe(true);
    expect(isValidUuid("abc")).toBe(false);
    expect(isValidUuid("")).toBe(false);
  });

  it("validateListName apara espaços e recusa nome vazio, longo ou corpo inválido", () => {
    expect(validateListName({ name: "  Sala nova  " }).value).toEqual({
      name: "Sala nova",
    });
    expect(validateListName({ name: "   " }).error).toBeDefined();
    expect(validateListName({ name: "a".repeat(101) }).error).toBeDefined();
    expect(validateListName({}).error).toBeDefined();
    expect(validateListName(null).error).toBeDefined();
  });

  it("validateAddItem aceita payload completo e mínimo", () => {
    const full = validateAddItem({
      ...ITEM,
      variationId: crypto.randomUUID(),
    });
    expect(full.error).toBeUndefined();
    expect(full.value?.productId).toBe("p-5");

    const minimal = validateAddItem({
      productId: "p-1",
      name: "Cômoda",
      price: 0,
      image: "/a.png",
      finishLabel: "",
    });
    expect(minimal.error).toBeUndefined();
    expect(minimal.value?.finishLabel).toBeUndefined();

    // Produto sem foto cadastrada continua podendo ser salvo
    const semFoto = validateAddItem({ productId: "p-2", name: "Mesa", price: 10 });
    expect(semFoto.error).toBeUndefined();
    expect(semFoto.value?.image).toBe("");
  });

  it("validateAddItem recusa payload inválido", () => {
    const base = { productId: "p-1", name: "Cômoda", price: 10, image: "/a.png" };

    expect(validateAddItem({ ...base, price: -1 }).error).toBeDefined();
    expect(validateAddItem({ ...base, price: Number.NaN }).error).toBeDefined();
    expect(validateAddItem({ ...base, price: "10" }).error).toBeDefined();
    expect(validateAddItem({ ...base, name: "" }).error).toBeDefined();
    expect(validateAddItem({ ...base, productId: "" }).error).toBeDefined();
    expect(
      validateAddItem({ ...base, image: "a".repeat(2049) }).error,
    ).toBeDefined();
    expect(validateAddItem({ ...base, variationId: "abc" }).error).toBeDefined();
    expect(validateAddItem(null).error).toBeDefined();
  });
});
