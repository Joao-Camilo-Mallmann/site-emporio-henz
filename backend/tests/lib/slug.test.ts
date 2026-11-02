import { describe, expect, it } from "bun:test";
import { slugify } from "@/lib/slug";

describe("Normalização para slug (slugify)", () => {
  it("deve remover acentos e converter para minúsculas", () => {
    expect(slugify("Sofá Retrátil")).toBe("sofa-retratil");
  });

  it("deve converter caixa alta para minúsculas", () => {
    expect(slugify("ROUPEIRO ROMA")).toBe("roupeiro-roma");
  });

  it("deve trocar underline por hífen", () => {
    expect(slugify("roupeiro_roma")).toBe("roupeiro-roma");
  });

  it("deve juntar espaços repetidos e pontuação em um único hífen", () => {
    expect(slugify("  sofa ,  3  lugares! ")).toBe("sofa-3-lugares");
  });

  it("deve tratar cedilha e til como letras sem acento", () => {
    expect(slugify("Poltrona Açaí")).toBe("poltrona-acai");
  });

  it("deve devolver vazio para termo só de símbolos", () => {
    expect(slugify("***")).toBe("");
  });

  it("deve descartar curingas do LIKE", () => {
    expect(slugify("100%")).toBe("100");
    expect(slugify("sofa_%")).toBe("sofa");
  });
});
