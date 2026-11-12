import { beforeEach, describe, expect, it } from "bun:test";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { ROLES } from "@/middlewares/role";
import { ProductsController } from "@/modules/products/products.controller";
import { ProductsService } from "@/modules/products/products.service";
import {
  CAT_SALA_ID,
  MockProductsRepository,
  PROD_1_ID,
  PROD_2_ID,
  SUB_SOFA_ID,
  SUP_A_ID,
  SUP_B_ID,
} from "../../mocks/products.mock";

describe("Busca e recomendações de produto por UUID ou slug", () => {
  let repo: MockProductsRepository;
  let service: ProductsService;
  let controller: ProductsController;

  beforeEach(() => {
    repo = new MockProductsRepository();
    service = new ProductsService(repo);
    controller = new ProductsController(service);

    repo.products.push(
      {
        id: PROD_1_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
        name: "Sofá Veneza",
        slug: "sofa-veneza",
        collectionLine: "Linha Veneza",
        mainMaterial: "Linho",
        referencePrice: 4500,
        maxInstallments: 10,
        availabilityType: "IN_STOCK",
        estimatedDays: 0,
        heightMm: 900,
        widthMm: 2200,
        depthMm: 1000,
        description: "Sofá retrátil.",
        specifications: { lugares: 3 },
        active: true,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        id: PROD_2_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_B_ID,
        name: "Poltrona Ravena",
        slug: "poltrona-ravena",
        collectionLine: "Linha Ravena",
        mainMaterial: "Madeira",
        referencePrice: 2200,
        maxInstallments: 10,
        availabilityType: "IN_STOCK",
        estimatedDays: 0,
        heightMm: 850,
        widthMm: 780,
        depthMm: 820,
        description: "Poltrona decorativa.",
        specifications: {},
        active: false,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
    );
  });

  it("retorna o produto ativo por slug e por UUID na rota unificada", async () => {
    const bySlug = await service.getById("sofa-veneza");
    expect(bySlug.id).toBe(PROD_1_ID);
    expect(bySlug.slug).toBe("sofa-veneza");

    const byUuid = await service.getById(PROD_1_ID);
    expect(byUuid.id).toBe(PROD_1_ID);

    const response = await controller.getByIdOrSlug(
      new Request("http://localhost/api/v1/produtos/sofa-veneza"),
      { params: { id: "sofa-veneza" }, url: new URL("http://localhost") },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string; slug: string };
    expect(body.id).toBe(PROD_1_ID);
    expect(body.slug).toBe("sofa-veneza");
  });

  it("oculta produto inativo pelo slug para público e libera para Admin", async () => {
    await expect(service.getById("poltrona-ravena")).rejects.toThrow(
      NotFoundError,
    );

    const asAdmin = await service.getById("poltrona-ravena", {
      id: "admin-1",
      email: "admin@gmail.com",
      role: ROLES.ADMIN,
    });
    expect(asAdmin.id).toBe(PROD_2_ID);
  });

  it("bloqueia vendedor de acessar produto de outro fornecedor pelo slug", async () => {
    repo.sellerSuppliers.push({ userId: "seller-1", supplierId: SUP_A_ID });

    await expect(
      service.getById("poltrona-ravena", {
        id: "seller-1",
        email: "seller@gmail.com",
        role: ROLES.SELLER,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("delega identificador vazio/inexistente para o service lançar NotFoundError", async () => {
    await expect(
      controller.getByIdOrSlug(
        new Request("http://localhost/api/v1/produtos/"),
        { params: { id: "   " }, url: new URL("http://localhost") },
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("busca recomendações tanto por slug quanto por UUID", async () => {
    repo.products[1]!.active = true;

    const bySlug = await service.getRecommendations("sofa-veneza");
    expect(bySlug.map((p) => p.id)).toEqual([PROD_2_ID]);

    const byUuid = await service.getRecommendations(PROD_1_ID);
    expect(byUuid.map((p) => p.id)).toEqual([PROD_2_ID]);
  });
});
