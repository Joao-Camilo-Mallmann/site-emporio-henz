<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
import type { CatalogAvailability, ColorGroupSlug } from "@/types";
import {
  CORES_FILTRO_INICIAIS,
  CORES_GRUPOS,
  encontrarGrupoCor,
} from "@/utils/coresMoveis";
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  disponibilidade: CatalogAvailability[];
  cores: ColorGroupSlug[];
  minPreco?: number;
  maxPreco?: number;
}>();

const emit = defineEmits<{
  (e: "update:disponibilidade", value: CatalogAvailability[]): void;
  (e: "update:cores", value: ColorGroupSlug[]): void;
  (e: "update:minPreco", value: number | undefined): void;
  (e: "update:maxPreco", value: number | undefined): void;
  (e: "change"): void;
}>();

const availabilityOptions: { value: CatalogAvailability; label: string }[] = [
  { value: "IN_STOCK", label: "Pronta Entrega" },
  { value: "ON_DEMAND", label: "Sob Encomenda" },
];

function toggleAvailability(value: CatalogAvailability) {
  const next = [...props.disponibilidade];
  const index = next.indexOf(value);
  if (index > -1) next.splice(index, 1);
  else next.push(value);
  emit("update:disponibilidade", next);
  emit("change");
}

const initialColorSlugs = new Set(
  CORES_GRUPOS.slice(0, CORES_FILTRO_INICIAIS).map((item) => item.slug),
);
const showAllColors = ref(
  props.cores.some((slug) => !initialColorSlugs.has(slug)),
);

watch(
  () => props.cores,
  (nextCores) => {
    if (nextCores.some((slug) => !initialColorSlugs.has(slug))) {
      showAllColors.value = true;
    }
  },
  { deep: true },
);

const visibleColorGroups = computed(() =>
  showAllColors.value
    ? CORES_GRUPOS
    : CORES_GRUPOS.slice(0, CORES_FILTRO_INICIAIS),
);

const selectedColorNames = computed(() =>
  props.cores
    .map((slug) => encontrarGrupoCor(slug)?.name)
    .filter((name): name is string => Boolean(name)),
);

function toggleColorGroup(slug: ColorGroupSlug) {
  const next = [...props.cores];
  const index = next.indexOf(slug);
  if (index > -1) next.splice(index, 1);
  else next.push(slug);
  emit("update:cores", next);
  emit("change");
}

// Slider de faixa de preço (dois pontos)
const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 100;

const sliderMin = computed<number>({
  get: () => props.minPreco ?? PRICE_MIN,
  set: (v) => {
    const clamped = Math.min(v, sliderMax.value - PRICE_STEP);
    emit("update:minPreco", clamped <= PRICE_MIN ? undefined : clamped);
  },
});

const sliderMax = computed<number>({
  get: () => props.maxPreco ?? PRICE_MAX,
  set: (v) => {
    const clamped = Math.max(v, sliderMin.value + PRICE_STEP);
    emit("update:maxPreco", clamped >= PRICE_MAX ? undefined : clamped);
  },
});

