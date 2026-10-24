import { BadRequestError } from "@/lib/errors";
import { paginate, resolvePagination } from "@/lib/pagination";
import { ProductsRepository } from "@/modules/products/products.repository";
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

export const CAT_SALA_ID = "11111111-1111-4111-a111-111111111111";

export const CAT_QUARTO_ID = "22222222-2222-4222-a222-222222222222";

export const SUB_SOFA_ID = "33333333-3333-4333-a333-333333333333";

export const SUB_CAMA_ID = "44444444-4444-4444-a444-444444444444";

export const SUP_A_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

export const SUP_B_ID = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";

export const SUP_C_ID = "cccccccc-cccc-4ccc-accc-cccccccccccc";

export const PROD_1_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";

export const PROD_2_ID = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";

export const VAR_1_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";

export const VAR_2_ID = "99999999-9999-4999-a999-999999999999";

export class MockProductsRepository extends ProductsRepository {
  public products: (ProductDto & { deleted: boolean })[] = [];
  public variations: (ProductVariationDto & { deleted: boolean })[] = [];
  public images: (ProductImageDto & { deleted: boolean })[] = [];
  public categories: string[] = [
    CAT_SALA_ID,
    CAT_QUARTO_ID,
    "cat-sala",
    "cat-quarto",
  ];
  public subtypes: { id: string; categoryId: string }[] = [
    { id: SUB_SOFA_ID, categoryId: CAT_SALA_ID },
    { id: SUB_CAMA_ID, categoryId: CAT_QUARTO_ID },
    { id: "sub-sofa", categoryId: "cat-sala" },
  ];
  public suppliers: string[] = [SUP_A_ID, SUP_B_ID, SUP_C_ID, "sup-henz"];
  public sellerSuppliers: { userId: string; supplierId: string }[] = [];

  async listPaginated(
    filters: ProductQueryFilters = {},
  ): Promise<PaginatedProductsResult> {
    const { page, limit, offset } = resolvePagination(filters);

    if (filters.supplierIds && filters.supplierIds.length === 0) {
      return paginate([], 0, { page, limit });
    }

    const search = filters.search?.toLowerCase();

    const filtered = this.products.filter((p) => {
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
    const p = this.products.find((p) => p.id === id);
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

    const variations = this.variations
      .filter((v) => v.productId === id && !v.deleted)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ deleted, ...v }) => {
        void deleted;
        return v;
      });

    const images = this.images
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
    return this.products
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
    return this.products.some(
      (p) => !p.deleted && p.slug === slug && p.id !== excludeId,
    );
  }

  async findActiveSupplierIdsByUserId(userId: string): Promise<string[]> {
    return this.sellerSuppliers
      .filter((l) => l.userId === userId)
      .map((l) => l.supplierId);
  }

  async existsActiveCategory(categoryId: string): Promise<boolean> {
    return this.categories.includes(categoryId);
  }

  async findActiveSubtypeCategoryId(subtypeId: string): Promise<string | null> {
    return this.subtypes.find((s) => s.id === subtypeId)?.categoryId ?? null;
  }

  async existsActiveSupplier(supplierId: string): Promise<boolean> {
    return this.suppliers.includes(supplierId);
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
    this.products.push(product);

    if (data.variations) {
      data.variations.forEach((v, idx) => {
        const varId =
          v.id ||
          `00000000-0000-4000-a000-${String(idx + 1).padStart(12, "0")}`;
        this.variations.push({
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
    const existing = this.products.find((p) => p.id === id);
    if (!existing || existing.deleted) return null;

    const now = new Date().toISOString();
    Object.assign(existing, {
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
    });

    if (data.variations !== undefined) {
      const activeExistingIds = new Set(
        this.variations
          .filter((v) => v.productId === id && !v.deleted)
          .map((v) => v.id),
      );

      const keptIds = new Set<string>();
      data.variations.forEach((item) => {
        if (item.id) {
          if (!activeExistingIds.has(item.id)) {
            throw new BadRequestError(
              `A variação '${item.id}' não pertence a este produto ou foi removida.`,
            );
          }
          keptIds.add(item.id);
        }
      });

      activeExistingIds.forEach((existingId) => {
        if (!keptIds.has(existingId)) {
          this.variations.find((v) => v.id === existingId)!.deleted = true;
        }
      });

      data.variations.forEach((v, idx) => {
        if (v.id) {
          const current = this.variations.find((x) => x.id === v.id)!;
          Object.assign(current, {
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
          this.variations.push({
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
    const existing = this.products.find((p) => p.id === id);
    if (!existing || existing.deleted) return false;

    existing.deleted = true;
    this.variations.forEach((v) => {
      if (v.productId === id && !v.deleted) {
        v.deleted = true;
      }
    });
    this.images.forEach((img) => {
      if (img.productId === id && !img.deleted) {
        img.deleted = true;
      }
    });
    return true;
  }
}

export function createDummyProduct(
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

// Expõe os mapeadores do repositório real para conferir o contrato das imagens.
export class ProductRowMapper extends ProductsRepository {
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
