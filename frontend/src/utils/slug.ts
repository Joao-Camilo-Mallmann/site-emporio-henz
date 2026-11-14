/**
 * Converte uma string arbitrária em um slug padronizado (kebab-case).
 * Remove acentos, caracteres especiais e hífens repetidos.
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // substitui caracteres especiais e espaços por hífen
    .replace(/^-+|-+$/g, ""); // remove hífens das pontas
}

/**
 * Limpa o termo de um campo de busca enquanto o usuário digita, direto no
 * componente: remove acentos, põe em minúsculas e troca qualquer sequência de
 * separadores (espaço, underline, hífen, pontuação, símbolos) por um único
 * espaço. Mantém o espaço final para o usuário seguir digitando; o `slugify`
 * é aplicado no envio. "SOFÁ_Retrátil!" vira "sofa retratil".
 */
export function limparTermoBusca(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^ /, "");
}
