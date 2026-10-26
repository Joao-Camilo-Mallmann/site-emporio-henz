<script setup lang="ts">
import type { FieldErrors, KeyValueRow } from "@/types";
import { Icon } from "@iconify/vue";
import { nextTick } from "vue";
import {
  createKeyValueRow,
  ERROR_TEXT_CLASS,
  fieldClass,
  keyValueFieldId,
} from "./produtoDraft";

// Editor de pares chave/valor, usado nas especificações técnicas do produto
// e nos detalhes de acabamento das variações (design D10). Linhas vazias são
// descartadas no envio; a validação fica em `validateDraft`.

const rows = defineModel<KeyValueRow[]>({ required: true });

const props = withDefaults(
  defineProps<{
    idPrefix: string;
    errors?: FieldErrors;
    disabled?: boolean;
    keyLabel?: string;
    valueLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    addLabel?: string;
    emptyText?: string;
  }>(),
  {
    errors: () => ({}),
    disabled: false,
    keyLabel: "Item",
    valueLabel: "Valor",
    keyPlaceholder: "Ex.: Portas",
    valuePlaceholder: "Ex.: 6",
    addLabel: "Adicionar linha",
    emptyText: "Nenhum item adicionado.",
  },
);

function keyId(row: KeyValueRow) {
  return keyValueFieldId(props.idPrefix, row.id, "key");
}

function valueId(row: KeyValueRow) {
  return keyValueFieldId(props.idPrefix, row.id, "value");
}

function errorId(row: KeyValueRow) {
  return `${props.idPrefix}-${row.id}-error`;
}

function rowError(row: KeyValueRow): string {
  return props.errors[keyId(row)] || props.errors[valueId(row)] || "";
}

function addRow() {
  const row = createKeyValueRow();
  rows.value.push(row);
  nextTick(() => document.getElementById(keyId(row))?.focus());
}

function removeRow(id: string) {
  const index = rows.value.findIndex((row) => row.id === id);
  if (index >= 0) rows.value.splice(index, 1);
}
</script>

<template>
  <div :id="idPrefix" class="space-y-3">
    <div
      v-if="rows.length > 0"
      class="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-3 text-xs font-semibold text-neutral-dark"
      aria-hidden="true"
    >
      <span>{{ keyLabel }}</span>
      <span>{{ valueLabel }}</span>
      <span></span>
    </div>

    <div v-for="(row, index) in rows" :key="row.id">
      <div
        class="grid grid-cols-[minmax(0,1fr)_2.75rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 sm:gap-3 items-end sm:items-start"
      >
        <div class="col-span-2 sm:col-span-1">
          <label
            :for="keyId(row)"
            class="block text-xs font-semibold text-neutral-dark mb-1 sm:sr-only"
          >
            {{ keyLabel }} {{ index + 1 }}
          </label>
          <input
            :id="keyId(row)"
            v-model="row.key"
            type="text"
            :placeholder="keyPlaceholder"
            :disabled="disabled"
            :aria-invalid="errors[keyId(row)] ? 'true' : undefined"
            :aria-describedby="rowError(row) ? errorId(row) : undefined"
            :class="fieldClass(!!errors[keyId(row)])"
          />
        </div>
        <div>
          <label
            :for="valueId(row)"
            class="block text-xs font-semibold text-neutral-dark mb-1 sm:sr-only"
          >
            {{ valueLabel }} {{ index + 1 }}
          </label>
          <input
            :id="valueId(row)"
            v-model="row.value"
            type="text"
            :placeholder="valuePlaceholder"
            :disabled="disabled"
            :aria-invalid="errors[valueId(row)] ? 'true' : undefined"
            :aria-describedby="rowError(row) ? errorId(row) : undefined"
            :class="fieldClass(!!errors[valueId(row)])"
          />
        </div>
        <UiButton
          variant="ghost"
          size="icon"
          class="text-stone-500 hover:text-rose-600"
          :disabled="disabled"
          :title="`Remover ${keyLabel.toLowerCase()} ${index + 1}`"
          :aria-label="`Remover ${keyLabel.toLowerCase()} ${index + 1}`"
          @click="removeRow(row.id)"
        >
          <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
        </UiButton>
      </div>
      <p v-if="rowError(row)" :id="errorId(row)" :class="ERROR_TEXT_CLASS">
        {{ rowError(row) }}
      </p>
    </div>

    <p v-if="rows.length === 0" class="text-xs text-stone-500">
      {{ emptyText }}
    </p>

    <UiButton variant="outline" size="xs" :disabled="disabled" @click="addRow">
      <Icon icon="mdi:plus" class="w-4 h-4" />
      {{ addLabel }}
    </UiButton>
  </div>
</template>
