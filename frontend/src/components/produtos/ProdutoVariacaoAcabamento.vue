<script setup lang="ts">
import type { FieldErrors, VariationFormItem } from "@/types";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import {
  DEFAULT_VARIATION_COLOR,
  ERROR_TEXT_CLASS,
  fieldClass,
  LABEL_CLASS,
  variationFieldId,
} from "@/utils/produtos/produtoFormConstantes";
import {
  isHexColor,
  normalizeHexColor,
} from "@/utils/produtos/produtoFormEstado";

// Aparência e disponibilidade de uma variação: cores, detalhes de acabamento
// e estoque. Edita os campos direto no item recebido por `v-model`.

const variation = defineModel<VariationFormItem>({ required: true });

withDefaults(
  defineProps<{
    errors?: FieldErrors;
    /** Trava a edição (salvando ou produto já criado). */
    locked?: boolean;
  }>(),
  {
    errors: () => ({}),
    locked: false,
  },
);

const ids = computed(() => {
  const key = variation.value.key;
  return {
    details: variationFieldId.details(key),
    inStock: variationFieldId.inStock(key),
  };
});

function colorId(index: number) {
  return variationFieldId.color(variation.value.key, index);
}

function addColor() {
  const colors = variation.value.colorsHex;
  const last = colors[colors.length - 1];
  colors.push(last && isHexColor(last) ? last : DEFAULT_VARIATION_COLOR);
}

function removeColor(index: number) {
  variation.value.colorsHex.splice(index, 1);
}

function setColor(index: number, value: string) {
  variation.value.colorsHex[index] = normalizeHexColor(value);
}

function pickerValue(color: string) {
  const normalized = normalizeHexColor(color);
  return isHexColor(normalized) ? normalized.toLowerCase() : "#000000";
}
</script>

<template>
  <div class="space-y-5">
    <!-- Cores -->
    <fieldset class="min-w-0">
      <legend :class="LABEL_CLASS">Cores</legend>
      <p class="text-xs text-stone-500 mb-3">
        Uma cor mostra um círculo sólido; duas, um círculo dividido ao meio; três
        ou mais, fatias iguais.
      </p>
      <div class="space-y-2">
        <div v-for="(color, colorIndex) in variation.colorsHex" :key="colorIndex">
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="pickerValue(color)"
              :disabled="locked"
              :aria-label="`Escolher a cor ${colorIndex + 1}`"
              class="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60"
              @input="setColor(colorIndex, ($event.target as HTMLInputElement).value)"
            />
            <label :for="colorId(colorIndex)" class="sr-only">
              Código da cor {{ colorIndex + 1 }} (#RRGGBB)
            </label>
            <input
              :id="colorId(colorIndex)"
              v-model="variation.colorsHex[colorIndex]"
              type="text"
              maxlength="7"
              placeholder="#RRGGBB"
              spellcheck="false"
              autocomplete="off"
              :disabled="locked"
              :aria-invalid="errors[colorId(colorIndex)] ? 'true' : undefined"
              :aria-describedby="
                errors[colorId(colorIndex)] ? `${colorId(colorIndex)}-error` : undefined
              "
              :class="[fieldClass(!!errors[colorId(colorIndex)]), 'font-mono uppercase max-w-40']"
              @change="setColor(colorIndex, ($event.target as HTMLInputElement).value)"
            />
            <UiButton
              variant="ghost"
              size="icon"
              class="text-stone-500 hover:text-rose-600"
              :disabled="locked"
              :title="`Remover a cor ${colorIndex + 1}`"
              :aria-label="`Remover a cor ${colorIndex + 1}`"
              @click="removeColor(colorIndex)"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
            </UiButton>
          </div>
          <p
            v-if="errors[colorId(colorIndex)]"
            :id="`${colorId(colorIndex)}-error`"
            :class="ERROR_TEXT_CLASS"
          >
            {{ errors[colorId(colorIndex)] }}
          </p>
        </div>
        <p v-if="variation.colorsHex.length === 0" class="text-xs text-stone-500">
          Nenhuma cor definida.
        </p>
      </div>
      <UiButton
        variant="outline"
        size="xs"
        class="mt-3"
        :disabled="locked"
        @click="addColor"
      >
        <Icon icon="mdi:palette-outline" class="w-4 h-4" />
        Adicionar cor
      </UiButton>
    </fieldset>

    <!-- Detalhes de acabamento -->
    <fieldset class="min-w-0">
      <legend :class="LABEL_CLASS">Detalhes de acabamento</legend>
      <p class="text-xs text-stone-500 mb-3">
        Materiais por parte do móvel, como corpo, portas e puxadores.
      </p>
      <KeyValueEditor
        v-model="variation.finishDetails"
        :id-prefix="ids.details"
        :errors="errors"
        :disabled="locked"
        key-label="Parte"
        value-label="Acabamento"
        key-placeholder="Ex.: Portas"
        value-placeholder="Ex.: Off White"
        add-label="Adicionar detalhe"
        empty-text="Nenhum detalhe de acabamento."
      />
    </fieldset>

    <!-- Estoque -->
    <label :for="ids.inStock" class="flex items-start gap-3 cursor-pointer select-none">
      <input
        :id="ids.inStock"
        v-model="variation.inStock"
        type="checkbox"
        :disabled="locked"
        class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
      />
      <span>
        <span class="text-sm font-medium text-neutral-dark block">Em estoque</span>
        <span class="text-xs text-stone-500 block mt-0.5">
          Desmarque se este acabamento está indisponível no momento.
        </span>
      </span>
    </label>
  </div>
</template>
