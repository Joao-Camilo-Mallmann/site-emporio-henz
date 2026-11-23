export interface ShareLinkInput {
  title: string;
  url: string;
  text?: string;
}

export type ShareLinkResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * Copia um texto para a área de transferência usando `document.execCommand("copy")`
 * como fallback para contextos sem `navigator.clipboard` (como origens HTTP).
 */
export function copyWithExecCommand(text: string): boolean {
  if (
    typeof document === "undefined" ||
    !document.body ||
    typeof document.execCommand !== "function"
  ) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    outline: "none",
    boxShadow: "none",
    background: "transparent",
    opacity: "0",
    pointerEvents: "none",
    fontSize: "16px",
  });
  document.body.appendChild(textarea);

  try {
    const isIos =
      typeof navigator !== "undefined" &&
      /ipad|iphone|ipod/i.test(navigator.userAgent);

    if (
      isIos &&
      typeof document.createRange === "function" &&
      typeof window !== "undefined" &&
      typeof window.getSelection === "function"
    ) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      textarea.setSelectionRange(0, textarea.value.length);
    } else {
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    }

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.blur?.();
    textarea.remove();
  }
}

/**
 * Copia um texto usando a Clipboard API e recorre ao `execCommand("copy")`
 * quando a API assíncrona não está disponível ou falha.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continua para o fallback síncrono.
    }
  }

  return copyWithExecCommand(text);
}

/**
 * Tenta compartilhar via Web Share API quando suportada e faz fallback para
 * cópia do link na área de transferência.
 */
export async function shareOrCopyLink(
  input: ShareLinkInput,
): Promise<ShareLinkResult> {
  if (!input.url) return "failed";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const shareData: ShareData = {
      title: input.title,
      url: input.url,
      ...(input.text ? { text: input.text } : {}),
    };

    const canShare =
      typeof navigator.canShare !== "function" || navigator.canShare(shareData);

    if (canShare) {
      try {
        await navigator.share(shareData);
        return "shared";
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "AbortError"
        ) {
          return "cancelled";
        }
      }
    }
  }

  const copied = await copyTextToClipboard(input.url);
  return copied ? "copied" : "failed";
}
