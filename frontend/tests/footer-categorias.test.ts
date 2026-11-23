import { describe, expect, it } from "bun:test";
import { resolverCategoriasRodape } from "../src/stores/categorias";
import type { Category } from "../src/types";

describe("categorias do rodapé", () => {
  it("mantém as 6 categorias padrão enquanto a API ainda não respondeu", () => {
    expect(resolverCategoriasRodape([], false)).toEqual([
      { slug: "quarto", name: "Quarto" },
      { slug: "sala-de-estar", name: "Sala de Estar" },
      { slug: "sala-de-jantar", name: "Sala de Jantar" },
      { slug: "cozinha", name: "Cozinha" },
      { slug: "escritorio", name: "Escritório" },
      { slug: "banheiro", name: "Banheiro" },
    ]);
  });

  it("usa slugs e nomes reais das categorias ativas após carregar da API", () => {
    const categoriasApi: Category[] = [
      {
        id: "cat-1",
        name: "Dormitórios",
        slug: "dormitorios",
        active: true,
        subtypes: [],
      },
      {
        id: "cat-2",
        name: "Área Externa",
        slug: "area-externa",
        active: true,
        subtypes: [],
      },
    ];

    expect(resolverCategoriasRodape(categoriasApi, true)).toEqual([
      { slug: "dormitorios", name: "Dormitórios" },
      { slug: "area-externa", name: "Área Externa" },
    ]);
  });

  it("devolve lista vazia quando já carregou e não há categorias ativas", () => {
    expect(resolverCategoriasRodape([], true)).toEqual([]);
  });
});
