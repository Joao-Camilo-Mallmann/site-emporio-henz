import { ok } from "@/lib/response";
import { Router } from "@/lib/router";

import { authRoutes } from "@/modules/auth/auth.routes";
import { suppliersRoutes } from "@/modules/suppliers/suppliers.routes";
import { userSuppliersRoutes } from "@/modules/user-suppliers/user-suppliers.routes";
import { usersRoutes } from "@/modules/users/users.routes";

export const apiRouter = new Router({ prefix: "/api/v1" });

// Monta subrotas da V1
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/users", userSuppliersRoutes);
apiRouter.use("/suppliers", suppliersRoutes);

// Health check padrão V1
apiRouter.get("/health", () => {
  return ok({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default apiRouter;
