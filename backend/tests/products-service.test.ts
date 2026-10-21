import { describe, expect, it } from "bun:test";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { signJwt } from "@/lib/jwt";
import { paginate, resolvePagination } from "@/lib/pagination";
import { toUploadUrl, UPLOADS_PUBLIC_PREFIX } from "@/lib/uploads";
import { ROLES } from "@/middlewares/role";
import { ProductsController } from "@/modules/products/products.controller";
import { ProductsRepository } from "@/modules/products/products.repository";
import {
  validateCreateProduct,
  validateProductQuery,
  validateUpdateProduct,
} from "@/modules/products/products.schema";
import {
  productsService,
  ProductsService,
} from "@/modules/products/products.service";
import {
  CreateProductDto,
  PaginatedProductsResult,
  ProductDbRow,
  ProductDetailDto,
  ProductDto,
  ProductImageDbRow,
  ProductImageDto,
  ProductQueryFilters,
  ProductVariationDbRow,
  ProductVariationDto,
  UpdateProductDto,
} from "@/modules/products/products.types";
import { apiRouter } from "@/routes";

const CAT_SALA_ID = "11111111-1111-4111-a111-111111111111";
const CAT_QUARTO_ID = "22222222-2222-4222-a222-222222222222";
const SUB_SOFA_ID = "33333333-3333-4333-a333-333333333333";
const SUB_CAMA_ID = "44444444-4444-4444-a444-444444444444";
const SUP_A_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const SUP_B_ID = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";
const SUP_C_ID = "cccccccc-cccc-4ccc-accc-cccccccccccc";
const PROD_1_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const PROD_2_ID = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";
const VAR_1_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";
const VAR_2_ID = "99999999-9999-4999-a999-999999999999";

class MockProductsRepository extends ProductsRepository {
  public products: Map<string, ProductDto & { deleted: boolean }> = new Map();
  public variations: Map<string, ProductVariationDto & { deleted: boolean }> =
    new Map();
  public images: Map<string, ProductImageDto & { deleted: boolean }> =
    new Map();
  public categories: Set<string> = new Set([
    CAT_SALA_ID,
    CAT_QUARTO_ID,
    "cat-sala",
    "cat-quarto",
  ]);
  public subtypes: Map<string, string> = new Map([
    [SUB_SOFA_ID, CAT_SALA_ID],
    [SUB_CAMA_ID, CAT_QUARTO_ID],
    ["sub-sofa", "cat-sala"],
  ]);
  public suppliers: Set<string> = new Set([
    SUP_A_ID,
    SUP_B_ID,
    SUP_C_ID,
    "sup-henz",
  ]);
  public sellerSuppliers: Map<string, string[]> = new Map();

  async listPaginated(
    filters: ProductQueryFilters = {},
  ): Promise<PaginatedProductsResult> {
    const { page, limit, offset } = resolvePagination(filters);

    if (filters.supplierIds && filters.supplierIds.length === 0) {
      return paginate([], 0, { page, limit });
    }

    const search = filters.search?.toLowerCase();

    const filtered = Array.from(this.products.values()).filter((p) => {
      if (p.deleted) return false;
      if (filters.categoryId && p.categoryId !== filters.categoryId)
        return false;
      if (filters.subtypeId && p.subtypeId !== filters.subtypeId) return false;
      if (filters.supplierId && p.supplierId !== filters.supplierId)
        return false;
      if (
        filters.supplierIds &&
        (!p.supplierId || !filters.supplierIds.includes(p.supplierId))
      ) {
        return false;
      }
      if (
        filters.availabilityType &&
        p.availabilityType !== filters.availabilityType
      ) {
        return false;
      }
      if (filters.minPrice !== undefined && p.referencePrice < filters.minPrice)
        return false;
      if (filters.maxPrice !== undefined && p.referencePrice > filters.maxPrice)
        return false;
      if (filters.active !== undefined && p.active !== filters.active) {
        return false;
      }
      if (search) {
        const matchesName = p.name.toLowerCase().includes(search);
        const matchesDesc = (p.description ?? "")
          .toLowerCase()
          .includes(search);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });

    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit).map((item) => {
      const { deleted, ...dto } = item;
      void deleted;
      return dto;
    });

    return paginate(data, total, { page, limit });
  }

  async findById(id: string): Promise<ProductDto | null> {
    const p = this.products.get(id);
    if (!p || p.deleted) {
      return null;
    }
    const { deleted, ...dto } = p;
    void deleted;
    return dto;
  }

  async findManageableById(id: string) {
    return this.findById(id);
  }

