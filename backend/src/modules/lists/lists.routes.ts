import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { listsController } from "@/modules/lists/lists.controller";

export const listsRoutes = new Router();

// Pública (link compartilhado, somente leitura). Fica antes das rotas com :id.
listsRoutes.get("/compartilhadas/:shareSlug", (req, ctx) =>
  listsController.getShared(req, ctx),
);

// Demais rotas: o cliente autenticado só enxerga as próprias listas
listsRoutes.get("/", authMiddleware, (req, ctx) =>
  listsController.list(req, ctx),
);

listsRoutes.post("/", authMiddleware, (req, ctx) =>
  listsController.create(req, ctx),
);

listsRoutes.get("/:id", authMiddleware, (req, ctx) =>
  listsController.getById(req, ctx),
);

listsRoutes.patch("/:id", authMiddleware, (req, ctx) =>
  listsController.rename(req, ctx),
);

listsRoutes.delete("/:id", authMiddleware, (req, ctx) =>
  listsController.remove(req, ctx),
);

listsRoutes.post("/:id/itens", authMiddleware, (req, ctx) =>
  listsController.addItem(req, ctx),
);

listsRoutes.delete("/:id/itens/:itemId", authMiddleware, (req, ctx) =>
  listsController.removeItem(req, ctx),
);

export default listsRoutes;
