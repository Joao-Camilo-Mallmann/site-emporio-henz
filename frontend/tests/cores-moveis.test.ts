import { describe, expect, it } from "bun:test";
import {
  CORES_GRUPOS,
  CORES_MOVEIS,
  encontrarCorPorHex,
  filtrarCoresMoveis,
  lerGruposCorDaQuery,
  rotuloCorHex,
} from "../src/utils/coresMoveis";

describe("paleta de cores de móveis", () => {
  it("possui 50 cores com slugs e códigos HEX únicos distribuídos nos 11 grupos", () => {
    expect(CORES_GRUPOS).toHaveLength(11);
    expect(CORES_MOVEIS).toHaveLength(50);

    const slugs = new Set(CORES_MOVEIS.map((cor) => cor.slug));
    const hexes = new Set(CORES_MOVEIS.map((cor) => cor.hex.toUpperCase()));
    expect(slugs.size).toBe(50);
    expect(hexes.size).toBe(50);

    const gruposValidos = new Set(CORES_GRUPOS.map((g) => g.slug));
    for (const cor of CORES_MOVEIS) {
      expect(gruposValidos.has(cor.group)).toBe(true);
      expect(cor.hex).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("encontra cores por HEX independente de caixa e gera rótulo amigável", () => {
    expect(encontrarCorPorHex("#8e6743")?.name).toBe("Freijó");
    expect(rotuloCorHex("#f4efe6")).toBe("Off-White");
    expect(rotuloCorHex("#123456")).toBe("#123456");
  });

  it("filtra a paleta por família e busca sem acento", () => {
    const freijo = filtrarCoresMoveis("todas", "freijo");
    expect(freijo.map((cor) => cor.slug)).toEqual(["freijo"]);

    const madeirasMedias = filtrarCoresMoveis("madeira-media", "");
    expect(madeirasMedias).toHaveLength(7);
  });

  it("lê apenas grupos válidos da query de cores e remove duplicatas", () => {
    expect(lerGruposCorDaQuery("madeira-media,preto,madeira-media,invalido")).toEqual([
      "madeira-media",
      "preto",
    ]);
    expect(lerGruposCorDaQuery("")).toEqual([]);
  });
});
