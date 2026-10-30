import contato from "@/data/contato.json";

/** Máximo de dígitos de um telefone brasileiro: DDD + 9 dígitos. */
const PHONE_MAX_DIGITS = 11;

/** Só os dígitos do valor, limitados ao tamanho de um telefone com DDD. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);
}

/**
 * Aplica a máscara `(99) 9999-9999` ou `(99) 99999-9999` conforme os dígitos.
 * Aceita valor parcial, para uso enquanto a pessoa digita.
 */
export function formatPhone(value: string): string {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Máscara para o `@input` de um campo de telefone. Devolve o valor formatado
 * e grava o mesmo texto no `<input>`: quando o limite de dígitos corta o que a
 * pessoa digitou, o texto formatado fica igual ao anterior, o Vue não
 * atualiza o DOM e o dígito a mais ficaria na tela.
 */
export function maskPhoneInput(event: Event): string {
  const target = event.target as HTMLInputElement;
  const formatted = formatPhone(target.value);
  target.value = formatted;
  return formatted;
}

/** Número do WhatsApp da loja no formato de exibição, ex.: `(51) 99898-1063`. */
export const storeWhatsappDisplay = formatPhone(contato.whatsapp.slice(2));

/** Link `wa.me` da loja, com mensagem pré-preenchida opcional. */
export function storeWhatsappUrl(message?: string): string {
  const base = `https://wa.me/${contato.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * URL absoluta do site para links compartilhados. Usa `siteUrl` do
 * `data/contato.json` e, se estiver vazio, a origem atual do navegador.
 */
export function storeSiteUrl(path = ""): string {
  const origin = (contato.siteUrl || window.location.origin).replace(/\/$/, "");
  return `${origin}${path}`;
}
