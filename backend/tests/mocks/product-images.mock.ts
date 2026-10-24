import { ROLES } from "@/middlewares/role";
import {
  ProductImagesRepository,
} from "@/modules/product-images/product-images.repository";
import { InsertProductImageInput } from "@/modules/product-images/product-images.types";
import { ProductsRepository } from "@/modules/products/products.repository";
import {
  ProductDto,
  ProductImageDto,
  ProductVariationDto,
} from "@/modules/products/products.types";

export const SUP_A_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

export const SUP_B_ID = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";

export const PROD_A_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";

export const PROD_B_ID = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";

export const PROD_DELETED_ID = "11111111-2222-4333-8444-555555555555";

export const VAR_A_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";

export const VAR_B_ID = "99999999-9999-4999-a999-999999999999";

export const VAR_A_DELETED_ID = "77777777-7777-4777-a777-777777777777";

export const adminActor = { id: "admin-1", email: "admin@emporio.com", role: ROLES.ADMIN };

export const sellerActor = { id: "seller-1", email: "vendedor@emporio.com", role: ROLES.SELLER };

export const unlinkedSellerActor = { id: "seller-2", email: "novo@emporio.com", role: ROLES.SELLER };

export const customerActor = { id: "customer-1", email: "cliente@emporio.com", role: ROLES.CUSTOMER };

export function product(id: string, supplierId: string): ProductDto {
  const now = new Date().toISOString();
  return {
    id,
    categoryId: "11111111-1111-4111-a111-111111111111",
    subtypeId: null,
    supplierId,
    name: `Produto ${id.slice(0, 4)}`,
    slug: `produto-${id.slice(0, 4)}`,
    collectionLine: null,
    mainMaterial: null,
    referencePrice: 1000,
    maxInstallments: 1,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 100,
    widthMm: 100,
    depthMm: 100,
    description: null,
    specifications: {},
    active: true,
    thumbnailUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function variation(id: string, productId: string): ProductVariationDto {
  const now = new Date().toISOString();
  return {
    id,
    productId,
    name: "Carvalho",
    variationType: "WOOD",
    colorsHex: [],
    sampleImageUrl: null,
    finishDetails: {},
    sortOrder: 0,
    inStock: true,
    createdAt: now,
    updatedAt: now,
  };
}

// Só o necessário para assertCanManageProduct: produto ativo e vínculos do vendedor.
export class FakeProductsRepository extends ProductsRepository {
  products: ProductDto[] = [
    product(PROD_A_ID, SUP_A_ID),
    product(PROD_B_ID, SUP_B_ID),
  ];
  sellerSuppliers: { userId: string; supplierId: string }[] = [
    { userId: sellerActor.id, supplierId: SUP_A_ID },
  ];

  async findManageableById(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async findActiveSupplierIdsByUserId(userId: string): Promise<string[]> {
    return this.sellerSuppliers
      .filter((l) => l.userId === userId)
      .map((l) => l.supplierId);
  }
}

export class FakeProductImagesRepository extends ProductImagesRepository {
  variations: (ProductVariationDto & { deleted: boolean })[] = [
    { ...variation(VAR_A_ID, PROD_A_ID), deleted: false },
    { ...variation(VAR_A_DELETED_ID, PROD_A_ID), deleted: true },
    { ...variation(VAR_B_ID, PROD_B_ID), deleted: false },
  ];
  images: (ProductImageDto & { deleted: boolean; thumbnailPath: string })[] = [];
  failInsert = false;
  insertCalls = 0;

  async findActiveVariation(productId: string, variationId: string) {
    const v = this.variations.find((v) => v.id === variationId);
    if (!v || v.deleted || v.productId !== productId) return null;
    const { deleted, ...dto } = v;
    void deleted;
    return dto;
  }

  async insertImage(input: InsertProductImageInput): Promise<ProductImageDto> {
    this.insertCalls++;
    if (this.failInsert) {
      throw new Error("connection refused");
    }
    const active = this.images.filter((i) => i.productId === input.productId && !i.deleted);
    const sortOrder = active.reduce((max, i) => Math.max(max, i.sortOrder), -1) + 1;
    const dto: ProductImageDto = {
      id: input.id,
      productId: input.productId,
      variationId: input.variationId,
      thumbnailUrl: `/api/v1/uploads/${input.thumbnailPath}`,
      fullImageUrl: `/api/v1/uploads/${input.fullImagePath}`,
      sortOrder,
      createdAt: new Date().toISOString(),
    };
    this.images.push({ ...dto, deleted: false, thumbnailPath: input.thumbnailPath });
    return dto;
  }

  async softDeleteImage(productId: string, imageId: string): Promise<boolean> {
    const img = this.images.find((i) => i.id === imageId);
    if (!img || img.deleted || img.productId !== productId) return false;
    img.deleted = true;
    return true;
  }

  async updateVariationSample(productId: string, variationId: string, samplePath: string | null) {
    const v = this.variations.find((v) => v.id === variationId);
    if (!v || v.deleted || v.productId !== productId) return null;
    v.sampleImageUrl = samplePath ? `/api/v1/uploads/${samplePath}` : null;
    const { deleted, ...dto } = v;
    void deleted;
    return dto;
  }
}
