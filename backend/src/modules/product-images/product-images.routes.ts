import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { productImagesController } from "@/modules/product-images/product-images.controller";

// Montado em /produtos, ao lado de productsRoutes. Toda rota de escrita de
// imagem exige Vendedor (role = 2) ou Admin (role = 3); o escopo por fornecedor
// é conferido pelo serviço, antes de qualquer leitura do arquivo enviado.
export const productImagesRoutes = new Router();

productImagesRoutes.post(
  "/:id/imagens",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productImagesController.upload(req, ctx),
);

productImagesRoutes.delete(
  "/:id/imagens/:imageId",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productImagesController.delete(req, ctx),
);

productImagesRoutes.put(
  "/:id/variacoes/:variationId/amostra",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productImagesController.putSample(req, ctx),
);

productImagesRoutes.delete(
  "/:id/variacoes/:variationId/amostra",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => productImagesController.deleteSample(req, ctx),
);

export default productImagesRoutes;
