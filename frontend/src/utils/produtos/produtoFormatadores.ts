// Rótulos e formatadores usados pela listagem de produtos.

import type {
  ProductListItemDto,
} from "@/types";
import {
  AVAILABILITY_OPTIONS,
} from "./produtoFormConstantes";

// ---------------------------------------------------------------------------
// Rótulos da listagem
// ---------------------------------------------------------------------------

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function availabilityLabel(product: ProductListItemDto): string {
  const option = AVAILABILITY_OPTIONS.find(
    (item) => item.value === product.availabilityType,
  );
  if (product.availabilityType === "ON_DEMAND" && product.estimatedDays > 0) {
    return `${option?.label ?? "Sob encomenda"} (${product.estimatedDays} dias)`;
  }
  return option?.label ?? "—";
}

/** "2300 × 2700 × 600 mm" a partir das dimensões do produto. */
export function formatDimensions(product: ProductListItemDto): string {
  const parts = [product.heightMm, product.widthMm, product.depthMm];
  if (parts.some((part) => typeof part !== "number" || part <= 0)) return "—";
  return `${parts.join(" × ")} mm`;
}
