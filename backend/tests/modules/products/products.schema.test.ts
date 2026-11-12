import { describe, expect, it } from "bun:test";
import { BadRequestError, ConflictError } from "@/lib/errors";
import { errorHandler } from "@/middlewares/error";
import { ROLES } from "@/middlewares/role";
import { ProductsController } from "@/modules/products/products.controller";
import {
  validateCreateProduct,
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
