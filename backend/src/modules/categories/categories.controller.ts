import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import { isAdmin } from "@/middlewares/role";
import {
  validateCategoryQuery,
  validateCreateCategory,
  validateUpdateCategory,
} from "./categories.schema";
import { categoriesService, CategoriesService } from "./categories.service";

const INVALID_ID_MESSAGE = "Identificador da categoria inválido.";

export class CategoriesController {
  constructor(private service: CategoriesService = categoriesService) {}

  async list(req: Request, ctx: RequestContext): Promise<Response> {
    const url = new URL(req.url);
    const hasPaginationParams =
      url.searchParams.has("page") ||
      url.searchParams.has("limit") ||
      url.searchParams.has("search");

    if (hasPaginationParams) {
      const filters = validateCategoryQuery(url);
      const paginated = await this.service.listPaginated(filters, isAdmin(ctx));
      return ok(paginated);
    }

    const categories = await this.service.listHierarchy();
    return ok(categories);
  }

  async getCategoryById(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    const category = await this.service.getCategoryById(id, isAdmin(ctx));
    return ok(category);
  }

  async createCategory(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateCreateCategory(body);
    if (error || !value) {
      return badRequest(error || "Dados da categoria inválidos.");
    }

    const category = await this.service.createCategory(value);
    return created(category);
  }

  async updateCategory(req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateUpdateCategory(body);
    if (error || !value) {
      return badRequest(
        error || "Dados de atualização da categoria inválidos.",
      );
    }

    const category = await this.service.updateCategory(id, value);
    return ok(category);
  }

  async deleteCategory(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    await this.service.deleteCategory(id);
    return ok({ message: "Categoria desativada com sucesso." });
  }
}

export const categoriesController = new CategoriesController();
export default categoriesController;