  async findDetailById(id: string): Promise<ProductDetailDto | null> {
    const base = await this.findById(id);
    if (!base) return null;

    const variations = Array.from(this.variations.values())
      .filter((v) => v.productId === id && !v.deleted)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ deleted, ...v }) => {
        void deleted;
        return v;
      });

    const images = Array.from(this.images.values())
      .filter((img) => img.productId === id && !img.deleted)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ deleted, ...img }) => {
        void deleted;
        return img;
      });

    return {
      ...base,
      variations,
      images,
    };
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
      .map((item) => {
        const { deleted, ...dto } = item;
        void deleted;
        return dto;
      });
  }

  async existsProductSlugActive(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    for (const p of this.products.values()) {
      if (!p.deleted && p.slug === slug && p.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  async findActiveSupplierIdsByUserId(userId: string): Promise<string[]> {
    return this.sellerSuppliers.get(userId) ?? [];
  }

  async existsActiveCategory(categoryId: string): Promise<boolean> {
    return this.categories.has(categoryId);
  }

  async findActiveSubtypeCategoryId(subtypeId: string): Promise<string | null> {
    return this.subtypes.get(subtypeId) ?? null;
  }

  async existsActiveSupplier(supplierId: string): Promise<boolean> {
    return this.suppliers.has(supplierId);
  }

  async createProduct(
    data: CreateProductDto & { slug: string },
  ): Promise<ProductDetailDto> {
    const id = PROD_1_ID;
    const now = new Date().toISOString();
    const product: ProductDto & { deleted: boolean } = {
      id,
      categoryId: data.categoryId,
      subtypeId: data.subtypeId ?? null,
      supplierId: data.supplierId,
      name: data.name,
      slug: data.slug,
      collectionLine: data.collectionLine ?? null,
      mainMaterial: data.mainMaterial ?? null,
      referencePrice: data.referencePrice,
      maxInstallments: data.maxInstallments ?? 1,
      availabilityType: data.availabilityType,
      estimatedDays: data.estimatedDays,
      heightMm: data.heightMm,
      widthMm: data.widthMm,
      depthMm: data.depthMm,
      description: data.description ?? null,
      specifications: data.specifications ?? {},
      active: data.active ?? true,
      thumbnailUrl: null,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    this.products.set(id, product);

    if (data.variations) {
      data.variations.forEach((v, idx) => {
        const varId =
          v.id ||
          `00000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
        this.variations.set(varId, {
          id: varId,
          productId: id,
          name: v.name,
          variationType: v.variationType ?? "FINISH",
          colorsHex: v.colorsHex ?? [],
          sampleImageUrl: null,
          finishDetails: v.finishDetails ?? {},
          sortOrder: v.sortOrder ?? idx,
          inStock: v.inStock ?? true,
          createdAt: now,
          updatedAt: now,
          deleted: false,
        });
      });
    }

    return (await this.findDetailById(id))!;
  }

  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductDetailDto | null> {
    const existing = this.products.get(id);
    if (!existing || existing.deleted) return null;

    const now = new Date().toISOString();
    const updated: ProductDto & { deleted: boolean } = {
      ...existing,
      categoryId: data.categoryId ?? existing.categoryId,
      subtypeId:
        data.subtypeId !== undefined ? data.subtypeId : existing.subtypeId,
      supplierId: data.supplierId ?? existing.supplierId,
      name: data.name ?? existing.name,
      slug: data.slug ?? existing.slug,
      collectionLine:
        data.collectionLine !== undefined
          ? data.collectionLine
          : existing.collectionLine,
      mainMaterial:
        data.mainMaterial !== undefined
          ? data.mainMaterial
          : existing.mainMaterial,
      referencePrice: data.referencePrice ?? existing.referencePrice,
      maxInstallments: data.maxInstallments ?? existing.maxInstallments,
      availabilityType: data.availabilityType ?? existing.availabilityType,
      estimatedDays: data.estimatedDays ?? existing.estimatedDays,
      heightMm: data.heightMm ?? existing.heightMm,
      widthMm: data.widthMm ?? existing.widthMm,
      depthMm: data.depthMm ?? existing.depthMm,
      description:
        data.description !== undefined
          ? data.description
          : existing.description,
      specifications: data.specifications ?? existing.specifications,
      active: data.active ?? existing.active,
      updatedAt: now,
    };
    this.products.set(id, updated);

    if (data.variations !== undefined) {
      const activeExistingIds = new Set(
        Array.from(this.variations.values())
          .filter((v) => v.productId === id && !v.deleted)
          .map((v) => v.id),
      );

      const keptIds = new Set<string>();
      for (const item of data.variations) {
        if (item.id) {
          if (!activeExistingIds.has(item.id)) {
            throw new BadRequestError(
              `A variação '${item.id}' não pertence a este produto ou foi removida.`,
            );
          }
          keptIds.add(item.id);
        }
      }

      for (const existingId of activeExistingIds) {
        if (!keptIds.has(existingId)) {
          const old = this.variations.get(existingId)!;
          this.variations.set(existingId, { ...old, deleted: true });
        }
      }

      data.variations.forEach((v, idx) => {
        if (v.id) {
          const current = this.variations.get(v.id)!;
          this.variations.set(v.id, {
            ...current,
            name: v.name,
            variationType: v.variationType ?? "FINISH",
            colorsHex: v.colorsHex ?? [],
            finishDetails: v.finishDetails ?? {},
            sortOrder: v.sortOrder ?? idx,
            inStock: v.inStock ?? true,
            updatedAt: now,
          });
        } else {
          const newId = `88888888-8888-4888-a888-${String(idx + 1).padStart(12, "0")}`;
          this.variations.set(newId, {
            id: newId,
            productId: id,
            name: v.name,
            variationType: v.variationType ?? "FINISH",
            colorsHex: v.colorsHex ?? [],
            sampleImageUrl: null,
            finishDetails: v.finishDetails ?? {},
            sortOrder: v.sortOrder ?? idx,
            inStock: v.inStock ?? true,
            createdAt: now,
            updatedAt: now,
            deleted: false,
          });
        }
      });
    }

    return await this.findDetailById(id);
  }

  async softDeleteProductWithCascade(id: string): Promise<boolean> {
    const existing = this.products.get(id);
    if (!existing || existing.deleted) return false;

    this.products.set(id, { ...existing, deleted: true });
    for (const [varId, v] of this.variations.entries()) {
      if (v.productId === id && !v.deleted) {
        this.variations.set(varId, { ...v, deleted: true });
      }
    }
    for (const [imgId, img] of this.images.entries()) {
      if (img.productId === id && !img.deleted) {
        this.images.set(imgId, { ...img, deleted: true });
      }
    }
    return true;
  }
}

function createDummyProduct(
  overrides: Partial<ProductDto & { deleted: boolean }> = {},
): ProductDto & { deleted: boolean } {
  return {
    id: overrides.id || `prod-${Math.random().toString(36).substring(2, 9)}`,
    categoryId: overrides.categoryId || "cat-sala",
    subtypeId:
      overrides.subtypeId !== undefined ? overrides.subtypeId : "sub-sofa",
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
    thumbnailUrl: overrides.thumbnailUrl ?? null,
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
    expect(recommendations[0]!.id).toBe("prod-mesa-centro");
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
    expect(recommendations[0]!.id).toBe("prod-roupeiro");
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
    expect(recommendations[0]!.id).toBe("prod-ativo");
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
    expect(recommendations[0]!.id).toBe("prod-ativo");
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
      expect(body[0]!.id).toBe("prod-rec-para-prod-origem-123");
    } finally {
      productsService.getRecommendations = originalGetRecommendations;
    }
  });
});

describe("Validação de Schemas do Módulo de Produtos (US-BE-09)", () => {
  it("deve validar a criação de produto sob encomenda (ON_DEMAND) com dimensões em mm e variações", () => {
    const result = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      subtypeId: SUB_SOFA_ID,
      supplierId: SUP_A_ID,
      name: "Roupeiro Roma 6 Portas",
      collectionLine: "Linha Itália",
      mainMaterial: "MDF 18mm",
      referencePrice: 4590.5,
      maxInstallments: 10,
      availabilityType: "ON_DEMAND",
      estimatedDays: 15,
      heightMm: 2300,
      widthMm: 2700,
      depthMm: 600,
      description: "Roupeiro amplo com portas de correr",
      specifications: { portas: 6, gavetas: 4 },
      variations: [
        {
          name: "Carvalho Mel / Off White",
          variationType: "WOOD",
          colorsHex: ["#8B5A2B", "#F5F5DC"],
          finishDetails: { corpo: "Carvalho Mel", portas: "Off White" },
          inStock: true,
        },
      ],
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();
    expect(result.value?.slug).toBe("roupeiro-roma-6-portas");
    expect(result.value?.estimatedDays).toBe(15);
    expect(result.value?.variations).toHaveLength(1);
  });

  it("deve normalizar estimatedDays = 0 automaticamente quando availabilityType for IN_STOCK", () => {
    const result = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      name: "Poltrona Leitura",
      referencePrice: 1200,
      availabilityType: "IN_STOCK",
      estimatedDays: 25,
      heightMm: 850,
      widthMm: 750,
      depthMm: 800,
    });

    expect(result.error).toBeUndefined();
    expect(result.value?.estimatedDays).toBe(0);
    expect(result.value?.subtypeId).toBeNull();
  });

  it("deve rejeitar produto ON_DEMAND sem estimatedDays ou com estimatedDays < 1", () => {
    const missingDays = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      name: "Sofá Sob Medida",
      referencePrice: 5000,
      availabilityType: "ON_DEMAND",
      heightMm: 900,
      widthMm: 2400,
      depthMm: 1100,
    });
    expect(missingDays.error).toBeDefined();

    const zeroDays = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      name: "Sofá Sob Medida",
      referencePrice: 5000,
      availabilityType: "ON_DEMAND",
      estimatedDays: 0,
      heightMm: 900,
      widthMm: 2400,
      depthMm: 1100,
    });
    expect(zeroDays.error).toBeDefined();
  });

  it("deve rejeitar dimensões em milímetros ausentes, zero ou negativas", () => {
    const invalidDims = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      name: "Mesa Lateral",
      referencePrice: 450,
      availabilityType: "IN_STOCK",
      heightMm: 0,
      widthMm: 500,
      depthMm: 500,
    });
    expect(invalidDims.error).toContain("dimensões em milímetros");
  });

  it("deve rejeitar id de variação na criação, pois o UUID é gerado pelo servidor", () => {
    const result = validateCreateProduct({
      categoryId: CAT_SALA_ID,
      supplierId: SUP_A_ID,
      name: "Mesa Lateral",
      referencePrice: 450,
      availabilityType: "IN_STOCK",
      heightMm: 500,
      widthMm: 500,
      depthMm: 500,
      variations: [
        { id: crypto.randomUUID(), name: "Carvalho", variationType: "WOOD" },
      ],
    });

    expect(result.value).toBeUndefined();
    expect(result.error).toContain("não é permitido na criação");
  });

  it("deve aceitar id de variação existente na atualização", () => {
    const result = validateUpdateProduct({
      variations: [
        { id: crypto.randomUUID(), name: "Carvalho", variationType: "WOOD" },
      ],
    });

    expect(result.error).toBeUndefined();
  });

  it("deve validar query params de listagem paginada e filtros", () => {
    const url = new URL(
      `http://localhost:3001/api/v1/produtos?page=2&limit=10&categoryId=${CAT_SALA_ID}&supplierId=${SUP_A_ID}&availabilityType=IN_STOCK&status=inactive&search=sofa`,
    );
    const filters = validateProductQuery(url);

    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(10);
    expect(filters.categoryId).toBe(CAT_SALA_ID);
    expect(filters.supplierId).toBe(SUP_A_ID);
    expect(filters.availabilityType).toBe("IN_STOCK");
    expect(filters.active).toBe(false);
    expect(filters.search).toBe("sofa");
  });

  it("deve ler a faixa de preço (minPrice/maxPrice) e ignorar valores inválidos", () => {
    const valid = validateProductQuery(
      new URL("http://localhost:3001/api/v1/produtos?minPrice=1000&maxPrice=2999.90"),
    );
    expect(valid.minPrice).toBe(1000);
    expect(valid.maxPrice).toBe(2999.9);

    const onlyMax = validateProductQuery(
      new URL("http://localhost:3001/api/v1/produtos?maxPrice=0"),
    );
    expect(onlyMax.minPrice).toBeUndefined();
    expect(onlyMax.maxPrice).toBe(0);

    const invalid = validateProductQuery(
      new URL("http://localhost:3001/api/v1/produtos?minPrice=-5&maxPrice=abc"),
    );
    expect(invalid.minPrice).toBeUndefined();
    expect(invalid.maxPrice).toBeUndefined();

    const empty = validateProductQuery(
      new URL("http://localhost:3001/api/v1/produtos?minPrice=&maxPrice=%20"),
    );
    expect(empty.minPrice).toBeUndefined();
    expect(empty.maxPrice).toBeUndefined();
  });

  it("deve rejeitar validateUpdateProduct vazio", () => {
    const res = validateUpdateProduct({});
    expect(res.error).toBeDefined();
  });
});

describe("CRUD de Produtos e Escopo Multi-Empresa por Fornecedor (US-BE-09)", () => {
  const adminActor = {
    id: "admin-1",
    email: "admin@emporio.com",
    role: ROLES.ADMIN,
  };
  const sellerActor = {
    id: "seller-1",
    email: "vendedor@emporio.com",
    role: ROLES.SELLER,
  };
  const customerActor = {
    id: "customer-1",
    email: "cliente@emporio.com",
    role: ROLES.CUSTOMER,
  };

  it("Administrador deve criar produto com variações e consultar detalhes completos", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    const created = await service.createProduct(
      {
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
        name: "Sofá Milano",
        referencePrice: 3890,
        availabilityType: "ON_DEMAND",
        estimatedDays: 20,
        heightMm: 920,
        widthMm: 2300,
        depthMm: 1050,
        specifications: { estrutura: "Eucalipto tratado" },
        variations: [
          {
            name: "Linho Cru",
            variationType: "FABRIC",
            colorsHex: ["#EAE0C8"],
            sortOrder: 0,
          },
        ],
      },
      adminActor,
    );

    expect(created.id).toBe(PROD_1_ID);
    expect(created.slug).toBe("sofa-milano");
    expect(created.variations).toHaveLength(1);
    expect(created.variations[0]!.name).toBe("Linho Cru");

    const detail = await service.getById(PROD_1_ID, adminActor);
    expect(detail.name).toBe("Sofá Milano");
    expect(detail.variations).toHaveLength(1);
  });

  it("deve rejeitar criação quando subtipo não pertence à categoria informada (400 Bad Request)", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    expect(
      service.createProduct(
        {
          categoryId: CAT_SALA_ID,
          subtypeId: SUB_CAMA_ID, // Pertence a CAT_QUARTO_ID
          supplierId: SUP_A_ID,
          name: "Produto Inválido",
          referencePrice: 1000,
          availabilityType: "IN_STOCK",
          estimatedDays: 0,
          heightMm: 500,
          widthMm: 500,
          depthMm: 500,
        },
        adminActor,
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("deve lançar ConflictError (409) para slug duplicado ativo e permitir reuso após soft delete", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    await service.createProduct(
      {
        categoryId: CAT_SALA_ID,
        supplierId: SUP_A_ID,
        name: "Mesa Jantar",
        slug: "mesa-jantar",
        referencePrice: 2000,
        availabilityType: "IN_STOCK",
        estimatedDays: 0,
        heightMm: 780,
        widthMm: 1800,
        depthMm: 900,
      },
      adminActor,
    );

    expect(
      service.createProduct(
        {
          categoryId: CAT_SALA_ID,
          supplierId: SUP_A_ID,
          name: "Mesa Jantar 2",
          slug: "mesa-jantar",
          referencePrice: 2100,
          availabilityType: "IN_STOCK",
          estimatedDays: 0,
          heightMm: 780,
          widthMm: 1800,
          depthMm: 900,
        },
        adminActor,
      ),
    ).rejects.toThrow(ConflictError);

    // Após soft delete, o mesmo slug pode ser reutilizado
    await service.deleteProduct(PROD_1_ID, adminActor);

    const recreated = await service.createProduct(
      {
        categoryId: CAT_SALA_ID,
        supplierId: SUP_A_ID,
        name: "Mesa Jantar Nova",
        slug: "mesa-jantar",
        referencePrice: 2200,
        availabilityType: "IN_STOCK",
        estimatedDays: 0,
        heightMm: 780,
        widthMm: 1800,
        depthMm: 900,
      },
      adminActor,
    );
    expect(recreated.slug).toBe("mesa-jantar");
  });

  it("Vendedor sem vínculo ativo (E1) deve receber 403 Forbidden em qualquer operação", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);
    // seller-1 não possui vínculos em sellerSuppliers

    expect(service.listPaginated({}, sellerActor)).rejects.toThrow(
      ForbiddenError,
    );
    expect(service.getById(PROD_1_ID, sellerActor)).rejects.toThrow(
      ForbiddenError,
    );
    expect(
      service.createProduct(
        {
          categoryId: CAT_SALA_ID,
          supplierId: SUP_A_ID,
          name: "Sofá",
          referencePrice: 1000,
          availabilityType: "IN_STOCK",
          estimatedDays: 0,
          heightMm: 800,
          widthMm: 1800,
          depthMm: 900,
        },
        sellerActor,
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("Vendedor vinculado às empresas A e B gerencia produtos de A e B, mas recebe 403 Forbidden para a empresa C (E2/E3)", async () => {
    const mockRepo = new MockProductsRepository();
    mockRepo.sellerSuppliers.set(sellerActor.id, [SUP_A_ID, SUP_B_ID]);
    const service = new ProductsService(mockRepo);

    // Produto da empresa A e produto da empresa C
    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
        name: "Sofá Empresa A",
      }),
    );
    mockRepo.products.set(
      PROD_2_ID,
      createDummyProduct({
        id: PROD_2_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_C_ID,
        name: "Sofá Empresa C",
      }),
    );

    // Listagem do vendedor retorna apenas produto da empresa A
    const listResult = await service.listPaginated({}, sellerActor);
    expect(listResult.data).toHaveLength(1);
    expect(listResult.data[0]!.id).toBe(PROD_1_ID);

    // Filtrar por supplierId da empresa C retorna 403 Forbidden (E2)
    expect(
      service.listPaginated({ supplierId: SUP_C_ID }, sellerActor),
    ).rejects.toThrow(ForbiddenError);

    // Criar produto para empresa C retorna 403 Forbidden (E2)
    expect(
      service.createProduct(
        {
          categoryId: CAT_SALA_ID,
          supplierId: SUP_C_ID,
          name: "Invasão Empresa C",
          referencePrice: 1500,
          availabilityType: "IN_STOCK",
          estimatedDays: 0,
          heightMm: 800,
          widthMm: 800,
          depthMm: 800,
        },
        sellerActor,
      ),
    ).rejects.toThrow(ForbiddenError);

    // Consultar, editar ou deletar produto da empresa C retorna 403 Forbidden (E3)
    expect(service.getById(PROD_2_ID, sellerActor)).rejects.toThrow(
      ForbiddenError,
    );
    expect(
      service.updateProduct(PROD_2_ID, { name: "Alterado" }, sellerActor),
    ).rejects.toThrow(ForbiddenError);
    expect(service.deleteProduct(PROD_2_ID, sellerActor)).rejects.toThrow(
      ForbiddenError,
    );

    // Tentar transferir produto da empresa A para a empresa C no PUT retorna 403 Forbidden
    expect(
      service.updateProduct(
        PROD_1_ID,
        { supplierId: SUP_C_ID },
        sellerActor,
      ),
    ).rejects.toThrow(ForbiddenError);

    // Atualizar produto da empresa A para a empresa B (ambas vinculadas) funciona
    const updated = await service.updateProduct(
      PROD_1_ID,
      { supplierId: SUP_B_ID, name: "Sofá Transferido para B" },
      sellerActor,
    );
    expect(updated.supplierId).toBe(SUP_B_ID);
    expect(updated.name).toBe("Sofá Transferido para B");
  });

  it("PUT deve sincronizar variações preservando IDs existentes, inserindo novas e aplicando soft delete nas omitidas", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
      }),
    );

    const now = new Date().toISOString();
    mockRepo.variations.set(VAR_1_ID, {
      id: VAR_1_ID,
      productId: PROD_1_ID,
      name: "Madeira Original",
      variationType: "WOOD",
      colorsHex: ["#5C4033"],
      sampleImageUrl: null,
      finishDetails: {},
      sortOrder: 0,
      inStock: true,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    });
    mockRepo.variations.set(VAR_2_ID, {
      id: VAR_2_ID,
      productId: PROD_1_ID,
      name: "Variação que será removida",
      variationType: "COLOR",
      colorsHex: ["#000000"],
      sampleImageUrl: null,
      finishDetails: {},
      sortOrder: 1,
      inStock: true,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    });

    const updated = await service.updateProduct(
      PROD_1_ID,
      {
        variations: [
          {
            id: VAR_1_ID,
            name: "Madeira Editada Mantendo ID",
            variationType: "WOOD",
            colorsHex: ["#8B5A2B"],
            sortOrder: 0,
          },
          {
            name: "Nova Variação Sem ID",
            variationType: "FABRIC",
            colorsHex: ["#FFFFFF"],
            sortOrder: 1,
          },
        ],
      },
      adminActor,
    );

    expect(updated.variations).toHaveLength(2);
    expect(updated.variations[0]!.id).toBe(VAR_1_ID);
    expect(updated.variations[0]!.name).toBe("Madeira Editada Mantendo ID");
    expect(updated.variations[1]!.name).toBe("Nova Variação Sem ID");
    expect(mockRepo.variations.get(VAR_2_ID)?.deleted).toBeTrue();
  });

  it("PUT deve rejeitar variação com id inexistente, inativo ou de outro produto (400 Bad Request)", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
      }),
    );

    expect(
      service.updateProduct(
        PROD_1_ID,
        {
          variations: [
            {
              id: VAR_1_ID,
              name: "Variação Estranha",
              variationType: "WOOD",
            },
          ],
        },
        adminActor,
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("PUT com availabilityType ON_DEMAND sem estimatedDays deve reaproveitar o prazo existente quando válido e rejeitar quando inválido", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
        availabilityType: "ON_DEMAND",
        estimatedDays: 18,
      }),
    );

    const validated = validateUpdateProduct({
      name: "Sofá Sob Encomenda Atualizado",
      availabilityType: "ON_DEMAND",
    });
    expect(validated.error).toBeUndefined();
    expect(validated.value?.estimatedDays).toBeUndefined();

    const updated = await service.updateProduct(
      PROD_1_ID,
      validated.value!,
      adminActor,
    );
    expect(updated.availabilityType).toBe("ON_DEMAND");
    expect(updated.estimatedDays).toBe(18);

    // Se o produto era IN_STOCK (estimatedDays = 0) e tentar mudar para ON_DEMAND sem informar estimatedDays, falha com 400
    mockRepo.products.set(
      PROD_2_ID,
      createDummyProduct({
        id: PROD_2_ID,
        categoryId: CAT_SALA_ID,
        subtypeId: SUB_SOFA_ID,
        supplierId: SUP_A_ID,
        availabilityType: "IN_STOCK",
        estimatedDays: 0,
      }),
    );

    expect(
      service.updateProduct(
        PROD_2_ID,
        { availabilityType: "ON_DEMAND" },
        adminActor,
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("Visitante e Cliente só devem visualizar produtos ativos (active = true)", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        active: true,
        name: "Ativo",
      }),
    );
    mockRepo.products.set(
      PROD_2_ID,
      createDummyProduct({
        id: PROD_2_ID,
        active: false,
        name: "Inativo",
      }),
    );

    const publicList = await service.listPaginated({ active: false }, undefined);
    expect(publicList.data).toHaveLength(1);
    expect(publicList.data[0]!.id).toBe(PROD_1_ID);

    const customerList = await service.listPaginated({}, customerActor);
    expect(customerList.data).toHaveLength(1);

    expect(service.getById(PROD_2_ID, undefined)).rejects.toThrow(
      NotFoundError,
    );
    expect(service.getById(PROD_2_ID, customerActor)).rejects.toThrow(
      NotFoundError,
    );

    // Admin vê o inativo normalmente
    const adminDetail = await service.getById(PROD_2_ID, adminActor);
    expect(adminDetail.id).toBe(PROD_2_ID);
  });

  it("listagem pública combina faixa de preço com os demais filtros, com limites inclusivos", async () => {
    const mockRepo = new MockProductsRepository();
    const service = new ProductsService(mockRepo);

    mockRepo.products.set(
      "prod-barato",
      createDummyProduct({ id: "prod-barato", referencePrice: 900 }),
    );
    mockRepo.products.set(
      "prod-limite",
      createDummyProduct({ id: "prod-limite", referencePrice: 1000 }),
    );
    mockRepo.products.set(
      "prod-encomenda",
      createDummyProduct({
        id: "prod-encomenda",
        referencePrice: 1500,
        availabilityType: "ON_DEMAND",
        estimatedDays: 20,
      }),
    );
    mockRepo.products.set(
      "prod-inativo",
      createDummyProduct({ id: "prod-inativo", referencePrice: 1200, active: false }),
    );

    const range = await service.listPaginated({ minPrice: 1000, maxPrice: 2000 });
    expect(range.data.map((p) => p.id).sort()).toEqual([
      "prod-encomenda",
      "prod-limite",
    ]);
    expect(range.pagination.total).toBe(2);

    const rangeInStock = await service.listPaginated({
      minPrice: 1000,
      maxPrice: 2000,
      availabilityType: "IN_STOCK",
    });
    expect(rangeInStock.data.map((p) => p.id)).toEqual(["prod-limite"]);

    const inverted = await service.listPaginated({ minPrice: 2000, maxPrice: 1000 });
    expect(inverted.data).toHaveLength(0);
  });

  it("Rotas HTTP de /api/v1/produtos devem aplicar RBAC (401/403 para Cliente em mutações)", async () => {
    const customerToken = await signJwt(customerActor);

    const res = await apiRouter.handle(
      new Request("http://localhost:3001/api/v1/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({}),
      }),
    );

    expect(res?.status).toBe(403);
  });
});

