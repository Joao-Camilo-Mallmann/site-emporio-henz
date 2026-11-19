<script setup lang="ts">
import type { ColorGroupSlug, FieldErrors, VariationFormItem } from "@/types";
import {
  CORES_GRUPOS,
  encontrarCorPorHex,
  filtrarCoresMoveis,
  rotuloCorHex,
} from "@/utils/coresMoveis";
import {
  ERROR_TEXT_CLASS,
  LABEL_CLASS,
  normalizeHexColor,
  variationFieldId,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";

// Aparência e disponibilidade de uma variação: seletor direto da paleta de 50
// cores de móveis, detalhes de acabamento e estoque. Edita direto no `v-model`.

const variation = defineModel<VariationFormItem>({ required: true });

const props = withDefaults(
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

const activeGroup = ref<ColorGroupSlug | "todas">("todas");
const colorSearch = ref("");

const ids = computed(() => {
  const key = variation.value.key;
  return {
    search: `variation-${key}-color-search`,
    details: variationFieldId.details(key),
    inStock: variationFieldId.inStock(key),
  };
});

const selectedColors = computed(() =>
  variation.value.colorsHex.map((hex, index) => {
    const normalized = normalizeHexColor(hex);
    const preset = encontrarCorPorHex(normalized);
    return {
      index,
      hex: normalized,
      name: preset?.name ?? rotuloCorHex(normalized),
      isLegacy: !preset,
    };
  }),
);

const selectedHexSet = computed(
  () =>
    new Set(
      variation.value.colorsHex.map((hex) =>
        normalizeHexColor(hex).toUpperCase(),
      ),
    ),
);

const filteredPalette = computed(() =>
  filtrarCoresMoveis(activeGroup.value, colorSearch.value),
);

const colorErrors = computed(() => {
  const prefix = `variation-${variation.value.key}-color-`;
  return Object.entries(props.errors)
    .filter(([field]) => field.startsWith(prefix))
    .map(([, message]) => message);
});

function isColorSelected(hex: string): boolean {
  return selectedHexSet.value.has(hex.toUpperCase());
}

function togglePaletteColor(hex: string) {
  if (props.locked) return;
  const normalized = normalizeHexColor(hex).toUpperCase();
  const existingIndex = variation.value.colorsHex.findIndex(
    (item) => normalizeHexColor(item).toUpperCase() === normalized,
  );
  if (existingIndex > -1) {
    variation.value.colorsHex.splice(existingIndex, 1);
  } else {
    variation.value.colorsHex.push(normalized);
  }
}

function removeColor(index: number) {
  if (props.locked) return;
  variation.value.colorsHex.splice(index, 1);
}
</script>

<template>
  <div class="space-y-5">
    <!-- Cores -->
    <fieldset
      :id="variationFieldId.color(variation.key, 0)"
      class="min-w-0"
    >
      <legend :class="LABEL_CLASS">Cores</legend>
      <p class="text-xs text-stone-500 mb-3">
        Selecione uma ou mais cores da paleta. Uma cor mostra um círculo sólido;
        duas, dividido ao meio; três ou mais, fatias iguais.
      </p>

      <!-- Cores escolhidas -->
      <div class="mb-3">
        <div
          v-if="selectedColors.length > 0"
          class="flex flex-wrap items-center gap-2"
        >
          <span
            v-for="item in selectedColors"
            :key="`${item.hex}-${item.index}`"
            class="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white pl-1.5 pr-1 py-1 text-xs text-neutral-dark shadow-2xs"
          >
            <span
              class="w-4 h-4 rounded-full border border-black/15 shrink-0"
              :style="{ backgroundColor: item.hex }"
            />
            <span class="font-medium">{{ item.name }}</span>
            <span
              v-if="item.isLegacy"
              class="text-[11px] text-stone-400"
              title="Cor salva anteriormente fora da paleta padrão"
            >
              (legada)
            </span>
            <UiButton
              variant="ghost"
              size="none"
              class="w-5 h-5 rounded-full text-stone-400 hover:text-rose-600"
              :disabled="locked"
              :title="`Remover ${item.name}`"
              :aria-label="`Remover cor ${item.name}`"
              @click="removeColor(item.index)"
            >
              <Icon icon="mdi:close" class="w-3.5 h-3.5" />
            </UiButton>
          </span>
        </div>
        <p v-else class="text-xs text-stone-500">
          Nenhuma cor selecionada. Clique em uma cor abaixo para adicionar.
        </p>
      </div>

      <!-- Painel de seleção direta das 50 cores -->
      <div
        class="rounded-xl border border-stone-200 bg-white p-3 space-y-3"
        :class="{ 'opacity-65': locked }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <div class="flex-1 min-w-0">
            <UiInput
              :id="ids.search"
              v-model="colorSearch"
              type="search"
              size="sm"
              prefix-icon="mdi:magnify"
              aria-label="Buscar cor na paleta"
              placeholder="Buscar cor (ex.: Freijó, Off-White, Fendi)..."
              :disabled="locked"
            />
          </div>
          <span class="text-xs text-stone-500 shrink-0">
            {{ filteredPalette.length }} de 50 cores
          </span>
        </div>

        <!-- Filtro rápido por família -->
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar paleta por família">
          <UiButton
            variant="custom"
            size="none"
            class="px-2.5 py-1 rounded-full border text-xs transition-colors"
            :class="
              activeGroup === 'todas'
                ? 'bg-sky-50 border-secondary text-secondary font-medium'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-400'
            "
            :disabled="locked"
            :aria-pressed="activeGroup === 'todas'"
            @click="activeGroup = 'todas'"
          >
            Todas
          </UiButton>
          <UiButton
            v-for="grupo in CORES_GRUPOS"
            :key="grupo.slug"
            variant="custom"
            size="none"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors"
            :class="
              activeGroup === grupo.slug
                ? 'bg-sky-50 border-secondary text-secondary font-medium'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-400'
            "
            :disabled="locked"
            :aria-pressed="activeGroup === grupo.slug"
            @click="activeGroup = grupo.slug"
          >
            <span
              class="w-3 h-3 rounded-full border border-black/15 shrink-0"
              :style="{ backgroundColor: grupo.hex }"
            />
            <span>{{ grupo.name }}</span>
          </UiButton>
        </div>

        <!-- Grade das cores -->
        <div
          v-if="filteredPalette.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1"
        >
          <UiButton
            v-for="cor in filteredPalette"
            :key="cor.slug"
            variant="custom"
            size="none"
            class="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all"
            :class="
              isColorSelected(cor.hex)
                ? 'border-secondary bg-sky-50 text-neutral-dark font-medium ring-1 ring-secondary/25'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
            "
            :disabled="locked"
            :title="cor.name"
            :aria-pressed="isColorSelected(cor.hex)"
            @click="togglePaletteColor(cor.hex)"
          >
            <span
              class="w-5 h-5 rounded-full border border-black/15 shrink-0 flex items-center justify-center"
              :style="{ backgroundColor: cor.hex }"
            >
              <Icon
                v-if="isColorSelected(cor.hex)"
                icon="mdi:check"
                class="w-3.5 h-3.5"
                :class="cor.light ? 'text-neutral-dark' : 'text-white'"
              />
            </span>
            <span class="text-xs truncate">{{ cor.name }}</span>
          </UiButton>
        </div>
        <p v-else class="text-xs text-stone-500 text-center py-4">
          Nenhuma cor encontrada para “{{ colorSearch }}”.
        </p>
      </div>

      <p
        v-for="(message, idx) in colorErrors"
        :key="idx"
        :class="ERROR_TEXT_CLASS"
      >
        {{ message }}
      </p>
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
    <label
      :for="ids.inStock"
      class="flex items-start gap-3 cursor-pointer select-none"
    >
      <input
        :id="ids.inStock"
        v-model="variation.inStock"
        type="checkbox"
        :disabled="locked"
        class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
      />
      <span>
        <span class="text-sm font-medium text-neutral-dark block">
          Em estoque
        </span>
        <span class="text-xs text-stone-500 block mt-0.5">
          Desmarque se este acabamento está indisponível no momento.
        </span>
      </span>
    </label>
  </div>
</template>
