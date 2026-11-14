import { describe, expect, it } from "bun:test";
import { BadRequestError, ConflictError } from "@/lib/errors";
import { MAX_SEARCH_LENGTH } from "@/lib/pagination";
import { errorHandler } from "@/middlewares/error";
import { ROLES } from "@/middlewares/role";
import { ProductsController } from "@/modules/products/products.controller";
import {
  validateCreateProduct,
  validateProductQuery,
  validateUpdateProduct,
} from "@/modules/products/products.schema";
import { ProductsService } from "@/modules/products/products.service";
import {
  CAT_SALA_ID,
  MockProductsRepository,
  SUP_A_ID,
} from "../../mocks/products.mock";

describe("Validação de Produtos com campo e mapa de erros", () => {
  it("devolve todos os campos inválidos no create e aponta o primeiro em field", () => {
    const result = validateCreateProduct({
      name: "",
      categoryId: "",
      supplierId: "",
      referencePrice: null,
      availabilityType: "ON_DEMAND",
      estimatedDays: null,
      heightMm: 0,
      widthMm: null,
      depthMm: -10,
      variations: [
        {
          name: "",
          colorsHex: ["#FFF"],
        },
      ],
    });

    expect(result.value).toBeUndefined();
    expect(result.field).toBe("name");
    expect(result.error).toBe(result.errors?.name);
    expect(result.errors).toMatchObject({
      name: expect.any(String),
      categoryId: expect.any(String),
      supplierId: expect.any(String),
      referencePrice: expect.any(String),
      estimatedDays: expect.any(String),
      heightMm: expect.any(String),
      widthMm: expect.any(String),
      depthMm: expect.any(String),
      "variations.0.name": expect.any(String),
      "variations.0.colorsHex.0": expect.any(String),
    });
  });

  it("não gera erro falso em slug quando name e slug estão vazios no create", () => {
    const result = validateCreateProduct({
      name: "",
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      referencePrice: 100,
      availabilityType: "IN_STOCK",
      heightMm: 100,
      widthMm: 100,
      depthMm: 100,
    });

    expect(result.field).toBe("name");
    expect(result.errors?.slug).toBeUndefined();
  });

  it("aponta o campo exato no update quando dimensões ou preço são inválidos", () => {
    const result = validateUpdateProduct({
      referencePrice: null,
      widthMm: 0,
      slug: "",
    });

    expect(result.value).toBeUndefined();
    expect(result.field).toBe("slug");
    expect(result.errors).toMatchObject({
      slug: expect.any(String),
      referencePrice: expect.any(String),
      widthMm: expect.any(String),
    });
  });

  it("controller retorna 400 com field e errors no corpo JSON", async () => {
    const repo = new MockProductsRepository();
    const controller = new ProductsController(new ProductsService(repo));

    const req = new Request("http://localhost/api/v1/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sofá Teste",
        categoryId: CAT_SALA_ID,
        supplierId: SUP_A_ID,
        referencePrice: null,
        availabilityType: "IN_STOCK",
        heightMm: 900,
        widthMm: 2000,
        depthMm: 1000,
      }),
    });

    const response = await controller.create(req, {
      params: {},
      url: new URL("http://localhost/api/v1/produtos"),
      user: { id: "user-1", email: "admin@test.com", role: ROLES.ADMIN },
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: string;
      message: string;
      field?: string;
      errors?: Record<string, string>;
    };
    expect(body.field).toBe("referencePrice");
    expect(body.errors?.referencePrice).toBe(body.message);
  });

  it("errorHandler inclui field e errors para BadRequestError e ConflictError", async () => {
    const conflictRes = errorHandler(
      new ConflictError("Slug em uso.", "slug"),
    );
    expect(conflictRes.status).toBe(409);
    expect(await conflictRes.json()).toEqual({
      error: "Conflict",
      message: "Slug em uso.",
      field: "slug",
      errors: { slug: "Slug em uso." },
    });

    const refRes = errorHandler(
      new BadRequestError("Categoria inexistente.", "categoryId"),
    );
    expect(refRes.status).toBe(400);
    expect(await refRes.json()).toEqual({
      error: "Bad Request",
      message: "Categoria inexistente.",
      field: "categoryId",
      errors: { categoryId: "Categoria inexistente." },
    });
  });
});

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
