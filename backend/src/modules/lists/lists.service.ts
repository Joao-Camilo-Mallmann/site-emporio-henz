import { ForbiddenError, isUniqueViolation, NotFoundError } from "@/lib/errors";
import { listsRepository, ListsRepository } from "@/modules/lists/lists.repository";
import { isValidUuid } from "@/modules/lists/lists.schema";
import {
  AddListItemDto,
  AddListItemResult,
  ListDto,
  ListNameDto,
  ListWithItemsDto,
  SharedListDto,
} from "@/modules/lists/lists.types";

export class ListsService {
  constructor(private repo: ListsRepository = listsRepository) {}

  // Listas pertencem ao perfil de cliente (clients), não ao usuário em si
  private async resolveClientId(userId: string): Promise<string> {
    const clientId = await this.repo.findClientIdByUserId(userId);
    if (!clientId) {
      throw new ForbiddenError("Apenas clientes cadastrados possuem listas.");
    }
    return clientId;
  }

  // Lista de outro cliente responde 404, igual a uma lista que não existe
  private async getOwnedList(clientId: string, listId: string): Promise<ListDto> {
    if (!isValidUuid(listId)) {
      throw new NotFoundError("Lista não encontrada.");
    }
    const list = await this.repo.findOwnedById(clientId, listId);
    if (!list) {
      throw new NotFoundError("Lista não encontrada.");
    }
    return list;
  }

  // As 3 listas padrão são criadas no primeiro acesso do cliente
  async listMine(userId: string): Promise<ListDto[]> {
    const clientId = await this.resolveClientId(userId);
    await this.repo.ensureSystemLists(clientId);
    return await this.repo.listByClient(clientId);
  }

  // Mesma listagem, já com os itens de cada lista (uma chamada só para o front)
  async listMineWithItems(userId: string): Promise<ListWithItemsDto[]> {
    const clientId = await this.resolveClientId(userId);
    await this.repo.ensureSystemLists(clientId);

    const [lists, rows] = await Promise.all([
      this.repo.listByClient(clientId),
      this.repo.listItemsByClient(clientId),
    ]);

    return lists.map((list) => ({
      ...list,
      items: rows.filter((r) => r.listId === list.id).map((r) => r.item),
    }));
  }

  async getMine(userId: string, listId: string): Promise<ListWithItemsDto> {
    const clientId = await this.resolveClientId(userId);
    const list = await this.getOwnedList(clientId, listId);
    const items = await this.repo.listItems(list.id);
    return { ...list, items };
  }

  async create(userId: string, dto: ListNameDto): Promise<ListDto> {
    const clientId = await this.resolveClientId(userId);
    return await this.repo.createCustom(clientId, dto.name);
  }

  async rename(userId: string, listId: string, dto: ListNameDto): Promise<ListDto> {
    const clientId = await this.resolveClientId(userId);
    const list = await this.getOwnedList(clientId, listId);

    if (list.isSystem) {
      throw new ForbiddenError("As listas padrão não podem ser renomeadas.");
    }

    await this.repo.rename(list.id, dto.name);
    return await this.getOwnedList(clientId, list.id);
  }

  async remove(userId: string, listId: string): Promise<void> {
    const clientId = await this.resolveClientId(userId);
    const list = await this.getOwnedList(clientId, listId);

    if (list.isSystem) {
      throw new ForbiddenError("As listas padrão não podem ser excluídas.");
    }

    await this.repo.softDelete(list.id);
  }

  // Salvar o mesmo produto com o mesmo acabamento duas vezes devolve o item existente
  async addItem(
    userId: string,
    listId: string,
    dto: AddListItemDto,
  ): Promise<AddListItemResult> {
    const clientId = await this.resolveClientId(userId);
    const list = await this.getOwnedList(clientId, listId);

    // TODO(produtos): quando o catálogo do front usar os produtos reais da API,
    // validar aqui que dto.productId existe (e que variationId pertence a ele) e preencher
    // nome, preço, imagem e slug a partir do banco, em vez de confiar no payload.

    const existing = await this.repo.findExistingItem(list.id, dto);
    if (existing) {
      return { item: existing, created: false };
    }

    try {
      const item = await this.repo.addItem(list.id, dto);
      return { item, created: true };
    } catch (error) {
      // Duas requisições simultâneas: a segunda cai no índice único
      if (isUniqueViolation(error)) {
        const again = await this.repo.findExistingItem(list.id, dto);
        if (again) {
          return { item: again, created: false };
        }
      }
      throw error;
    }
  }

  async removeItem(userId: string, listId: string, itemId: string): Promise<void> {
    const clientId = await this.resolveClientId(userId);
    const list = await this.getOwnedList(clientId, listId);

    if (!isValidUuid(itemId)) {
      throw new NotFoundError("Item não encontrado.");
    }

    const removed = await this.repo.softDeleteItem(list.id, itemId);
    if (!removed) {
      throw new NotFoundError("Item não encontrado.");
    }
  }

  // Link público somente leitura: sem autenticação e sem dados do dono
  async getShared(shareSlug: string): Promise<SharedListDto> {
    if (!isValidUuid(shareSlug)) {
      throw new NotFoundError("Lista não encontrada.");
    }

    const list = await this.repo.findSharedBySlug(shareSlug);
    if (!list) {
      throw new NotFoundError("Lista não encontrada.");
    }

    const items = await this.repo.listItems(list.id);
    return {
      name: list.name,
      listType: list.listType,
      itemsCount: items.length,
      items,
    };
  }
}

export const listsService = new ListsService();
export default listsService;
