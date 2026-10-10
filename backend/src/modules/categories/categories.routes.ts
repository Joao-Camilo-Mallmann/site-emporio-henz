import { Router } from "@/lib/router";
import { authMiddleware, attachUserIfAuthenticated } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { categoriesController } from "./categories.controller";

export const categoriesRoutes = new Router();

// Leitura de categorias: Pública (Listagem paginada com subtipos e busca por ID).
// Registros inativos só são retornados quando o token é de Administrador.
categoriesRoutes.get("/", attachUserIfAuthenticated, (req, ctx) =>
  categoriesController.list(req, ctx),
);
categoriesRoutes.get("/:id", attachUserIfAuthenticated, (req, ctx) =>
  categoriesController.getCategoryById(req, ctx),
);

// Mutações de categorias: Exclusivas de Administrador (role = 3)
categoriesRoutes.post("/", authMiddleware, requireRole(ROLES.ADMIN), (req) =>
  categoriesController.createCategory(req),
);

categoriesRoutes.put(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => categoriesController.updateCategory(req, ctx),
);

categoriesRoutes.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => categoriesController.deleteCategory(req, ctx),
);

export default categoriesRoutes;
