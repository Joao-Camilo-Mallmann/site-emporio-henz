// Validação do formulário de produto, com as mesmas regras da API.

import type {
  FormValidationContext,
  FieldErrors,
  KeyValueRow,
  NumericInput,
  ProductFormState,
} from "@/types";
import {
  FIELD_IDS,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
  NAME_MIN_LENGTH,
  SLUG_PATTERN,
  TEXT_MAX_LENGTH,
  keyValueFieldId,
  variationFieldId,
} from "./produtoFormConstantes";
import {
  isFilledRow,
  isHexColor,
  normalizeHexColor,
  toNumber,
} from "./produtoFormEstado";

// ---------------------------------------------------------------------------
// Validação (mesmas regras da API)
// ---------------------------------------------------------------------------

function validateKeyValueRows(
  rows: KeyValueRow[],
  prefix: string,
  errors: FieldErrors,
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!isFilledRow(row)) continue;

    const key = row.key.trim();
    const keyId = keyValueFieldId(prefix, row.id, "key");
    if (!key) {
      errors[keyId] = "Informe o nome do item ou apague a linha.";
      continue;
    }
    if (!row.value.trim()) {
      errors[keyValueFieldId(prefix, row.id, "value")] =
        "Informe o valor ou apague a linha.";
      continue;
    }

    const normalized = key.toLowerCase();
    if (seen.has(normalized)) {
      errors[keyId] = `"${key}" está repetido. Use cada nome uma vez só.`;
      continue;
    }
    seen.add(normalized);
  }
}

function validateRequiredInteger(
  value: NumericInput,
  id: string,
  emptyMessage: string,
  errors: FieldErrors,
): void {
  const parsed = toNumber(value);
  if (parsed === null) {
    errors[id] = emptyMessage;
  } else if (!Number.isInteger(parsed) || parsed < 1) {
    errors[id] = "Use um número inteiro maior que zero.";
  }
}

function validateOptionalText(value: string, id: string, errors: FieldErrors) {
  if (value.trim().length > TEXT_MAX_LENGTH) {
    errors[id] = `Use no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }
}

/**
 * Valida o formulário e devolve `id do campo → mensagem`, na ordem visual da
 * tela. Mapa vazio significa que o formulário pode ser enviado.
 */
export function validateForm(
  form: ProductFormState,
  ctx: FormValidationContext,
): FieldErrors {
  const errors: FieldErrors = {};

  // 1. Dados básicos
  const name = form.name.trim();
  if (!name) {
    errors[FIELD_IDS.name] = "Informe o nome do produto.";
  } else if (name.length < NAME_MIN_LENGTH) {
    errors[FIELD_IDS.name] =
      `O nome deve ter pelo menos ${NAME_MIN_LENGTH} caracteres.`;
  } else if (name.length > TEXT_MAX_LENGTH) {
    errors[FIELD_IDS.name] =
      `O nome deve ter no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }

  const slug = form.slug.trim();
  if (!slug) {
    errors[FIELD_IDS.slug] = "Informe o slug do produto.";
  } else if (!SLUG_PATTERN.test(slug)) {
    errors[FIELD_IDS.slug] =
      "Use só letras minúsculas sem acento, números e hífens (ex.: roupeiro-roma).";
  } else if (slug.length > TEXT_MAX_LENGTH) {
    errors[FIELD_IDS.slug] =
      `O slug deve ter no máximo ${TEXT_MAX_LENGTH} caracteres.`;
  }

  if (!form.categoryId) {
    errors[FIELD_IDS.category] = "Escolha a categoria.";
  }
  if (form.subtypeId && !ctx.subtypeIds.includes(form.subtypeId)) {
    errors[FIELD_IDS.subtype] = "Escolha um subtipo desta categoria.";
  }
  if (!form.supplierId) {
    errors[FIELD_IDS.supplier] = "Escolha o fornecedor.";
  }
  validateOptionalText(form.collectionLine, FIELD_IDS.collectionLine, errors);
  validateOptionalText(form.mainMaterial, FIELD_IDS.mainMaterial, errors);

  // 2. Preço e disponibilidade
  const price = toNumber(form.referencePrice);
  if (price === null) {
    errors[FIELD_IDS.referencePrice] = "Informe o preço de referência.";
  } else if (price < 0) {
    errors[FIELD_IDS.referencePrice] = "O preço não pode ser negativo.";
  }

  const installments = toNumber(form.maxInstallments);
  if (
    installments === null ||
    !Number.isInteger(installments) ||
    installments < INSTALLMENTS_MIN ||
    installments > INSTALLMENTS_MAX
  ) {
    errors[FIELD_IDS.maxInstallments] =
      `Informe um número inteiro de ${INSTALLMENTS_MIN} a ${INSTALLMENTS_MAX}.`;
  }

  if (form.availabilityType === "ON_DEMAND") {
    validateRequiredInteger(
      form.estimatedDays,
      FIELD_IDS.estimatedDays,
      "Informe o prazo de fabricação em dias.",
      errors,
    );
  }

  // 3. Dimensões
  validateRequiredInteger(
    form.heightMm,
    FIELD_IDS.heightMm,
    "Informe a altura em mm.",
    errors,
  );
  validateRequiredInteger(
    form.widthMm,
    FIELD_IDS.widthMm,
    "Informe a largura em mm.",
    errors,
  );
  validateRequiredInteger(
    form.depthMm,
    FIELD_IDS.depthMm,
    "Informe a profundidade em mm.",
    errors,
  );

  // 4. Variações
  for (const variation of form.variations) {
    const variationName = variation.name.trim();
    if (!variationName) {
      errors[variationFieldId.name(variation.key)] =
        "Informe o nome da variação.";
    } else if (variationName.length > TEXT_MAX_LENGTH) {
      errors[variationFieldId.name(variation.key)] =
        `Use no máximo ${TEXT_MAX_LENGTH} caracteres.`;
    }

    variation.colorsHex.forEach((color, index) => {
      if (!isHexColor(normalizeHexColor(color))) {
        errors[variationFieldId.color(variation.key, index)] =
          "Use o formato #RRGGBB.";
      }
    });

    validateKeyValueRows(
      variation.finishDetails,
      variationFieldId.details(variation.key),
      errors,
    );
  }

  // 6. Especificações técnicas
  validateKeyValueRows(form.specifications, FIELD_IDS.specifications, errors);

  return errors;
}
