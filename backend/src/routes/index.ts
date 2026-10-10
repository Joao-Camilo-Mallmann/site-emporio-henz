import { ok } from "@/lib/response";
import { Router } from "@/lib/router";

import { authRoutes } from "@/modules/auth/auth.routes";
import { categoriesRoutes } from "@/modules/categories/categories.routes";
import { productsRoutes } from "@/modules/products/products.routes";
import { subtypesRoutes } from "@/modules/subtypes/subtypes.routes";
import { suppliersRoutes } from "@/modules/suppliers/suppliers.routes";
import { userSuppliersRoutes } from "@/modules/user-suppliers/user-suppliers.routes";
import { usersRoutes } from "@/modules/users/users.routes";

export const apiRouter = new Router({ prefix: "/api/v1" });

// Monta subrotas da V1
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/users", userSuppliersRoutes);
apiRouter.use("/suppliers", suppliersRoutes);
apiRouter.use("/categorias", categoriesRoutes);
apiRouter.use("/subtipos", subtypesRoutes);
apiRouter.use("/produtos", productsRoutes);

// Health check padrão V1
apiRouter.get("/health", () => {
  return ok({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default apiRouter;