const minPercent = computed(
  () => ((sliderMin.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100,
);
const maxPercent = computed(
  () => ((sliderMax.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100,
);

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
</script>

<template>
  <!-- Seção: Disponibilidade -->
  <div class="mb-5">
    <h3 class="text-sm font-bold text-stone-900 mb-2.5">Disponibilidade</h3>
    <div class="space-y-2.5">
      <label
        v-for="opt in availabilityOptions"
        :key="opt.value"
        class="flex items-center gap-2.5 text-xs sm:text-sm text-stone-700 cursor-pointer select-none group"
      >
        <input
          type="checkbox"
          :checked="disponibilidade.includes(opt.value)"
          class="w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary/20 cursor-pointer"
          @change="toggleAvailability(opt.value)"
        />
        <span class="group-hover:text-stone-900 transition-colors">{{
          opt.label
        }}</span>
      </label>
    </div>
  </div>

  <hr class="border-stone-200 my-4" />

  <!-- Seção: Cor -->
  <div class="mb-5">
    <h3 class="text-sm font-bold text-stone-900 mb-3">Cor</h3>
    <div class="flex flex-wrap gap-2.5">
      <UiButton
        v-for="cor in visibleColorGroups"
        :key="cor.slug"
        variant="custom"
        size="none"
        class="w-9 h-9 rounded-full p-0.5 border transition-all"
        :class="
          cores.includes(cor.slug)
            ? 'border-secondary ring-2 ring-secondary/25'
            : 'border-stone-300 hover:border-stone-500'
        "
        :title="cor.name"
        :aria-label="`Filtrar por cor ${cor.name}`"
        :aria-pressed="cores.includes(cor.slug)"
        @click="toggleColorGroup(cor.slug)"
      >
        <span
          class="w-full h-full rounded-full border border-black/10 flex items-center justify-center"
          :style="{ backgroundColor: cor.hex }"
        >
          <Icon
            v-if="cores.includes(cor.slug)"
            icon="mdi:check"
            class="w-4 h-4"
            :class="cor.light ? 'text-neutral-dark' : 'text-white'"
          />
        </span>
      </UiButton>
    </div>
    <p v-if="selectedColorNames.length > 0" class="mt-2 text-xs text-stone-600">
      {{ selectedColorNames.join(", ") }}
    </p>
    <UiButton
      variant="link"
      size="none"
      class="mt-2.5 inline-flex items-center gap-1 text-xs font-normal text-stone-600 hover:text-stone-900 no-underline hover:no-underline"
      :aria-expanded="showAllColors"
      @click="showAllColors = !showAllColors"
    >
      <Icon
        :icon="showAllColors ? 'mdi:chevron-up' : 'mdi:chevron-down'"
        class="w-4 h-4"
      />
      <span>{{ showAllColors ? "Ver menos" : "Ver mais" }}</span>
    </UiButton>
  </div>

  <hr class="border-stone-200 my-4" />

  <!-- Seção: Faixa de Preço -->
  <div class="mb-6">
    <h3 class="text-sm font-bold text-stone-900 mb-2.5">Faixa de preço</h3>

    <div
      class="flex items-center justify-between text-xs sm:text-sm text-stone-700 mb-3"
    >
      <span>{{ formatPrice(sliderMin) }}</span>
      <span>{{
        sliderMax >= PRICE_MAX
          ? `${formatPrice(PRICE_MAX)}+`
          : formatPrice(sliderMax)
      }}</span>
    </div>

    <div class="price-slider relative h-6 mx-1">
      <!-- Trilho e faixa selecionada -->
      <div
        class="absolute top-1/2 -translate-y-1/2 h-1 w-full rounded bg-stone-200"
      ></div>
      <div
        class="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-secondary"
        :style="{
          left: minPercent + '%',
          width: maxPercent - minPercent + '%',
        }"
      ></div>

      <input
        v-model.number="sliderMin"
        type="range"
        :min="PRICE_MIN"
        :max="PRICE_MAX"
        :step="PRICE_STEP"
        aria-label="Preço mínimo"
        @input="emit('change')"
      />
      <input
        v-model.number="sliderMax"
        type="range"
        :min="PRICE_MIN"
        :max="PRICE_MAX"
        :step="PRICE_STEP"
        aria-label="Preço máximo"
        @input="emit('change')"
      />
    </div>
  </div>
</template>

<style scoped>
/* Dois <input type="range"> sobrepostos: só as bolinhas recebem clique */
.price-slider input[type="range"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.price-slider input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  background: transparent;
}

.price-slider input[type="range"]::-moz-range-track {
  height: 4px;
  background: transparent;
}

.price-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  width: 18px;
  height: 18px;
  margin-top: -7px;
  border-radius: 9999px;
  background: white;
  border: 2px solid var(--color-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.price-slider input[type="range"]::-moz-range-thumb {
  pointer-events: auto;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: white;
  border: 2px solid var(--color-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
</style>
