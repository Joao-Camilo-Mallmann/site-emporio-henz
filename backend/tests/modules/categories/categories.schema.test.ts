import { describe, expect, it } from "bun:test";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { escapeLike } from "@/lib/pagination";
import {
  assertCanCreateCategory,
  assertCanDeleteCategory,
  assertCanUpdateCategory,
  slugify,
  validateCategoryQuery,
  validateCreateCategory,
  validateUpdateCategory,
} from "@/modules/categories/categories.schema";
import {
  ACTIVE_ID,
  MockCategoriesRepository,
} from "../../mocks/categories.mock";

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

describe("Regras de Categorias no schema (assertCan*)", () => {
  function repoComCategoria() {
    const repo = new MockCategoriesRepository();
    repo.categories.push(
      {
        id: ACTIVE_ID,
        name: "Sala de Estar",
        slug: "sala-de-estar",
        active: true,
        deleted: false,
      },
      {
        id: "outra",
        name: "Quarto",
        slug: "quarto",
        active: true,
        deleted: false,
      },
    );
    repo.subtypes.push({
      id: "sub-1",
      categoryId: ACTIVE_ID,
      name: "Sofás",
      slug: "sofas",
      active: true,
      deleted: false,
    });
    return repo;
  }

  function vincularProduto(
    repo: MockCategoriesRepository,
    produto: Partial<{ categoryId: string; active: boolean; deleted: boolean }>,
  ) {
    repo.products.push({
      id: `p-${repo.products.length + 1}`,
      categoryId: ACTIVE_ID,
      active: true,
      deleted: false,
      ...produto,
    });
  }

  it("deve recusar criação com slug de categoria ativa", async () => {
    const repo = repoComCategoria();

    await expect(
      assertCanCreateCategory({ name: "Sala", slug: "sala-de-estar" }, repo),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      assertCanCreateCategory({ name: "Cozinha", slug: "cozinha" }, repo),
    ).resolves.toBeUndefined();
  });

  it("deve recusar atualização de categoria inexistente ou com slug de outra", async () => {
    const repo = repoComCategoria();

    await expect(
      assertCanUpdateCategory("inexistente", { name: "Nova" }, repo),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      assertCanUpdateCategory(ACTIVE_ID, { slug: "quarto" }, repo),
    ).rejects.toBeInstanceOf(ConflictError);
    // Manter o próprio slug não é conflito.
    await expect(
      assertCanUpdateCategory(ACTIVE_ID, { slug: "sala-de-estar" }, repo),
    ).resolves.toBeUndefined();
  });

  it("deve recusar exclusão e informar a quantidade de produtos ativos", async () => {
    const repo = repoComCategoria();
    vincularProduto(repo, {});
    vincularProduto(repo, {});

    const erro = assertCanDeleteCategory(ACTIVE_ID, repo);
    await expect(erro).rejects.toBeInstanceOf(ConflictError);
    await expect(erro).rejects.toThrow("2 produtos vinculados");
  });

  it("deve recusar exclusão quando o único produto vinculado está inativo", async () => {
    const repo = repoComCategoria();
    vincularProduto(repo, { active: false });

    await expect(assertCanDeleteCategory(ACTIVE_ID, repo)).rejects.toThrow(
      "1 produto vinculado",
    );
  });

  it("não deve alterar a categoria nem os subtipos ao recusar a exclusão", async () => {
    const repo = repoComCategoria();
    vincularProduto(repo, {});

    await expect(
      assertCanDeleteCategory(ACTIVE_ID, repo),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.categories.find((c) => c.id === ACTIVE_ID)?.deleted).toBe(
      false,
    );
    expect(repo.subtypes.find((s) => s.id === "sub-1")?.deleted).toBe(false);
  });

  it("deve permitir excluir quando os produtos já foram excluídos ou são de outra categoria", async () => {
    const repo = repoComCategoria();
    vincularProduto(repo, { deleted: true });
    vincularProduto(repo, { categoryId: "outra" });

    await expect(
      assertCanDeleteCategory(ACTIVE_ID, repo),
    ).resolves.toBeUndefined();
  });

  it("deve responder NotFoundError ao excluir categoria inexistente ou já excluída", async () => {
    const repo = repoComCategoria();
    repo.categories[0]!.deleted = true;

    await expect(
      assertCanDeleteCategory(ACTIVE_ID, repo),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      assertCanDeleteCategory("inexistente", repo),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
