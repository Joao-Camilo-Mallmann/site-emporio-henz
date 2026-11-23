import { afterEach, describe, expect, it } from "bun:test";
import { copyTextToClipboard, shareOrCopyLink } from "../src/utils/share";

interface GlobalSnapshot {
  navigator?: PropertyDescriptor;
  document?: PropertyDescriptor;
  window?: PropertyDescriptor;
}

interface MockTextArea {
  value: string;
  style: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  focus: (options?: { preventScroll?: boolean }) => void;
  select: () => void;
  setSelectionRange: (start: number, end: number) => void;
  blur: () => void;
  remove: () => void;
}

const originalGlobals: GlobalSnapshot = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  document: Object.getOwnPropertyDescriptor(globalThis, "document"),
  window: Object.getOwnPropertyDescriptor(globalThis, "window"),
};

function restoreGlobal(
  key: keyof GlobalSnapshot,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, key, descriptor);
  } else {
    Reflect.deleteProperty(globalThis, key);
  }
}

function setMockGlobal(key: keyof GlobalSnapshot, value: unknown): void {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function createMockDocument(execCommandImpl: (command: string) => boolean) {
  let appended = 0;
  let removed = 0;
  let lastCreatedValue = "";
  const execCalls: string[] = [];

  const createdTextarea: MockTextArea = {
    value: "",
    style: {},
    setAttribute: () => {},
    focus: () => {},
    select: () => {},
    setSelectionRange: () => {},
    blur: () => {},
    remove: () => {
      removed += 1;
    },
  };

  const mockDocument = {
    body: {
      appendChild: (node: MockTextArea) => {
        appended += 1;
        lastCreatedValue = node.value;
        return node;
      },
    },
    createElement: () => createdTextarea,
    execCommand: (command: string) => {
      execCalls.push(command);
      return execCommandImpl(command);
    },
  };

  return {
    mockDocument,
    getStats: () => ({ appended, removed, lastCreatedValue, execCalls }),
  };
}

afterEach(() => {
  restoreGlobal("navigator", originalGlobals.navigator);
  restoreGlobal("document", originalGlobals.document);
  restoreGlobal("window", originalGlobals.window);
});

describe("compartilhamento e cópia de link", () => {
  it("usa Web Share API quando disponível e retorna 'shared'", async () => {
    const shareCalls: ShareData[] = [];
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Linux; Android 14)",
      share: async (data: ShareData) => {
        shareCalls.push(data);
      },
      canShare: () => true,
    });

    const result = await shareOrCopyLink({
      title: "Armário Florença | Empório Henz",
      url: "https://emporiohenz.com.br/catalogo/armario-florenca",
    });

    expect(result).toBe("shared");
    expect(shareCalls).toEqual([
      {
        title: "Armário Florença | Empório Henz",
        url: "https://emporiohenz.com.br/catalogo/armario-florenca",
      },
    ]);
  });

  it("retorna 'cancelled' sem tentar copiar quando o usuário cancela o compartilhamento", async () => {
    let clipboardCalled = false;
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
      share: async () => {
        const abortError = new Error("Share canceled");
        abortError.name = "AbortError";
        throw abortError;
      },
      clipboard: {
        writeText: async () => {
          clipboardCalled = true;
        },
      },
    });

    const result = await shareOrCopyLink({
      title: "Mesa Porto",
      url: "https://emporiohenz.com.br/catalogo/mesa-porto",
    });

    expect(result).toBe("cancelled");
    expect(clipboardCalled).toBe(false);
  });

  it("faz fallback para navigator.clipboard.writeText quando navigator.share falha", async () => {
    const copiedTexts: string[] = [];
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0",
      share: async () => {
        throw new Error("NotAllowedError");
      },
      clipboard: {
        writeText: async (text: string) => {
          copiedTexts.push(text);
        },
      },
    });

    const result = await shareOrCopyLink({
      title: "Poltrona Tissi",
      url: "http://177.44.248.90/catalogo/poltrona-tissi",
    });

    expect(result).toBe("copied");
    expect(copiedTexts).toEqual([
      "http://177.44.248.90/catalogo/poltrona-tissi",
    ]);
  });

  it("usa document.execCommand('copy') em contexto HTTP sem navigator.clipboard e sem navigator.share", async () => {
    const { mockDocument, getStats } = createMockDocument(() => true);
    setMockGlobal("document", mockDocument);
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    });

    const url = "http://177.44.248.90/catalogo/armario-florenca";
    expect(await copyTextToClipboard(url)).toBe(true);
    expect(
      await shareOrCopyLink({ title: "Armário Florença", url }),
    ).toBe("copied");

    const stats = getStats();
    expect(stats.appended).toBe(2);
    expect(stats.removed).toBe(2);
    expect(stats.lastCreatedValue).toBe(url);
    expect(stats.execCalls).toEqual(["copy", "copy"]);
  });

  it("faz fallback para execCommand('copy') quando navigator.clipboard.writeText rejeita", async () => {
    const { mockDocument, getStats } = createMockDocument(() => true);
    setMockGlobal("document", mockDocument);
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      clipboard: {
        writeText: async () => {
          throw new Error("Clipboard permission denied");
        },
      },
    });

    const url = "http://177.44.248.90/lista/123";
    const copied = await copyTextToClipboard(url);

    expect(copied).toBe(true);
    expect(getStats().execCalls).toEqual(["copy"]);
    expect(getStats().removed).toBe(1);
  });

  it("retorna 'failed' quando a URL é vazia ou todos os mecanismos falham", async () => {
    const { mockDocument } = createMockDocument(() => false);
    setMockGlobal("document", mockDocument);
    setMockGlobal("navigator", {
      userAgent: "Mozilla/5.0",
    });

    expect(await shareOrCopyLink({ title: "Vazio", url: "" })).toBe("failed");
    expect(
      await shareOrCopyLink({
        title: "Sem suporte",
        url: "http://177.44.248.90/catalogo/sofa",
      }),
    ).toBe("failed");
  });
});
