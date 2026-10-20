import { badRequest, created, ok, unauthorized } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import {
  productImagesService,
  ProductImagesService,
} from "@/modules/product-images/product-images.service";

const INVALID_PRODUCT_ID_MESSAGE = "Identificador do produto inválido.";
const INVALID_IMAGE_ID_MESSAGE = "Identificador da foto inválido.";
const INVALID_VARIATION_ID_MESSAGE = "Identificador da variação inválido.";

export class ProductImagesController {
  constructor(private service: ProductImagesService = productImagesService) {}

  // POST /produtos/:id/imagens
  async upload(req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_PRODUCT_ID_MESSAGE);
    }

    const image = await this.service.uploadProductImage(id, ctx.user, req);
    return created(image);
  }

  // DELETE /produtos/:id/imagens/:imageId
  async delete(_req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id, imageId } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_PRODUCT_ID_MESSAGE);
    }
    if (!imageId || !isValidUuid(imageId)) {
      return badRequest(INVALID_IMAGE_ID_MESSAGE);
    }

    await this.service.deleteProductImage(id, imageId, ctx.user);
    return ok({ message: "Foto removida com sucesso." });
  }

  // PUT /produtos/:id/variacoes/:variationId/amostra
  async putSample(req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id, variationId } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_PRODUCT_ID_MESSAGE);
    }
    if (!variationId || !isValidUuid(variationId)) {
      return badRequest(INVALID_VARIATION_ID_MESSAGE);
    }

    const variation = await this.service.putVariationSample(
      id,
      variationId,
      ctx.user,
      req,
    );
    return ok(variation);
  }

  // DELETE /produtos/:id/variacoes/:variationId/amostra
  async deleteSample(_req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id, variationId } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_PRODUCT_ID_MESSAGE);
    }
    if (!variationId || !isValidUuid(variationId)) {
      return badRequest(INVALID_VARIATION_ID_MESSAGE);
    }

    const variation = await this.service.deleteVariationSample(
      id,
      variationId,
      ctx.user,
    );
    return ok(variation);
  }
}

export const productImagesController = new ProductImagesController();
export default productImagesController;
