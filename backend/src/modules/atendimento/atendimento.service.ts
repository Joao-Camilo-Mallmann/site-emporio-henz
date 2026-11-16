import { NotFoundError } from "@/lib/errors";
import {
  atendimentoRepository,
  AtendimentoRepository,
} from "@/modules/atendimento/atendimento.repository";
import { AtendimentoResultDto } from "@/modules/atendimento/atendimento.types";
import { listsRepository, ListsRepository } from "@/modules/lists/lists.repository";

export class AtendimentoService {
  constructor(
    private repo: AtendimentoRepository = atendimentoRepository,
    private lists: ListsRepository = listsRepository,
  ) {}

  // Consulta somente leitura: nunca cria listas para o cliente consultado
  async findClientLists(email: string): Promise<AtendimentoResultDto> {
    const client = await this.repo.findClientByEmail(email);
    if (!client) {
      throw new NotFoundError("Nenhum cliente cadastrado com este e-mail.");
    }

    const [lists, rows] = await Promise.all([
      this.lists.listByClient(client.clientId),
      this.lists.listItemsByClient(client.clientId),
    ]);

    return {
      client: { fullName: client.fullName, email: client.email },
      lists: lists.map((list) => ({
        ...list,
        items: rows.filter((r) => r.listId === list.id).map((r) => r.item),
      })),
    };
  }
}

export const atendimentoService = new AtendimentoService();
export default atendimentoService;
