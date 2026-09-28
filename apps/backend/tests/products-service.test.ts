import { describe, expect, it } from "bun:test";
import { NotFoundError } from "@/lib/errors";
import { ProductsController } from "@/modules/products/products.controller";
import { ProductsRepository } from "@/modules/products/products.repository";
import {
  productsService,
  ProductsService,
} from "@/modules/products/products.service";
import { ProductDto } from "@/modules/products/products.types";
import { apiRouter } from "@/routes";

class MockProductsRepository extends ProductsRepository {
  public products: Map<string, ProductDto & { deleted: boolean }> = new Map();

  async findById(id: string): Promise<ProductDto | null> {
    const p = this.products.get(id);
    if (!p || p.deleted) {
      return null;
    }
    const { deleted: _, ...dto } = p;
    return dto;
  }

  async findRecommendations(
    productId: string,
    categoryId: string,
    limit = 4,
  ): Promise<ProductDto[]> {
    return Array.from(this.products.values())
      .filter(
        (p) =>
          p.categoryId === categoryId &&
          p.id !== productId &&
          p.active === true &&
          !p.deleted,
      )
      .slice(0, limit)
      .map(({ deleted: _, ...dto }) => dto);
  }
}

function createDummyProduct(
  overrides: Partial<ProductDto & { deleted: boolean }> = {},
): ProductDto & { deleted: boolean } {
  return {
    id: overrides.id || `prod-${Math.random().toString(36).substring(2, 9)}`,
    categoryId: overrides.categoryId || "cat-sala",
    subtypeId: overrides.subtypeId || "sub-sofa",
    supplierId: overrides.supplierId || "sup-henz",
    name: overrides.name || "Sofá Retrátil",
    slug: overrides.slug || "sofa-retratil",
    collectionLine: overrides.collectionLine || "Conforto",
    mainMaterial: overrides.mainMaterial || "Linho",
    referencePrice: overrides.referencePrice ?? 2999.9,
    maxInstallments: overrides.maxInstallments ?? 10,
    availabilityType: overrides.availabilityType || "IN_STOCK",
    estimatedDays: overrides.estimatedDays ?? 0,
    heightMm: overrides.heightMm ?? 900,
    widthMm: overrides.widthMm ?? 2200,
    depthMm: overrides.depthMm ?? 1050,
    description: overrides.description || "Descrição de teste",
    specifications: overrides.specifications || {},
    active: overrides.active ?? true,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    deleted: overrides.deleted ?? false,
  };
}

