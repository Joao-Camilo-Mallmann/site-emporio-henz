import { describe, expect, it } from "bun:test";
import {
  encontrarFornecedor,
  lerFiltrosDaRota,
  mapearDetalheProduto,
  mapearProdutoCatalogo,
  montarQueryDaRota,
} from "../src/composables/useCatalogoProdutos";
import type { Category, ProductDto, ProductListItemDto, Supplier } from "../src/types";

const categoriasMock: Category[] = [
  {
    id: "cat-1",
    name: "Sala de Estar",
    slug: "sala-de-estar",
    active: true,
    subtypes: [
      {
        id: "sub-1",
        categoryId: "cat-1",
        name: "Sofás",
        slug: "sofas",
        active: true,
      },
    ],
  },
];

const fornecedoresMock: Supplier[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Móveis Serra Gaúcha Ltda",
    contact: null,
    active: true,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Estofados Vale do Taquari",
    contact: null,
    active: true,
  },
];

describe("catálogo: filtro e exibição de fornecedor", () => {
  it("lê e serializa o parâmetro fornecedor na query da rota", () => {
    const filtros = lerFiltrosDaRota({
      categoria: "sala-de-estar",
      fornecedor: "moveis-serra-gaucha-ltda",
      page: "2",
    });

    expect(filtros.categoria).toBe("sala-de-estar");
    expect(filtros.fornecedor).toBe("moveis-serra-gaucha-ltda");
    expect(filtros.page).toBe(2);

    const queryComFornecedor = montarQueryDaRota(filtros, { utm_source: "ig" });
    expect(queryComFornecedor).toEqual({
      utm_source: "ig",
      categoria: "sala-de-estar",
      fornecedor: "moveis-serra-gaucha-ltda",
      page: "2",
    });

    const queryLimpa = montarQueryDaRota({ page: 1 }, { fornecedor: "antigo" });
    expect(queryLimpa.fornecedor).toBeUndefined();
  });

  it("encontra fornecedor por UUID ou por slug do nome ignorando acentos", () => {
    expect(
      encontrarFornecedor(
        fornecedoresMock,
        "550e8400-e29b-41d4-a716-446655440001",
      )?.name,
    ).toBe("Móveis Serra Gaúcha Ltda");

    expect(
      encontrarFornecedor(fornecedoresMock, "moveis-serra-gaucha-ltda")?.id,
    ).toBe("550e8400-e29b-41d4-a716-446655440001");

    expect(
      encontrarFornecedor(fornecedoresMock, "MÓVEIS SERRA GAÚCHA LTDA")?.id,
    ).toBe("550e8400-e29b-41d4-a716-446655440001");

    expect(
      encontrarFornecedor(fornecedoresMock, "fornecedor-inexistente"),
    ).toBeUndefined();
  });

  it("mapeia supplierId e supplierName na listagem e no detalhe do produto", () => {
    const listItem: ProductListItemDto = {
      id: "prod-1",
      supplierId: "550e8400-e29b-41d4-a716-446655440001",
      supplierName: "Móveis Serra Gaúcha Ltda",
      categoryId: "cat-1",
      subtypeId: "sub-1",
      name: "Sofá Retrátil Gramado",
      slug: "sofa-retratil-gramado",
      description: "Sofá em linho natural.",
      collectionLine: "Linha Serra",
      mainMaterial: "Madeira maciça",
      referencePrice: 4590,
      maxInstallments: 10,
      availabilityType: "ON_DEMAND",
      estimatedDays: 25,
      heightMm: 950,
      widthMm: 2400,
      depthMm: 1050,
      specifications: null,
      active: true,
      thumbnailUrl: "/uploads/sofa.webp",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const card = mapearProdutoCatalogo(listItem, categoriasMock);
    expect(card.supplierId).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(card.supplierName).toBe("Móveis Serra Gaúcha Ltda");

    const detailDto: ProductDto = {
      ...listItem,
      images: [],
      variations: [],
    };

    const detail = mapearDetalheProduto(detailDto, categoriasMock, []);
    expect(detail.supplierId).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(detail.supplierName).toBe("Móveis Serra Gaúcha Ltda");
    expect(detail.specifications).toContainEqual({
      label: "Fornecedor",
      value: "Móveis Serra Gaúcha Ltda",
    });

    const detailSemFornecedor = mapearDetalheProduto(
      { ...detailDto, supplierName: null },
      categoriasMock,
      [],
    );
    expect(detailSemFornecedor.supplierName).toBeUndefined();
    expect(
      detailSemFornecedor.specifications.some((s) => s.label === "Fornecedor"),
    ).toBe(false);
  });
});