// Expõe os mapeadores do repositório real para conferir o contrato das imagens.
class ProductRowMapper extends ProductsRepository {
  product(row: ProductDbRow): ProductDto {
    return this.mapRow(row);
  }

  image(row: ProductImageDbRow): ProductImageDto {
    return this.mapImageRow(row);
  }

  variation(row: ProductVariationDbRow): ProductVariationDto {
    return this.mapVariationRow(row);
  }
}

describe("Imagens em arquivo: caminho no banco, URL na API (RNF02)", () => {
  const mapper = new ProductRowMapper();
  const createdAt = new Date("2026-10-15T12:00:00.000Z");

  it("toUploadUrl deve montar a URL pública a partir do caminho relativo gravado no banco", () => {
    expect(toUploadUrl(`products/${PROD_1_ID}/foto-thumb.webp`)).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_1_ID}/foto-thumb.webp`,
    );
    expect(toUploadUrl("/products//foto.webp")).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/foto.webp`,
    );
    expect(toUploadUrl("products/foto sala.webp")).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/foto%20sala.webp`,
    );
  });

  it("imagens do produto devem sair só com URLs, sem expor o caminho interno", () => {
    const dto = mapper.image({
      id: "img-1",
      product_id: PROD_1_ID,
      variation_id: VAR_1_ID,
      thumbnail_path: `products/${PROD_1_ID}/img-1-thumb.webp`,
      full_image_path: `products/${PROD_1_ID}/img-1-full.webp`,
      sort_order: 0,
      created_at: createdAt,
    });

    expect(dto).toEqual({
      id: "img-1",
      productId: PROD_1_ID,
      variationId: VAR_1_ID,
      thumbnailUrl: `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_1_ID}/img-1-thumb.webp`,
      fullImageUrl: `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_1_ID}/img-1-full.webp`,
      sortOrder: 0,
      createdAt: createdAt.toISOString(),
    });
  });

  it("amostra da variação deve sair como URL, ou null enquanto não houver arquivo", () => {
    const row: ProductVariationDbRow = {
      id: VAR_1_ID,
      product_id: PROD_1_ID,
      name: "Carvalho Mel",
      variation_type: "WOOD",
      colors_hex: ["#8B5A2B"],
      sample_image_path: `products/${PROD_1_ID}/amostra-carvalho.webp`,
      finish_details: {},
      sort_order: 0,
      in_stock: true,
      created_at: createdAt,
      updated_at: createdAt,
    };

    expect(mapper.variation(row).sampleImageUrl).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_1_ID}/amostra-carvalho.webp`,
    );
    expect(
      mapper.variation({ ...row, sample_image_path: null }).sampleImageUrl,
    ).toBeNull();
  });

  it("o JSON de variações não deve levar conteúdo de imagem para o DTO", () => {
    const result = validateUpdateProduct({
      variations: [
        {
          name: "Linho Cinza",
          variationType: "FABRIC",
          sampleImageBase64: "data:image/png;base64,iVBORw0KGgo=",
        },
      ],
    });

    expect(result.error).toBeUndefined();
    expect(result.value?.variations?.[0]).not.toHaveProperty(
      "sampleImageBase64",
    );
  });
});

