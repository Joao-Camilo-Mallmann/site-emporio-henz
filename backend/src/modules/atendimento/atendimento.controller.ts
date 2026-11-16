import { badRequest, ok } from "@/lib/response";
import { validateEmailQuery } from "@/modules/atendimento/atendimento.schema";
import {
  atendimentoService,
  AtendimentoService,
} from "@/modules/atendimento/atendimento.service";

export class AtendimentoController {
  constructor(private service: AtendimentoService = atendimentoService) {}

  async findClient(req: Request): Promise<Response> {
    const { error, value } = validateEmailQuery(
      new URL(req.url).searchParams.get("email"),
    );
    if (error || !value) {
      return badRequest(error || "E-mail inválido.");
    }

    return ok(await this.service.findClientLists(value));
  }
}

export const atendimentoController = new AtendimentoController();
export default atendimentoController;
