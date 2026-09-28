import { badRequest, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import {
  productsService,
  ProductsService,
} from "@/modules/products/products.service";

export class ProductsController {
  constructor(private service: ProductsService = productsService) {}

  async getRecommendations(
    _req: Request,
    ctx: RequestContext,
  ): Promise<Response> {
    const { id } = ctx.params;
    if (!id || id.trim() === "") {
      return badRequest("Identificador do produto inválido.");
    }

    const recommendations = await this.service.getRecommendations(id);
    return ok(recommendations);
  }
}

export const productsController = new ProductsController();
export default productsController;
