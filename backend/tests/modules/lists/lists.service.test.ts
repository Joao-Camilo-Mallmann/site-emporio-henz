import { describe, expect, it } from "bun:test";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { ListsService } from "@/modules/lists/lists.service";
import { FakeListsRepository, SAMPLE_ITEM as ITEM } from "../../mocks/lists.mock";

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

    const first = await service.listMine(userA);
    expect(first.map((l) => l.listType)).toEqual([
      "FAVORITES",
      "WISHLIST",
      "GIFT_LIST",
    ]);
    expect(first.every((l) => l.isSystem)).toBe(true);

    const second = await service.listMine(userA);
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
    const [favoritos] = await service.listMine(userA);

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

  it("lista as listas já com os itens de cada uma", async () => {
    const { service, userA, userB } = setup();
    const [favoritos] = await service.listMine(userA);
    const pasta = await service.create(userA, { name: "Quarto" });

    await service.addItem(userA, favoritos.id, ITEM);
    await service.addItem(userA, pasta.id, ITEM);
    await service.addItem(userA, pasta.id, { ...ITEM, finishLabel: "Branco" });

    const lists = await service.listMineWithItems(userA);
    const byId = new Map(lists.map((l) => [l.id, l]));

    expect(lists).toHaveLength(4);
    expect(byId.get(favoritos.id)?.items).toHaveLength(1);
    expect(byId.get(pasta.id)?.items).toHaveLength(2);
    expect(byId.get(pasta.id)?.itemsCount).toBe(2);

    const others = await service.listMineWithItems(userB);
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

  it("link público não funciona para slug inválido, lista privada ou excluída", async () => {
    const { service, repo, userA } = setup();
    const list = await service.create(userA, { name: "Quarto" });

    await expect(service.getShared("abc")).rejects.toBeInstanceOf(NotFoundError);

    repo.lists.find((l) => l.id === list.id)!.isPublic = false;
    await expect(service.getShared(list.shareSlug)).rejects.toBeInstanceOf(NotFoundError);

    repo.lists.find((l) => l.id === list.id)!.isPublic = true;
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
