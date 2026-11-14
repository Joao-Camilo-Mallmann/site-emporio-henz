export function normalizeCatalogSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function matchesCatalogSearch(
  searchableText: string,
  query: string,
): boolean {
  const terms = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(normalizeCatalogSearchText);
  const normalizedText = normalizeCatalogSearchText(searchableText);

  return terms.length > 0 && terms.every((term) => normalizedText.includes(term));
}
