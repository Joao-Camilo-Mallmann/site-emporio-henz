import { describe, expect, it } from "bun:test";
import { catalogoApi } from "../src/api/catalogo";
import { matchesCatalogSearch } from "../src/utils/catalog-search";

describe("catalog search", () => {
  const productText = "Guarda-Roupa Solteiro Armário para Quarto";

  it("matches regardless of accents and letter case", () => {
    expect(matchesCatalogSearch(productText, "GUARDA")).toBe(true);
    expect(matchesCatalogSearch(productText, "armario")).toBe(true);
    expect(matchesCatalogSearch(productText, "ARMÁRIO")).toBe(true);
  });

  it("matches hyphenated words with spaces or no separator", () => {
    expect(matchesCatalogSearch(productText, "guarda roupa")).toBe(true);
    expect(matchesCatalogSearch(productText, "guardaroupa")).toBe(true);
    expect(matchesCatalogSearch(productText, "guarda-roupa")).toBe(true);
  });

  it("requires every query word", () => {
    expect(matchesCatalogSearch(productText, "quarto solteiro")).toBe(true);
    expect(matchesCatalogSearch(productText, "quarto casal")).toBe(false);
  });

  it("does not match an empty or punctuation-only query", () => {
    expect(matchesCatalogSearch(productText, "")).toBe(false);
    expect(matchesCatalogSearch(productText, " - !!! ")).toBe(false);
  });

  it("filters the frontend catalog locally and keeps pagination metadata", async () => {
    const response = await catalogoApi.buscarProdutos({
      name: "guarda roupa",
      page: 1,
      limit: 9,
    });

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items.every((product) => product.name.includes("Guarda-roupa"))).toBe(
      true,
    );
    expect(response.meta.totalItems).toBe(response.items.length);
  });
});
