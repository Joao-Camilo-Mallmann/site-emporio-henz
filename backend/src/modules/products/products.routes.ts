import { Router } from "@/lib/router";
import { productsController } from "@/modules/products/products.controller";

export const productsRoutes = new Router();

// Endpoint público de recomendações: GET /api/v1/produtos/:id/recomendados
productsRoutes.get("/:id/recomendados", (req, ctx) =>
  productsController.getRecommendations(req, ctx),
);

export default productsRoutes;
