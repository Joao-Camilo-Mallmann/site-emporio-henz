import { ListsRepository } from "@/modules/lists/lists.repository";
import {
  AddListItemDto,
  ListDto,
  ListItemDto,
  ListType,
  SharedListRef,
  SYSTEM_LISTS,
} from "@/modules/lists/lists.types";

interface FakeList {
  id: string;
  clientId: string;
  name: string;
  listType: ListType;
  isSystem: boolean;
  shareSlug: string;
  isPublic: boolean;
  deleted: boolean;
}

interface FakeItem extends ListItemDto {
  listId: string;
  deleted: boolean;
}

export class FakeListsRepository extends ListsRepository {
  clients = new Map<string, string>();
  lists: FakeList[] = [];
  items: FakeItem[] = [];

  addClient(userId: string): string {
    const clientId = crypto.randomUUID();
    this.clients.set(userId, clientId);
    return clientId;
  }

  private newList(
    clientId: string,
    name: string,
    listType: ListType,
    isSystem: boolean,
  ): FakeList {
    const list: FakeList = {
      id: crypto.randomUUID(),
      clientId,
      name,
      listType,
      isSystem,
      shareSlug: crypto.randomUUID(),
      isPublic: true,
      deleted: false,
    };
    this.lists.push(list);
    return list;
  }

  private toDto(l: FakeList): ListDto {
    const now = new Date().toISOString();
    return {
      id: l.id,
      name: l.name,
      listType: l.listType,
      isSystem: l.isSystem,
      shareSlug: l.shareSlug,
      isPublic: l.isPublic,
      itemsCount: this.items.filter((i) => i.listId === l.id && !i.deleted).length,
      createdAt: now,
      updatedAt: now,
    };
  }

  private toItemDto(i: FakeItem): ListItemDto {
    return {
      id: i.id,
      productId: i.productId,
      productSlug: i.productSlug,
      variationId: i.variationId,
      name: i.name,
      price: i.price,
      image: i.image,
      finishLabel: i.finishLabel,
      finishColor: i.finishColor,
      addedAt: i.addedAt,
    };
  }

  async findClientIdByUserId(userId: string): Promise<string | null> {
    return this.clients.get(userId) ?? null;
  }

  async ensureSystemLists(clientId: string): Promise<void> {
    for (const def of SYSTEM_LISTS) {
      const exists = this.lists.some(
        (l) =>
          l.clientId === clientId &&
          l.listType === def.listType &&
          l.isSystem &&
          !l.deleted,
      );
      if (!exists) this.newList(clientId, def.name, def.listType, true);
    }
  }

  async listByClient(clientId: string): Promise<ListDto[]> {
    return this.lists
      .filter((l) => l.clientId === clientId && !l.deleted)
      .map((l) => this.toDto(l));
  }

  async findOwnedById(clientId: string, listId: string): Promise<ListDto | null> {
    const list = this.lists.find(
      (l) => l.id === listId && l.clientId === clientId && !l.deleted,
    );
    return list ? this.toDto(list) : null;
  }

  async createCustom(clientId: string, name: string): Promise<ListDto> {
    return this.toDto(this.newList(clientId, name, "CUSTOM", false));
  }

  async rename(listId: string, name: string): Promise<boolean> {
    const list = this.lists.find((l) => l.id === listId && !l.deleted);
    if (!list) return false;
    list.name = name;
    return true;
  }

  async softDelete(listId: string): Promise<void> {
    for (const item of this.items) {
      if (item.listId === listId) item.deleted = true;
    }
    const list = this.lists.find((l) => l.id === listId);
    if (list) list.deleted = true;
  }

  async listItems(listId: string): Promise<ListItemDto[]> {
    return this.items
      .filter((i) => i.listId === listId && !i.deleted)
      .map((i) => this.toItemDto(i));
  }

  async listItemsByClient(
    clientId: string,
  ): Promise<{ listId: string; item: ListItemDto }[]> {
    const listIds = this.lists
      .filter((l) => l.clientId === clientId && !l.deleted)
      .map((l) => l.id);

    return this.items
      .filter((i) => listIds.includes(i.listId) && !i.deleted)
      .map((i) => ({ listId: i.listId, item: this.toItemDto(i) }));
  }

  async findExistingItem(
    listId: string,
    dto: AddListItemDto,
  ): Promise<ListItemDto | null> {
    const found = this.items.find(
      (i) =>
        i.listId === listId &&
        !i.deleted &&
        i.productId === dto.productId &&
        (i.finishLabel ?? "") === (dto.finishLabel ?? "") &&
        (i.finishColor ?? "") === (dto.finishColor ?? ""),
    );
    return found ? this.toItemDto(found) : null;
  }

  async addItem(listId: string, dto: AddListItemDto): Promise<ListItemDto> {
    const item: FakeItem = {
      id: crypto.randomUUID(),
      listId,
      deleted: false,
      productId: dto.productId,
      productSlug: dto.productSlug ?? null,
      variationId: dto.variationId ?? null,
      name: dto.name,
      price: dto.price,
      image: dto.image,
      finishLabel: dto.finishLabel ?? null,
      finishColor: dto.finishColor ?? null,
      addedAt: new Date().toISOString(),
    };
    this.items.push(item);
    return this.toItemDto(item);
  }

  async softDeleteItem(listId: string, itemId: string): Promise<boolean> {
    const item = this.items.find(
      (i) => i.id === itemId && i.listId === listId && !i.deleted,
    );
    if (!item) return false;
    item.deleted = true;
    return true;
  }

  async findSharedBySlug(shareSlug: string): Promise<SharedListRef | null> {
    const list = this.lists.find(
      (l) => l.shareSlug === shareSlug && l.isPublic && !l.deleted,
    );
    return list ? { id: list.id, name: list.name, listType: list.listType } : null;
  }
}

export const SAMPLE_ITEM: AddListItemDto = {
  productId: "p-5",
  productSlug: "guarda-roupa-topazio",
  name: "Guarda-roupa Topázio",
  price: 5100,
  image: "/images/products/prod-comoda-italia.png",
  finishLabel: "Nogueira",
  finishColor: "#6b4a2f",
};
