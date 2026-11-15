import { describe, expect, it } from "bun:test";
import { validateEmailQuery } from "@/modules/atendimento/atendimento.schema";

describe("validateEmailQuery", () => {
  it("apara espaços e deixa o e-mail em minúsculas", () => {
    expect(validateEmailQuery("  Maria@Exemplo.COM ").value).toBe(
      "maria@exemplo.com",
    );
  });

  it("recusa e-mail ausente, vazio ou sem formato válido", () => {
    expect(validateEmailQuery(null).error).toBeDefined();
    expect(validateEmailQuery("   ").error).toBeDefined();
    expect(validateEmailQuery("maria").error).toBeDefined();
    expect(validateEmailQuery("maria@exemplo").error).toBeDefined();
    expect(validateEmailQuery("ma ria@exemplo.com").error).toBeDefined();
  });

  it("recusa e-mail longo demais", () => {
    expect(validateEmailQuery(`${"a".repeat(250)}@x.com`).error).toBeDefined();
  });
});
