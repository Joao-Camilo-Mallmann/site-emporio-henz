import { describe, expect, it } from "bun:test";
import { NotFoundError } from "@/lib/errors";
import { AtendimentoService } from "@/modules/atendimento/atendimento.service";
import { ListsService } from "@/modules/lists/lists.service";
import { FakeAtendimentoRepository } from "../../mocks/atendimento.mock";
import { FakeListsRepository, SAMPLE_ITEM } from "../../mocks/lists.mock";

function setup() {
  const listsRepo = new FakeListsRepository();
  const atendimentoRepo = new FakeAtendimentoRepository();

  const userId = crypto.randomUUID();
  const clientId = listsRepo.addClient(userId);
  atendimentoRepo.addClient(clientId, "Maria Souza", "maria@exemplo.com");

  return {
    listsService: new ListsService(listsRepo),
    service: new AtendimentoService(atendimentoRepo, listsRepo),
    listsRepo,
    userId,
  };
}

describe("AtendimentoService", () => {
  it("devolve o cliente com as listas e os itens salvos", async () => {
    const { service, listsService, userId } = setup();
    const [favoritos] = (await listsService.listMine(userId)).data;
    await listsService.addItem(userId, favoritos.id, SAMPLE_ITEM);
    await listsService.addItem(userId, favoritos.id, {
      ...SAMPLE_ITEM,
      finishLabel: "Branco",
      finishColor: "#ffffff",
    });

    const result = await service.findClientLists("maria@exemplo.com");

    expect(result.client).toEqual({
      fullName: "Maria Souza",
      email: "maria@exemplo.com",
    });
    expect(result.lists).toHaveLength(3);
    expect(result.lists[0].items).toHaveLength(2);
    expect(result.lists[0].items[0].finishLabel).toBeDefined();
  });

  it("acha o cliente sem diferenciar maiúsculas e minúsculas", async () => {
    const { service } = setup();

    const result = await service.findClientLists("MARIA@Exemplo.COM");

    expect(result.client.fullName).toBe("Maria Souza");
  });

  it("responde 404 quando o e-mail não é de nenhum cliente", async () => {
    const { service } = setup();

    await expect(
      service.findClientLists("ninguem@exemplo.com"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("não cria listas para um cliente que nunca abriu as próprias listas", async () => {
    const { service, listsRepo } = setup();

    const result = await service.findClientLists("maria@exemplo.com");

    expect(result.lists).toHaveLength(0);
    expect(listsRepo.lists).toHaveLength(0);
  });

  it("não devolve telefone nem ids do cliente", async () => {
    const { service } = setup();

    const result = await service.findClientLists("maria@exemplo.com");

    expect(Object.keys(result.client).sort()).toEqual(["email", "fullName"]);
  });
});
