import { describe, expect, it } from "bun:test";
import { validateProductQuery } from "@/modules/products/products.schema";
import { ProductsService } from "@/modules/products/products.service";
import {
  createDummyProduct,
  MockProductsRepository,
  PROD_1_ID,
  PROD_2_ID,
  ProductRowMapper,
  SUP_A_ID,
  SUP_B_ID,
} from "../../mocks/products.mock";

function buildService() {
  const mockRepo = new MockProductsRepository();
  mockRepo.products.push(
    createDummyProduct({
      id: PROD_1_ID,
      supplierId: SUP_A_ID,
      supplierName: "Estofados Vale do Taquari",
      name: "Sofá Retrátil Milão",
      slug: "sofa-retratil-milao",
      collectionLine: "Conforto",
      description: "Sofá de 3 lugares com assento retrátil.",
    }),
    createDummyProduct({
      id: PROD_2_ID,
      supplierId: SUP_B_ID,
      supplierName: "Móveis Serra Gaúcha Ltda",
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

  it("deve filtrar produtos por grupo de cor das variações ativas", async () => {
    const mockRepo = new MockProductsRepository();
    mockRepo.products.push(
      createDummyProduct({
        id: PROD_1_ID,
        name: "Sofá Retrátil Milão",
        slug: "sofa-retratil-milao",
      }),
      createDummyProduct({
        id: PROD_2_ID,
        name: "Roupeiro Roma",
        slug: "roupeiro-roma",
      }),
    );
    mockRepo.variations.push(
      {
        id: "var-1",
        productId: PROD_1_ID,
        name: "Veludo Verde Musgo",
        variationType: "FABRIC",
        colorsHex: ["#4E6044"],
        sampleImageUrl: null,
        finishDetails: {},
        sortOrder: 0,
        inStock: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        id: "var-2",
        productId: PROD_2_ID,
        name: "Freijó / Off-White",
        variationType: "FINISH",
        colorsHex: ["#8E6743", "#F4EFE6"],
        sampleImageUrl: null,
        finishDetails: {},
        sortOrder: 0,
        inStock: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        id: "var-3",
        productId: PROD_2_ID,
        name: "Preto Removido",
        variationType: "COLOR",
        colorsHex: ["#121212"],
        sampleImageUrl: null,
        finishDetails: {},
        sortOrder: 1,
        inStock: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: true,
      },
    );

    const service = new ProductsService(mockRepo);

    const verdes = await service.listPaginated(query("?colors=verde"));
    expect(verdes.data.map((p) => p.name)).toEqual(["Sofá Retrátil Milão"]);

    const madeiraMedia = await service.listPaginated(
      query("?colors=madeira-media"),
    );
    expect(madeiraMedia.data.map((p) => p.name)).toEqual(["Roupeiro Roma"]);

    const combinados = await service.listPaginated(
      query("?colors=verde,off-white-bege"),
    );
    expect(combinados.pagination.total).toBe(2);

    const ignorandoRemovida = await service.listPaginated(
      query("?colors=preto"),
    );
    expect(ignorandoRemovida.pagination.total).toBe(0);
  });

  it("deve filtrar por supplierId e expor supplierName na listagem e no detalhe", async () => {
    const service = buildService();

    const filtrados = await service.listPaginated(
      query(`?supplierId=${SUP_B_ID}`),
    );
    expect(filtrados.pagination.total).toBe(1);
    expect(filtrados.data[0]?.name).toBe("Roupeiro Roma");
    expect(filtrados.data[0]?.supplierName).toBe("Móveis Serra Gaúcha Ltda");

    const detalhe = await service.getById("roupeiro-roma");
    expect(detalhe.supplierId).toBe(SUP_B_ID);
    expect(detalhe.supplierName).toBe("Móveis Serra Gaúcha Ltda");
  });

  it("deve mapear supplier_name da linha do banco para supplierName no DTO", () => {
    const mapper = new ProductRowMapper();
    const now = new Date();
    const dto = mapper.product({
      id: PROD_1_ID,
      category_id: "cat-1",
      subtype_id: null,
      supplier_id: SUP_A_ID,
      supplier_name: "Estofados Vale do Taquari",
      name: "Sofá Retrátil Milão",
      slug: "sofa-retratil-milao",
      collection_line: null,
      main_material: null,
      reference_price: "2500.00",
      max_installments: 10,
      availability_type: "IN_STOCK",
      estimated_days: 0,
      height_mm: 900,
      width_mm: 2100,
      depth_mm: 1000,
      description: null,
      specifications: {},
      active: true,
      created_at: now,
      updated_at: now,
    });

    expect(dto.supplierName).toBe("Estofados Vale do Taquari");

    const withoutSupplierName = mapper.product({
      id: PROD_2_ID,
      category_id: "cat-1",
      subtype_id: null,
      supplier_id: SUP_B_ID,
      name: "Roupeiro Roma",
      slug: "roupeiro-roma",
      collection_line: null,
      main_material: null,
      reference_price: 1800,
      max_installments: 6,
      availability_type: "ON_DEMAND",
      estimated_days: 15,
      height_mm: 2200,
      width_mm: 1800,
      depth_mm: 600,
      description: null,
      specifications: {},
      active: true,
      created_at: now,
      updated_at: now,
    });

    expect(withoutSupplierName.supplierName).toBeNull();
  });
});
