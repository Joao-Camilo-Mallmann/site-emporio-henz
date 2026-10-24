import { describe, expect, it } from "bun:test";
import { escapeLike } from "@/lib/pagination";
import {
  slugify,
  validateCategoryQuery,
  validateCreateCategory,
  validateUpdateCategory,
} from "@/modules/categories/categories.schema";

describe("Validação de Schemas de Categorias", () => {
  it("deve converter textos complexos e acentuados em slugs corretos", () => {
    expect(slugify("Sala de Estar & Jantar")).toBe("sala-de-estar-jantar");
    expect(slugify("Móveis Rústicos 100% Madeira")).toBe(
      "moveis-rusticos-100-madeira",
    );
    expect(slugify("  --Área Externa--  ")).toBe("area-externa");
  });

  it("deve validar payload de criação de categoria", () => {
    const valid = validateCreateCategory({
      name: "Quarto Infantil",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.slug).toBe("quarto-infantil");
  });

  it("deve rejeitar criação de categoria com nome vazio", () => {
    const invalid = validateCreateCategory({
      name: "",
    });
    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update de categoria", () => {
    const empty = validateUpdateCategory({});
    expect(empty.error).toBeDefined();
  });

  it("deve validar parâmetros de query para listagem paginada", () => {
    const url = new URL("http://localhost/api/v1/categorias?page=2&limit=15&search=cozinha");
    const query = validateCategoryQuery(url);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(15);
    expect(query.search).toBe("cozinha");
  });

  it("deve cair nos padrões quando page ou limit não forem inteiros dentro dos limites", () => {
    [
      "page=1.5&limit=10.5",
      "page=1e30&limit=1e30",
      "page=-1&limit=0",
      "page=abc&limit=101",
    ].forEach((qs) => {
      const query = validateCategoryQuery(
        new URL(`http://localhost/api/v1/categorias?${qs}`),
      );
      expect(query.page).toBe(1);
      expect(query.limit).toBe(20);
    });
  });

  it("deve truncar o termo de busca em 100 caracteres", () => {
    const url = new URL(
      `http://localhost/api/v1/categorias?search=${"a".repeat(500)}`,
    );
    expect(validateCategoryQuery(url).search?.length).toBe(100);
  });

  it("deve rejeitar nome que não gera slug e escapar curingas da busca", () => {
    expect(validateCreateCategory({ name: "!!!" }).error).toBeDefined();
    expect(validateCreateCategory({ name: "家具" }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "家具", slug: "moveis" }).error,
    ).toBeUndefined();

    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });

  it("deve rejeitar nome e slug acima de 255 caracteres", () => {
    const longo = "a".repeat(256);

    expect(validateCreateCategory({ name: longo }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "Quarto", slug: longo }).error,
    ).toBeDefined();
    expect(validateUpdateCategory({ name: longo }).error).toBeDefined();
    expect(validateUpdateCategory({ slug: longo }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "a".repeat(255) }).error,
    ).toBeUndefined();
  });
});
