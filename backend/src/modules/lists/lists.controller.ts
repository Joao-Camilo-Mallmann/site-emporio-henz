import { UnauthorizedError } from "@/lib/errors";
import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import {
  validateAddItem,
  validateListName,
  validateListQuery,
  validateShare,
} from "@/modules/lists/lists.schema";
import { listsService, ListsService } from "@/modules/lists/lists.service";

async function readJson(req: Request): Promise<{ body: unknown } | null> {
  try {
    return { body: await req.json() };
  } catch {
    return null;
  }
}

export class ListsController {
  constructor(private service: ListsService = listsService) {}

  private userId(ctx: RequestContext): string {
    if (!ctx.user) {
      throw new UnauthorizedError("Usuário não autenticado.");
    }
    return ctx.user.id;
  }

  // `?itens=true` devolve cada lista já com os itens salvos
  async list(_req: Request, ctx: RequestContext): Promise<Response> {
    const withItems = ctx.url.searchParams.get("itens") === "true";
    const filters = validateListQuery(ctx.url);
    const userId = this.userId(ctx);

    return ok(
      withItems
        ? await this.service.listMineWithItems(userId, filters)
        : await this.service.listMine(userId, filters),
    );
  }

  async getById(_req: Request, ctx: RequestContext): Promise<Response> {
    return ok(await this.service.getMine(this.userId(ctx), ctx.params.id));
  }

  async create(req: Request, ctx: RequestContext): Promise<Response> {
    const json = await readJson(req);
    if (!json) {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateListName(json.body);
    if (error || !value) {
      return badRequest(error || "Dados da lista inválidos.");
    }

    return created(await this.service.create(this.userId(ctx), value));
  }

  async rename(req: Request, ctx: RequestContext): Promise<Response> {
    const json = await readJson(req);
    if (!json) {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateListName(json.body);
    if (error || !value) {
      return badRequest(error || "Dados da lista inválidos.");
    }

    return ok(
      await this.service.rename(this.userId(ctx), ctx.params.id, value),
    );
  }

  async setPublic(req: Request, ctx: RequestContext): Promise<Response> {
    const json = await readJson(req);
    if (!json) {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateShare(json.body);
    if (error || !value) {
      return badRequest(error || "Dados inválidos.");
    }

    return ok(
      await this.service.setPublic(
        this.userId(ctx),
        ctx.params.id,
        value.isPublic,
      ),
    );
  }

  async remove(_req: Request, ctx: RequestContext): Promise<Response> {
    await this.service.remove(this.userId(ctx), ctx.params.id);
    return ok({ message: "Lista excluída com sucesso." });
  }

  async addItem(req: Request, ctx: RequestContext): Promise<Response> {
    const json = await readJson(req);
    if (!json) {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateAddItem(json.body);
    if (error || !value) {
      return badRequest(error || "Dados do item inválidos.");
    }

    const result = await this.service.addItem(
      this.userId(ctx),
      ctx.params.id,
      value,
    );
    return result.created ? created(result.item) : ok(result.item);
  }

  async removeItem(_req: Request, ctx: RequestContext): Promise<Response> {
    await this.service.removeItem(
      this.userId(ctx),
      ctx.params.id,
      ctx.params.itemId,
    );
    return ok({ message: "Item removido da lista." });
  }

  async getShared(_req: Request, ctx: RequestContext): Promise<Response> {
    return ok(await this.service.getShared(ctx.params.shareSlug));
  }
}

export const listsController = new ListsController();
export default listsController;
