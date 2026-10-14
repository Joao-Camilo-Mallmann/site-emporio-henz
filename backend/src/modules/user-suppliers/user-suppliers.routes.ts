import { BadRequestError, NotFoundError } from "@/lib/errors";
import { Router } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { userSuppliersController } from "@/modules/user-suppliers/user-suppliers.controller";
import { usersController } from "@/modules/users/users.controller";
import { usersRepository } from "@/modules/users/users.repository";
import { UserDto } from "@/modules/users/users.types";

/**
 * Valida se o ID fornecido pertence a um usuário ativo com papel de Vendedor (role = 2).
 * Lança NotFoundError (404) caso o usuário não exista, esteja soft-deleted ou não seja Vendedor.
 */
export async function requireSellerById(userId: string): Promise<UserDto> {
    if (!isValidUuid(userId)) {
    throw new BadRequestError("ID de vendedor inválido.");
  }
  const user = await usersRepository.findById(userId);
  if (!user || user.role !== ROLES.SELLER) {
    throw new NotFoundError("Vendedor não encontrado.");
  }
  return user;
}

// Rotas legadas montadas em /api/v1/users/:userId/suppliers
export const userSuppliersRoutes = new Router();

userSuppliersRoutes.get(
  "/:userId/suppliers",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.list(req, ctx),
);

userSuppliersRoutes.post(
  "/:userId/suppliers",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.assign(req, ctx),
);

userSuppliersRoutes.delete(
  "/:userId/suppliers/:supplierId",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.revoke(req, ctx),
);

// Rotas orientadas ao vendedor montadas em /api/v1/vendedores
export const vendedoresRoutes = new Router();

// GET /api/v1/vendedores — Lista paginada de vendedores ativos (ADMIN apenas)
vendedoresRoutes.get(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => usersController.listSellers(req, ctx),
);

// GET /api/v1/vendedores/:id/fornecedores — Lista fornecedores vinculados (ADMIN apenas, 404 para não vendedor)
vendedoresRoutes.get(
  "/:id/fornecedores",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  async (req, ctx) => {
    await requireSellerById(ctx.params.id);
    ctx.params.userId = ctx.params.id;
    return userSuppliersController.list(req, ctx);
  },
);

// POST /api/v1/vendedores/:id/fornecedores — Vincula vendedor a fornecedor (ADMIN apenas, 404 para não vendedor)
vendedoresRoutes.post(
  "/:id/fornecedores",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  async (req, ctx) => {
    await requireSellerById(ctx.params.id);
    ctx.params.userId = ctx.params.id;
    return userSuppliersController.assign(req, ctx);
  },
);

// DELETE /api/v1/vendedores/:id/fornecedores/:supplierId — Desvincula vendedor de fornecedor (ADMIN apenas, 404 para não vendedor)
vendedoresRoutes.delete(
  "/:id/fornecedores/:supplierId",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  async (req, ctx) => {
    await requireSellerById(ctx.params.id);
    ctx.params.userId = ctx.params.id;
    return userSuppliersController.revoke(req, ctx);
  },
);

export default vendedoresRoutes;
