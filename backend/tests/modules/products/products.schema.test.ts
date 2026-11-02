import { describe, expect, it } from "bun:test";
import { MAX_SEARCH_LENGTH } from "@/lib/pagination";
import { validateProductQuery } from "@/modules/products/products.schema";

const parse = (qs: string) =>
  validateProductQuery(new URL(`http://localhost/produtos${qs}`));

describe("Validação da query de listagem de produtos", () => {
  it("deve normalizar o termo de busca para a forma de slug", () => {
    expect(parse("?search=Sof%C3%A1_Retr%C3%A1til").search).toBe(
      "sofa-retratil",
    );
    expect(parse("?search=ROUPEIRO%20%20ROMA").search).toBe("roupeiro-roma");
  });

  it("deve ignorar termo que fica vazio após a normalização", () => {
    expect(parse("?search=***").search).toBeUndefined();
    expect(parse("?search=%20%20%20").search).toBeUndefined();
    expect(parse("?search=").search).toBeUndefined();
    expect(parse("").search).toBeUndefined();
  });

  it("deve cortar o termo em 100 caracteres antes de normalizar", () => {
    const letters = "a".repeat(MAX_SEARCH_LENGTH);
    const result = parse(`?search=${letters}-zzz`).search;

    expect(result).toBe(letters);
    expect(result).toHaveLength(MAX_SEARCH_LENGTH);
  });

  it("deve manter os demais filtros da listagem", () => {
    const filters = parse("?page=2&limit=5&availabilityType=ON_DEMAND");

    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(5);
    expect(filters.availabilityType).toBe("ON_DEMAND");
    expect(filters.search).toBeUndefined();

    expect(parse("?availabilityType=INVALIDO").availabilityType).toBeUndefined();
    expect(parse("?page=0&limit=1000")).toMatchObject({ page: 1, limit: 20 });
  });
});