describe("Autorização compartilhada de escrita em produto (assertCanManageProduct)", () => {
  const adminActor = {
    id: "admin-1",
    email: "admin@emporio.com",
    role: ROLES.ADMIN,
  };
  const sellerActor = {
    id: "seller-1",
    email: "vendedor@emporio.com",
    role: ROLES.SELLER,
  };
  const unlinkedSellerActor = {
    id: "seller-sem-vinculo",
    email: "novo@emporio.com",
    role: ROLES.SELLER,
  };

  function buildRepo(): MockProductsRepository {
    const mockRepo = new MockProductsRepository();
    mockRepo.sellerSuppliers.set(sellerActor.id, [SUP_A_ID]);
    mockRepo.products.set(
      PROD_1_ID,
      createDummyProduct({
        id: PROD_1_ID,
        supplierId: SUP_A_ID,
        active: false,
        name: "Produto A (inativo)",
      }),
    );
    mockRepo.products.set(
      PROD_2_ID,
      createDummyProduct({ id: PROD_2_ID, supplierId: SUP_B_ID }),
    );
    return mockRepo;
  }

  it("Administrador opera qualquer produto, inclusive inativo, e recebe o produto de volta", async () => {
    const service = new ProductsService(buildRepo());

    const product = await service.assertCanManageProduct(PROD_1_ID, adminActor);
    expect(product.id).toBe(PROD_1_ID);
    expect(product.active).toBeFalse();

    const other = await service.assertCanManageProduct(PROD_2_ID, adminActor);
    expect(other.supplierId).toBe(SUP_B_ID);
  });

  it("produto inexistente ou desativado (deleted_at) responde 404 Not Found", async () => {
    const mockRepo = buildRepo();
    mockRepo.products.set(
      "deleted-1",
      createDummyProduct({ id: "deleted-1", supplierId: SUP_A_ID, deleted: true }),
    );
    const service = new ProductsService(mockRepo);

    await expect(
      service.assertCanManageProduct("nao-existe", adminActor),
    ).rejects.toThrow(NotFoundError);
    await expect(
      service.assertCanManageProduct("deleted-1", sellerActor),
    ).rejects.toThrow(NotFoundError);
  });

  it("Vendedor vinculado ao fornecedor do produto é autorizado", async () => {
    const service = new ProductsService(buildRepo());

    const product = await service.assertCanManageProduct(PROD_1_ID, sellerActor);
    expect(product.supplierId).toBe(SUP_A_ID);
  });

  it("Vendedor de outro fornecedor recebe 403 Forbidden (E2/E3) com a mensagem do PRD", async () => {
    const service = new ProductsService(buildRepo());

    const attempt = service.assertCanManageProduct(PROD_2_ID, sellerActor);
    await expect(attempt).rejects.toThrow(ForbiddenError);
    await expect(attempt).rejects.toThrow(
      "Você não possui autorização para gerenciar produtos deste fornecedor.",
    );
  });

  it("Vendedor sem vínculo ativo recebe 403 Forbidden (E1) antes de qualquer consulta ao produto", async () => {
    const service = new ProductsService(buildRepo());

    const attempt = service.assertCanManageProduct(PROD_1_ID, unlinkedSellerActor);
    await expect(attempt).rejects.toThrow(ForbiddenError);
    await expect(attempt).rejects.toThrow(
      "Vendedor sem vínculo ativo com nenhuma empresa não possui permissão para gerenciar produtos.",
    );
    // Mesmo para produto inexistente, a resposta é 403 e não 404.
    await expect(
      service.assertCanManageProduct("nao-existe", unlinkedSellerActor),
    ).rejects.toThrow(ForbiddenError);
  });

  it("PUT e DELETE continuam usando a mesma regra (E1, E2/E3 e 404)", async () => {
    const service = new ProductsService(buildRepo());

    await expect(
      service.updateProduct(PROD_2_ID, { name: "x" }, sellerActor),
    ).rejects.toThrow(ForbiddenError);
    await expect(service.deleteProduct(PROD_2_ID, sellerActor)).rejects.toThrow(
      ForbiddenError,
    );
    await expect(
      service.updateProduct(PROD_1_ID, { name: "x" }, unlinkedSellerActor),
    ).rejects.toThrow(ForbiddenError);
    await expect(service.deleteProduct("nao-existe", adminActor)).rejects.toThrow(
      NotFoundError,
    );

    const updated = await service.updateProduct(
      PROD_1_ID,
      { name: "Produto A editado" },
      sellerActor,
    );
    expect(updated.name).toBe("Produto A editado");
  });
});

