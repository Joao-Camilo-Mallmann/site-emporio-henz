import { Router } from "@/lib/router";
import { attachUserIfAuthenticated, authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/rbac";
import { productsController } from "@/modules/products/products.controller";

export const productsRoutes = new Router();

// Leitura de produtos: Pública (Visitantes e Clientes veem apenas ativos;
// Vendedor vê apenas de seus fornecedores vinculados; Admin vê todos).
productsRoutes.get("/", attachUserIfAuthenticated, (req, ctx) =>
  productsController.list(req, ctx),
);

// Endpoint público de recomendações: GET /api/v1/produtos/:id/recomendados
productsRoutes.get("/:id/recomendados", (req, ctx) =>
  productsController.getRecommendations(req, ctx),
);

productsRoutes.get("/:id", attachUserIfAuthenticated, (req, ctx) =>
  productsController.getById(req, ctx),
);

// Mutações de produtos: Restritas a Vendedor (role = 2, validado por user_suppliers) e Admin (role = 3)
productsRoutes.post(
  "/",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productsController.create(req, ctx),
);

productsRoutes.put(
  "/:id",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productsController.update(req, ctx),
);

productsRoutes.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productsController.delete(req, ctx),
);

export default productsRoutes;