describe("Módulo de Produtos (Algoritmo de Recomendações - US-BE-15)", () => {
  it("deve retornar até 4 produtos complementares da mesma categoria", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const baseProduct = createDummyProduct({
      id: "prod-base",
      categoryId: "cat-sala",
      name: "Sofá Base",
    });
    mockRepo.products.set(baseProduct.id, baseProduct);

    // Adiciona 5 produtos complementares da mesma categoria
    for (let i = 1; i <= 5; i++) {
      const p = createDummyProduct({
        id: `prod-sala-${i}`,
        categoryId: "cat-sala",
        name: `Móvel de Sala ${i}`,
      });
      mockRepo.products.set(p.id, p);
    }

    const recommendations = await service.getRecommendations("prod-base");

    expect(recommendations).toHaveLength(4);
    for (const item of recommendations) {
      expect(item.categoryId).toBe("cat-sala");
      expect(item.id).not.toBe("prod-base");
    }
  });

  it("nunca deve incluir o próprio produto consultado na lista de sugestões", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const baseProduct = createDummyProduct({
      id: "prod-sofa-1",
      categoryId: "cat-sala",
    });
    const complement1 = createDummyProduct({
      id: "prod-mesa-centro",
      categoryId: "cat-sala",
    });

    mockRepo.products.set(baseProduct.id, baseProduct);
    mockRepo.products.set(complement1.id, complement1);

    const recommendations = await service.getRecommendations("prod-sofa-1");

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("prod-mesa-centro");
    expect(
      recommendations.some((p) => p.id === "prod-sofa-1"),
    ).toBeFalse();
  });

  it("deve ignorar produtos de outras categorias", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const baseProduct = createDummyProduct({
      id: "prod-cama",
      categoryId: "cat-quarto",
    });
    const itemQuarto = createDummyProduct({
      id: "prod-roupeiro",
      categoryId: "cat-quarto",
    });
    const itemSala = createDummyProduct({
      id: "prod-poltrona",
      categoryId: "cat-sala",
    });

    mockRepo.products.set(baseProduct.id, baseProduct);
    mockRepo.products.set(itemQuarto.id, itemQuarto);
    mockRepo.products.set(itemSala.id, itemSala);

    const recommendations = await service.getRecommendations("prod-cama");

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("prod-roupeiro");
  });

  it("deve ocultar automaticamente itens deletados logicamente (deleted_at)", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const baseProduct = createDummyProduct({
      id: "prod-1",
      categoryId: "cat-sala",
    });
    const activeItem = createDummyProduct({
      id: "prod-ativo",
      categoryId: "cat-sala",
      deleted: false,
    });
    const deletedItem = createDummyProduct({
      id: "prod-deletado",
      categoryId: "cat-sala",
      deleted: true,
    });

    mockRepo.products.set(baseProduct.id, baseProduct);
    mockRepo.products.set(activeItem.id, activeItem);
    mockRepo.products.set(deletedItem.id, deletedItem);

    const recommendations = await service.getRecommendations("prod-1");

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("prod-ativo");
  });

  it("deve ocultar automaticamente itens com active = false", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const baseProduct = createDummyProduct({
      id: "prod-1",
      categoryId: "cat-sala",
    });
    const activeItem = createDummyProduct({
      id: "prod-ativo",
      categoryId: "cat-sala",
      active: true,
    });
    const inactiveItem = createDummyProduct({
      id: "prod-inativo",
      categoryId: "cat-sala",
      active: false,
    });

    mockRepo.products.set(baseProduct.id, baseProduct);
    mockRepo.products.set(activeItem.id, activeItem);
    mockRepo.products.set(inactiveItem.id, inactiveItem);

    const recommendations = await service.getRecommendations("prod-1");

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe("prod-ativo");
  });

  it("deve lançar NotFoundError se o produto base não existir ou estiver deletado", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const deletedBase = createDummyProduct({
      id: "prod-deleted-base",
      deleted: true,
    });
    mockRepo.products.set(deletedBase.id, deletedBase);

    expect(service.getRecommendations("prod-inexistente")).rejects.toThrow(
      NotFoundError,
    );
    expect(service.getRecommendations("prod-deleted-base")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("o controller deve rejeitar identificadores inválidos com status 400", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);
    const controller = new ProductsController(service);

    const req = new Request("http://localhost/api/v1/produtos//recomendados");
    const ctx = {
      params: { id: "" },
      url: new URL("http://localhost/api/v1/produtos//recomendados"),
    };

    const res = await controller.getRecommendations(req, ctx);
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Bad Request");
  });

  it("o roteador deve direcionar GET /api/v1/produtos/:id/recomendados corretamente", async () => {
    const originalGetRecommendations = productsService.getRecommendations;
    productsService.getRecommendations = async (id: string) => {
      return [
        createDummyProduct({
          id: `prod-rec-para-${id}`,
          categoryId: "cat-sala",
        }),
      ];
    };

    try {
      const req = new Request(
        "http://localhost:3001/api/v1/produtos/prod-origem-123/recomendados",
        { method: "GET" },
      );

      const res = await apiRouter.handle(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const body = (await res?.json()) as ProductDto[];
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("prod-rec-para-prod-origem-123");
    } finally {
      productsService.getRecommendations = originalGetRecommendations;
    }
  });
});
