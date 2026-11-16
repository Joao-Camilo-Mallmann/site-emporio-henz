import { describe, expect, it } from "bun:test";
import {
  MAX_SEARCH_LENGTH,
  parseSearch,
  parseSearchSlug,
} from "@/lib/pagination";

const url = (qs: string) => new URL(`http://localhost/produtos${qs}`);

describe("Validação do termo de busca (parseSearchSlug)", () => {
  it("deve devolver o termo na forma de slug", () => {
    expect(parseSearchSlug(url("?search=Sof%C3%A1_Retr%C3%A1til"))).toBe(
      "sofa-retratil",
    );
    expect(parseSearchSlug(url("?search=%20ROUPEIRO%20%20Roma%20"))).toBe(
      "roupeiro-roma",
    );
  });

  it("deve ignorar termo ausente, em branco ou só de símbolos", () => {
    expect(parseSearchSlug(url(""))).toBeUndefined();
    expect(parseSearchSlug(url("?search=%20%20"))).toBeUndefined();
    expect(parseSearchSlug(url("?search=***"))).toBeUndefined();
  });

  it("deve cortar em MAX_SEARCH_LENGTH antes de normalizar", () => {
    const letters = "a".repeat(MAX_SEARCH_LENGTH);
    expect(parseSearchSlug(url(`?search=${letters}-zzz`))).toBe(letters);
  });

  it("deve manter parseSearch literal para as demais listagens", () => {
    expect(parseSearch(url("?search=Sof%C3%A1_Retr%C3%A1til"))).toBe(
      "Sofá_Retrátil",
    );
  });
});
