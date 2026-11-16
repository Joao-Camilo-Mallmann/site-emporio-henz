import { describe, expect, it } from "bun:test";
import { validateProductQuery } from "@/modules/products/products.schema";
import { ProductsService } from "@/modules/products/products.service";
import {
  createDummyProduct,
  MockProductsRepository,
  PROD_1_ID,
  PROD_2_ID,
} from "../../mocks/products.mock";

function buildService() {
  const mockRepo = new MockProductsRepository();
  mockRepo.products.push(
    createDummyProduct({
      id: PROD_1_ID,
      name: "Sofá Retrátil Milão",
      slug: "sofa-retratil-milao",
      collectionLine: "Conforto",
      description: "Sofá de 3 lugares com assento retrátil.",
    }),
    createDummyProduct({
      id: PROD_2_ID,
      name: "Roupeiro Roma",
      slug: "roupeiro-roma",
      collectionLine: "Linha Clássica",
      description: "Roupeiro de 6 portas.",
    }),
  );
  return new ProductsService(mockRepo);
}

const query = (qs: string) =>
  validateProductQuery(new URL(`http://localhost/produtos${qs}`));

describe("Módulo de Produtos (ProductsService)", () => {
  it("deve buscar ignorando caixa, acento e underline no nome", async () => {
    const service = buildService();

    const roupeiro = await service.listPaginated(query("?search=ROUPEIRO_ROMA"));
    expect(roupeiro.pagination.total).toBe(1);
    expect(roupeiro.data.map((p) => p.name)).toEqual(["Roupeiro Roma"]);

    const sofa = await service.listPaginated(query("?search=sofa-retratil"));
    expect(sofa.pagination.total).toBe(1);
    expect(sofa.data.map((p) => p.name)).toEqual(["Sofá Retrátil Milão"]);

    const acentuado = await service.listPaginated(query("?search=Mil%C3%A3o"));
    expect(acentuado.data.map((p) => p.name)).toEqual(["Sofá Retrátil Milão"]);
  });

  it("deve buscar na descrição e na linha/coleção normalizadas", async () => {
    const service = buildService();

    const porDescricao = await service.listPaginated(
      query("?search=6%20PORTAS"),
    );
    expect(porDescricao.data.map((p) => p.name)).toEqual(["Roupeiro Roma"]);

    const porLinha = await service.listPaginated(
      query("?search=linha_cl%C3%A1ssica"),
    );
    expect(porLinha.data.map((p) => p.name)).toEqual(["Roupeiro Roma"]);
  });

  it("deve listar tudo quando o termo fica vazio após normalizar", async () => {
    const service = buildService();

    const tudo = await service.listPaginated(query("?search=***"));
    expect(tudo.pagination.total).toBe(2);
  });
});
