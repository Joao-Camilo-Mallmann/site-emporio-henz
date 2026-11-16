import { describe, expect, it } from "bun:test";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { ListsService } from "@/modules/lists/lists.service";
import {
  FakeListsRepository,
  SAMPLE_ITEM as ITEM,
  SAMPLE_PRODUCT,
} from "../../mocks/lists.mock";

function setup() {
  const repo = new FakeListsRepository();
  const service = new ListsService(repo);
  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();
  repo.addClient(userA);
  repo.addClient(userB);
  return { repo, service, userA, userB };
}

describe("ListsService", () => {
  it("recusa quem não tem perfil de cliente", async () => {
    const { service } = setup();
    await expect(service.listMine(crypto.randomUUID())).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("cria as 3 listas padrão no primeiro acesso, na ordem, sem duplicar", async () => {
    const { service, userA } = setup();

    const first = (await service.listMine(userA)).data;
    expect(first.map((l) => l.listType)).toEqual([
      "FAVORITES",
      "WISHLIST",
      "GIFT_LIST",
    ]);
    expect(first.every((l) => l.isSystem)).toBe(true);

    const second = (await service.listMine(userA)).data;
    expect(second).toHaveLength(3);
  });

  it("cria, renomeia e exclui pasta personalizada", async () => {
    const { service, userA } = setup();

    const created = await service.create(userA, { name: "Sala nova" });
    expect(created.listType).toBe("CUSTOM");
    expect(created.isSystem).toBe(false);

    const renamed = await service.rename(userA, created.id, { name: "Sala de estar" });
    expect(renamed.name).toBe("Sala de estar");

    await service.remove(userA, created.id);
    await expect(service.getMine(userA, created.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("bloqueia renomear e excluir as listas padrão", async () => {
    const { service, userA } = setup();
    const [favoritos] = (await service.listMine(userA)).data;

    await expect(
      service.rename(userA, favoritos.id, { name: "Outro nome" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.remove(userA, favoritos.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("não duplica o mesmo produto com o mesmo acabamento", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    const first = await service.addItem(userA, list.id, ITEM);
    expect(first.created).toBe(true);

    const again = await service.addItem(userA, list.id, ITEM);
    expect(again.created).toBe(false);
    expect(again.item.id).toBe(first.item.id);

    const other = await service.addItem(userA, list.id, {
      ...ITEM,
      finishLabel: "Branco",
      finishColor: "#ffffff",
    });
    expect(other.created).toBe(true);

    const detail = await service.getMine(userA, list.id);
    expect(detail.itemsCount).toBe(2);
    expect(detail.items).toHaveLength(2);
  });

  it("recusa produto inexistente e salva nome, preço e imagem do banco", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    await expect(
      service.addItem(userA, list.id, { productId: crypto.randomUUID() }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const { item } = await service.addItem(userA, list.id, ITEM);
    expect(item.name).toBe(SAMPLE_PRODUCT.name);
    expect(item.price).toBe(SAMPLE_PRODUCT.price);
    expect(item.image).toBe(SAMPLE_PRODUCT.image);
    expect(item.productSlug).toBe(SAMPLE_PRODUCT.productSlug);
  });

  it("pagina as listas no envelope { data, pagination }", async () => {
    const { service, userA } = setup();
    await service.create(userA, { name: "Sala" });
    await service.create(userA, { name: "Quarto" });
    await service.create(userA, { name: "Cozinha" });

    const first = await service.listMine(userA, { page: 1, limit: 4 });
    expect(first.data).toHaveLength(4);
    expect(first.pagination).toEqual({ page: 1, limit: 4, total: 6, totalPages: 2 });

    const second = await service.listMineWithItems(userA, { page: 2, limit: 4 });
    expect(second.data).toHaveLength(2);
    expect(second.data.every((l) => Array.isArray(l.items))).toBe(true);
    expect(second.pagination).toEqual({ page: 2, limit: 4, total: 6, totalPages: 2 });
  });

  it("lista as listas já com os itens de cada uma", async () => {
    const { service, userA, userB } = setup();
    const [favoritos] = (await service.listMine(userA)).data;
    const pasta = await service.create(userA, { name: "Quarto" });

    await service.addItem(userA, favoritos.id, ITEM);
    await service.addItem(userA, pasta.id, ITEM);
    await service.addItem(userA, pasta.id, { ...ITEM, finishLabel: "Branco" });

    const lists = (await service.listMineWithItems(userA)).data;
    const byId = new Map(lists.map((l) => [l.id, l]));

    expect(lists).toHaveLength(4);
    expect(byId.get(favoritos.id)?.items).toHaveLength(1);
    expect(byId.get(pasta.id)?.items).toHaveLength(2);
    expect(byId.get(pasta.id)?.itemsCount).toBe(2);

    const others = (await service.listMineWithItems(userB)).data;
    expect(others.every((l) => l.items.length === 0)).toBe(true);
  });

  it("não deixa um cliente ver ou alterar a lista de outro", async () => {
    const { service, userA, userB } = setup();
    const list = await service.create(userA, { name: "Só minha" });

    await expect(service.getMine(userB, list.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove(userB, list.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.addItem(userB, list.id, ITEM)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("responde 404 para id de lista ou de item inválido ou inexistente", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    await expect(service.getMine(userA, "abc")).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.removeItem(userA, list.id, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.removeItem(userA, list.id, "abc")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("remove um item da lista", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });
    const { item } = await service.addItem(userA, list.id, ITEM);

    await service.removeItem(userA, list.id, item.id);

    const detail = await service.getMine(userA, list.id);
    expect(detail.items).toHaveLength(0);
  });

  it("link público mostra só nome, tipo e itens, sem dados do dono", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Presente de casamento" });
    await service.addItem(userA, list.id, ITEM);
    await service.setPublic(userA, list.id, true);

    const shared = await service.getShared(list.shareSlug);

    expect(Object.keys(shared).sort()).toEqual([
      "items",
      "itemsCount",
      "listType",
      "name",
    ]);
    expect(shared.name).toBe("Presente de casamento");
    expect(shared.itemsCount).toBe(1);
  });

  it("lista nasce privada e o dono liga e desliga o link público", async () => {
    const { service, userA } = setup();
    const [favorites] = (await service.listMine(userA)).data;
    const list = await service.create(userA, { name: "Quarto" });

    expect(favorites.isPublic).toBe(false);
    expect(list.isPublic).toBe(false);
    await expect(service.getShared(list.shareSlug)).rejects.toBeInstanceOf(NotFoundError);

    const opened = await service.setPublic(userA, list.id, true);
    expect(opened.isPublic).toBe(true);
    expect(opened.shareSlug).toBe(list.shareSlug);
    expect((await service.getShared(list.shareSlug)).name).toBe("Quarto");
    expect((await service.setPublic(userA, favorites.id, true)).isPublic).toBe(true);

    await service.setPublic(userA, list.id, false);
    await expect(service.getShared(list.shareSlug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("não deixa um cliente mudar a visibilidade da lista de outro", async () => {
    const { service, userA, userB } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    await expect(service.setPublic(userB, list.id, true)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getShared(list.shareSlug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("link público não funciona para slug inválido ou lista excluída", async () => {
    const { service, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    await expect(service.getShared("abc")).rejects.toBeInstanceOf(NotFoundError);

    await service.setPublic(userA, list.id, true);
    await service.remove(userA, list.id);
    await expect(service.getShared(list.shareSlug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("excluir a pasta também remove os itens dela", async () => {
    const { service, repo, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });
    await service.addItem(userA, list.id, ITEM);

    await service.remove(userA, list.id);

    expect(repo.items.every((i) => i.deleted)).toBe(true);
  });
});
