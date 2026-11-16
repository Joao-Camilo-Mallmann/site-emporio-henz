import { describe, expect, it } from "bun:test";
import {
  isValidUuid,
  validateAddItem,
  validateListName,
  validateShare,
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

  it("validateShare só aceita isPublic booleano", () => {
    expect(validateShare({ isPublic: true }).value).toEqual({ isPublic: true });
    expect(validateShare({ isPublic: false }).value).toEqual({ isPublic: false });
    expect(validateShare({ isPublic: "true" }).error).toBeDefined();
    expect(validateShare({}).error).toBeDefined();
    expect(validateShare(null).error).toBeDefined();
  });

  it("validateAddItem aceita payload completo e mínimo", () => {
    const full = validateAddItem({
      ...ITEM,
      variationId: crypto.randomUUID(),
    });
    expect(full.error).toBeUndefined();
    expect(full.value?.productId).toBe(ITEM.productId);

    // Nome, preço e imagem enviados pelo front são ignorados
    const minimal = validateAddItem({
      productId: ITEM.productId,
      name: "Inventado",
      price: 1,
      finishLabel: "",
    });
    expect(minimal.error).toBeUndefined();
    expect(minimal.value).toEqual({ productId: ITEM.productId });
  });

  it("validateAddItem recusa payload inválido", () => {
    const base = { productId: ITEM.productId };

    expect(validateAddItem({ productId: "nao-existe" }).error).toBeDefined();
    expect(validateAddItem({ productId: "" }).error).toBeDefined();
    expect(validateAddItem({}).error).toBeDefined();
    expect(validateAddItem({ ...base, variationId: "abc" }).error).toBeDefined();
    expect(validateAddItem(null).error).toBeDefined();
  });
});
