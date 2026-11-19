<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
import { encontrarCategoria, useCategoriasStore } from "@/stores/categorias";
import type {
  CatalogAvailability,
  CatalogFilterParams,
  ColorGroupSlug,
  Subtype,
} from "@/types";
import {
  CORES_FILTRO_INICIAIS,
  CORES_GRUPOS,
  encontrarGrupoCor,
} from "@/utils/coresMoveis";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  filters: CatalogFilterParams;
}>();

const emit = defineEmits<{
  (e: "update:filters", value: CatalogFilterParams): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

// Categorias e subtipos ativos vindos de GET /categorias (mesma fonte da navbar)
const categoriasStore = useCategoriasStore();
const {
  lista: categorias,
  loading: categoriasLoading,
  error: categoriasError,
} = storeToRefs(categoriasStore);

onMounted(() => {
  categoriasStore.carregar();
});

// Estado local reativo sincronizado com props.filters
const localCategoria = ref(props.filters.categoria || "");
const localSubcategoria = ref(props.filters.subcategoria || "");
const localDisponibilidade = ref<CatalogAvailability[]>([
  ...(props.filters.disponibilidade || []),
]);
const localCores = ref<ColorGroupSlug[]>([...(props.filters.cores || [])]);
const localMinPreco = ref<number | undefined>(props.filters.minPreco);
const localMaxPreco = ref<number | undefined>(props.filters.maxPreco);

const initialColorSlugs = new Set(
  CORES_GRUPOS.slice(0, CORES_FILTRO_INICIAIS).map((item) => item.slug),
);
const showAllColors = ref(
  localCores.value.some((slug) => !initialColorSlugs.has(slug)),
);

watch(
  () => props.filters,
  (newVal) => {
    localCategoria.value = newVal.categoria || "";
    localSubcategoria.value = newVal.subcategoria || "";
    localDisponibilidade.value = [...(newVal.disponibilidade || [])];
    localCores.value = [...(newVal.cores || [])];
    localMinPreco.value = newVal.minPreco;
    localMaxPreco.value = newVal.maxPreco;
    if (localCores.value.some((slug) => !initialColorSlugs.has(slug))) {
      showAllColors.value = true;
    }
  },
  { deep: true },
);

// A URL guarda o slug da categoria e o nome (ou slug) do subtipo
const categoriaSelecionada = computed(() =>
  localCategoria.value
    ? encontrarCategoria(categorias.value, slugify(localCategoria.value))
    : undefined,
);

const subcategoriasDisponiveis = computed<Subtype[]>(
  () => categoriaSelecionada.value?.subtypes ?? [],
);

function isCategoriaAtiva(slug: string) {
  return categoriaSelecionada.value?.slug === slug;
}

function isSubcategoriaAtiva(sub: Subtype) {
  if (!localSubcategoria.value) return false;
  const alvo = slugify(localSubcategoria.value);
  return sub.slug === alvo || slugify(sub.name) === alvo;
}

function toggleCategory(slug: string) {
  localCategoria.value = isCategoriaAtiva(slug) ? "" : slug;
  localSubcategoria.value = "";
  emitFilterChange();
  emit("apply");
}

function toggleSubcategory(sub: Subtype) {
  localSubcategoria.value = isSubcategoriaAtiva(sub) ? "" : sub.name;
  emitFilterChange();
  emit("apply");
}

const availabilityOptions: { value: CatalogAvailability; label: string }[] = [
  { value: "IN_STOCK", label: "Pronta Entrega" },
  { value: "ON_DEMAND", label: "Sob Encomenda" },
];

function toggleAvailability(value: CatalogAvailability) {
  const index = localDisponibilidade.value.indexOf(value);
  if (index > -1) localDisponibilidade.value.splice(index, 1);
  else localDisponibilidade.value.push(value);
  emitFilterChange();
}

const visibleColorGroups = computed(() =>
  showAllColors.value
    ? CORES_GRUPOS
    : CORES_GRUPOS.slice(0, CORES_FILTRO_INICIAIS),
);

const selectedColorNames = computed(() =>
  localCores.value
    .map((slug) => encontrarGrupoCor(slug)?.name)
    .filter((name): name is string => Boolean(name)),
);

function toggleColorGroup(slug: ColorGroupSlug) {
  const index = localCores.value.indexOf(slug);
  if (index > -1) localCores.value.splice(index, 1);
  else localCores.value.push(slug);
  emitFilterChange();
}

// Slider de faixa de preço (dois pontos)
const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 100;

const sliderMin = computed<number>({
  get: () => localMinPreco.value ?? PRICE_MIN,
  set: (v) => {
    const clamped = Math.min(v, sliderMax.value - PRICE_STEP);
    localMinPreco.value = clamped <= PRICE_MIN ? undefined : clamped;
  },
});

const sliderMax = computed<number>({
  get: () => localMaxPreco.value ?? PRICE_MAX,
  set: (v) => {
    const clamped = Math.max(v, sliderMin.value + PRICE_STEP);
    localMaxPreco.value = clamped >= PRICE_MAX ? undefined : clamped;
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

function emitFilterChange() {
  const updated: CatalogFilterParams = {
    ...props.filters,
    categoria: localCategoria.value || undefined,
    subcategoria: localSubcategoria.value || undefined,
    disponibilidade: localDisponibilidade.value.length
      ? [...localDisponibilidade.value]
      : undefined,
    cores: localCores.value.length ? [...localCores.value] : undefined,
    minPreco: localMinPreco.value,
    maxPreco: localMaxPreco.value,
    page: 1,
  };
  emit("update:filters", updated);
}

function handleApply() {
  emitFilterChange();
  emit("apply");
}

function handleReset() {
  localCategoria.value = "";
  localSubcategoria.value = "";
  localDisponibilidade.value = [];
  localCores.value = [];
  localMinPreco.value = undefined;
  localMaxPreco.value = undefined;

  const resetFilters: CatalogFilterParams = {
    name: props.filters.name,
    page: 1,
    limit: props.filters.limit,
  };
  emit("update:filters", resetFilters);
  emit("reset");
}
</script>

<template>
  <!-- Barra lateral limpa e integrada, sem bordas de card externo conforme FrontBusca.png -->
  <aside class="w-full text-stone-900">
    <!-- Título Filtros (oculto no drawer mobile para evitar duplicação) -->
    <h2
      class="hidden lg:block text-xl sm:text-2xl font-bold text-neutral-dark mb-6 tracking-tight"
    >
      Filtros
    </h2>

    <!-- Seção: Categoria -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Categoria</h3>
      <div
        v-if="categoriasLoading && categorias.length === 0"
        class="flex flex-wrap gap-2"
        aria-hidden="true"
      >
        <span
          v-for="n in 6"
          :key="n"
          class="h-7 w-20 rounded-lg bg-stone-100 animate-pulse"
        ></span>
      </div>
      <p
        v-else-if="categorias.length === 0"
        class="text-xs text-stone-500"
        role="status"
      >
        {{
          categoriasError
            ? "Não foi possível carregar as categorias."
            : "Nenhuma categoria cadastrada."
        }}
      </p>
      <div v-else class="flex flex-wrap gap-2">
        <UiButton
          v-for="cat in categorias"
          :key="cat.id"
          variant="custom"
          size="xs"
          class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
          :class="
            isCategoriaAtiva(cat.slug)
              ? 'bg-sky-50 border-secondary text-secondary font-medium'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          "
          :aria-pressed="isCategoriaAtiva(cat.slug)"
          @click="toggleCategory(cat.slug)"
        >
          <span
            v-if="isCategoriaAtiva(cat.slug)"
            class="text-xs font-bold leading-none mr-1"
            >✕</span
          >
          <span>{{ cat.name }}</span>
        </UiButton>
      </div>
    </div>

    <!-- Divisória Sutil de Seção -->
    <hr class="border-stone-200 my-4" />

    <!-- Seção: Subcategoria (subtipos da categoria escolhida) -->
    <template v-if="subcategoriasDisponiveis.length > 0">
      <div class="mb-5">
        <h3 class="text-sm font-bold text-stone-900 mb-2.5">Subcategoria</h3>
        <div class="flex flex-wrap gap-2">
          <UiButton
            v-for="sub in subcategoriasDisponiveis"
            :key="sub.id"
            variant="custom"
            size="xs"
            class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
            :class="
              isSubcategoriaAtiva(sub)
                ? 'bg-sky-50 border-secondary text-secondary font-medium'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
            "
            :aria-pressed="isSubcategoriaAtiva(sub)"
            @click="toggleSubcategory(sub)"
          >
            <span
              v-if="isSubcategoriaAtiva(sub)"
              class="text-xs font-bold leading-none mr-1"
            >
              ✕
            </span>
            <span>{{ sub.name }}</span>
          </UiButton>
        </div>
      </div>

      <hr class="border-stone-200 my-4" />
    </template>

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
            :checked="localDisponibilidade.includes(opt.value)"
            @change="toggleAvailability(opt.value)"
            class="w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary/20 cursor-pointer"
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
            localCores.includes(cor.slug)
              ? 'border-secondary ring-2 ring-secondary/25'
              : 'border-stone-300 hover:border-stone-500'
          "
          :title="cor.name"
          :aria-label="`Filtrar por cor ${cor.name}`"
          :aria-pressed="localCores.includes(cor.slug)"
          @click="toggleColorGroup(cor.slug)"
        >
          <span
            class="w-full h-full rounded-full border border-black/10 flex items-center justify-center"
            :style="{ backgroundColor: cor.hex }"
          >
            <Icon
              v-if="localCores.includes(cor.slug)"
              icon="mdi:check"
              class="w-4 h-4"
              :class="cor.light ? 'text-neutral-dark' : 'text-white'"
            />
          </span>
        </UiButton>
      </div>
      <p
        v-if="selectedColorNames.length > 0"
        class="mt-2 text-xs text-stone-600"
      >
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

      <div class="flex items-center justify-between text-xs sm:text-sm text-stone-700 mb-3">
        <span>{{ formatPrice(sliderMin) }}</span>
        <span>{{
          sliderMax >= PRICE_MAX
            ? `${formatPrice(PRICE_MAX)}+`
            : formatPrice(sliderMax)
        }}</span>
      </div>

      <div class="price-slider relative h-6 mx-1">
        <!-- Trilho e faixa selecionada -->
        <div class="absolute top-1/2 -translate-y-1/2 h-1 w-full rounded bg-stone-200"></div>
        <div
          class="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-secondary"
          :style="{ left: minPercent + '%', width: maxPercent - minPercent + '%' }"
        ></div>

        <input
          v-model.number="sliderMin"
          type="range"
          :min="PRICE_MIN"
          :max="PRICE_MAX"
          :step="PRICE_STEP"
          aria-label="Preço mínimo"
          @input="emitFilterChange"
        />
        <input
          v-model.number="sliderMax"
          type="range"
          :min="PRICE_MIN"
          :max="PRICE_MAX"
          :step="PRICE_STEP"
          aria-label="Preço máximo"
          @input="emitFilterChange"
        />
      </div>
    </div>

    <!-- Botões de Ação com UiButton -->
    <div class="space-y-2 pt-2">
      <UiButton
        size="md"
        variant="primary"
        class="w-full shadow-xs text-xs font-semibold py-2.5 lg:hidden"
        @click="handleApply"
      >Filtrar</UiButton>
      <UiButton
        variant="outline"
        size="md"
        class="w-full text-xs font-medium py-2 text-stone-600 hover:text-stone-900"
        @click="handleReset"
      >Limpar filtros</UiButton>
    </div>
  </aside>
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