describe("Capa da listagem (thumbnailUrl) no mapeador de produto", () => {
  const mapper = new ProductRowMapper();
  const createdAt = new Date("2026-10-15T12:00:00.000Z");
  const row: ProductDbRow = {
    id: PROD_1_ID,
    category_id: CAT_SALA_ID,
    subtype_id: null,
    supplier_id: SUP_A_ID,
    name: "Sofá Milano",
    slug: "sofa-milano",
    collection_line: null,
    main_material: null,
    reference_price: "3890.00",
    max_installments: 10,
    availability_type: "IN_STOCK",
    estimated_days: 0,
    height_mm: 900,
    width_mm: 2200,
    depth_mm: 1000,
    description: null,
    specifications: null,
    active: true,
    created_at: createdAt,
    updated_at: createdAt,
  };

  it("converte o caminho da capa em URL pública", () => {
    const dto = mapper.product({
      ...row,
      cover_thumbnail_path: `products/${PROD_1_ID}/img-1-thumb.webp`,
    });
    expect(dto.thumbnailUrl).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_1_ID}/img-1-thumb.webp`,
    );
    expect(dto).not.toHaveProperty("fullImageUrl");
    expect(dto).not.toHaveProperty("images");
  });

  it("devolve null sem foto ativa ou quando a consulta não traz a capa", () => {
    expect(mapper.product({ ...row, cover_thumbnail_path: null }).thumbnailUrl).toBeNull();
    expect(mapper.product(row).thumbnailUrl).toBeNull();
  });
});
