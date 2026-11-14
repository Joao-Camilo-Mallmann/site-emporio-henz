import { describe, expect, it } from "bun:test";
import { Router, type RouteHandler } from "@/lib/router";
import { ForbiddenError } from "@/lib/errors";
import { created, ok } from "@/lib/response";
import { requireRole, ROLES } from "@/middlewares/rbac";
import { ProductsRepository } from "@/modules/products/products.repository";
import { ProductsService } from "@/modules/products/products.service";
import type { ManageableProduct } from "@/modules/products/products.types";

function withUser(role: number): RouteHandler {
  return (_req, ctx) => {
    ctx.user = {
      id: `user-${role}`,
      email: `user-${role}@example.com`,
      role,
    };
  };
}

async function requestProtectedRoute(
  role: number,
  allowedRoles: number[],
  status: 200 | 201 = 200,
): Promise<Response> {
  const router = new Router();
  router.post(
    "/protected",
    withUser(role),
    requireRole(...allowedRoles),
    () =>
      status === 201
        ? created({ success: true })
        : ok({ success: true }),
  );

  const response = await router.handle(
    new Request("http://localhost/protected", { method: "POST" }),
  );
  if (!response) {
    throw new Error("Protected test route was not found.");
  }
  return response;
}

class StubProductsRepository extends ProductsRepository {
  constructor(
    private readonly sellerId: string,
    private readonly supplierIds: string[],
    private readonly product: ManageableProduct | null,
  ) {
    super();
  }

  override async findActiveSupplierIdsByUserId(
    userId: string,
  ): Promise<string[]> {
    expect(userId).toBe(this.sellerId);
    return this.supplierIds;
  }

  override async findManageableById(
    productId: string,
  ): Promise<ManageableProduct | null> {
    return this.product?.id === productId ? this.product : null;
  }
}

describe("RBAC middleware", () => {
  it("blocks customers from administrative routes with the standard 403 response", async () => {
    const response = await requestProtectedRoute(ROLES.CUSTOMER, [
      ROLES.ADMIN,
    ]);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Forbidden",
      message: "Você não possui permissão para executar esta ação.",
    });
  });

  it("blocks sellers from changing suppliers", async () => {
    const response = await requestProtectedRoute(ROLES.SELLER, [ROLES.ADMIN]);

    expect(response.status).toBe(403);
  });

  it("allows sellers on authorized product routes", async () => {
    const response = await requestProtectedRoute(
      ROLES.SELLER,
      [ROLES.SELLER, ROLES.ADMIN],
      201,
    );

    expect(response.status).toBe(201);
  });

  it("allows administrators regardless of the route's allowed roles", async () => {
    const response = await requestProtectedRoute(ROLES.ADMIN, []);

    expect(response.status).toBe(200);
  });
});

describe("seller product supplier scope", () => {
  const sellerUser = {
    id: "seller-id",
    email: "seller@example.com",
    role: ROLES.SELLER,
  };

  it("denies product management when the seller has no active supplier link", async () => {
    const service = new ProductsService(
      new StubProductsRepository("seller-id", [], {
        id: "product-id",
        supplierId: "supplier-a",
        active: true,
      }),
    );

    await expect(
      service.assertCanManageProduct("product-id", sellerUser),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("denies products belonging to a supplier outside the seller's links", async () => {
    const service = new ProductsService(
      new StubProductsRepository("seller-id", ["supplier-a"], {
        id: "product-id",
        supplierId: "supplier-b",
        active: true,
      }),
    );

    await expect(
      service.assertCanManageProduct("product-id", sellerUser),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows products belonging to a linked supplier", async () => {
    const product: ManageableProduct = {
      id: "product-id",
      supplierId: "supplier-a",
      active: true,
    };
    const service = new ProductsService(
      new StubProductsRepository("seller-id", ["supplier-a"], product),
    );

    await expect(
      service.assertCanManageProduct("product-id", sellerUser),
    ).resolves.toEqual(product);
  });
});
