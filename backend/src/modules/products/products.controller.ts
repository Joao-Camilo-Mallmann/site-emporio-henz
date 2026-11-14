import { badRequest, created, ok, unauthorized } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import {
  validateCreateProduct,
  validateProductQuery,
  validateUpdateProduct,
} from "@/modules/products/products.schema";
import {
  productsService,
  ProductsService,
} from "@/modules/products/products.service";

const INVALID_ID_MESSAGE = "Identificador do produto inválido.";

export class ProductsController {
  constructor(private service: ProductsService = productsService) {}

  async list(req: Request, ctx: RequestContext): Promise<Response> {
    const filters = validateProductQuery(new URL(req.url));
    const result = await this.service.listPaginated(filters, ctx.user);
    return ok(result);
  }

  async getByIdOrSlug(_req: Request, ctx: RequestContext): Promise<Response> {
    const product = await this.service.getById(ctx.params.id ?? "", ctx.user);
    return ok(product);
  }

  async create(req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, field, errors, value } = validateCreateProduct(body);
    if (error || !value) {
      return badRequest(
        error || "Dados do produto inválidos.",
        field || errors ? { field, errors } : undefined,
      );
    }

    const product = await this.service.createProduct(value, ctx.user);
    return created(product);
  }

  async update(req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, field, errors, value } = validateUpdateProduct(body);
    if (error || !value) {
      return badRequest(
        error || "Dados de atualização do produto inválidos.",
        field || errors ? { field, errors } : undefined,
      );
    }

    const product = await this.service.updateProduct(id, value, ctx.user);
    return ok(product);
  }

  async delete(_req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const { id } = ctx.params;
    if (!id || !isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    await this.service.deleteProduct(id, ctx.user);
    return ok({ message: "Produto desativado com sucesso." });
  }

  async getRecommendations(
    _req: Request,
    ctx: RequestContext,
  ): Promise<Response> {
    const recommendations = await this.service.getRecommendations(
      ctx.params.id ?? "",
    );
    return ok(recommendations);
  }
}

export const productsController = new ProductsController();
export default productsController;
