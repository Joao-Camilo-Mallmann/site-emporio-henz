<script setup lang="ts">
import { catalogoApi } from "@/api/catalogo";
import UiButton from "@/components/ui/UiButton.vue";
import type {
  CatalogAvailability,
  CatalogFilterParams,
  ICategory,
  ISubtype,
} from "@/types";
import { slugify } from "@/utils/slug";
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  filters: CatalogFilterParams;
}>();

const emit = defineEmits<{
  (e: "update:filters", value: CatalogFilterParams): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

// Estado local reativo sincronizado com props.filters
const localCategoria = ref(props.filters.categoria || "");
const localSubcategoria = ref(props.filters.subcategoria || "");
const localDisponibilidade = ref<CatalogAvailability[]>([
  ...(props.filters.disponibilidade || []),
]);
const localMinPreco = ref<number | undefined>(props.filters.minPreco);
const localMaxPreco = ref<number | undefined>(props.filters.maxPreco);

watch(
  () => props.filters,
  (newVal) => {
    localCategoria.value = newVal.categoria || "";
    localSubcategoria.value = newVal.subcategoria || "";
    localDisponibilidade.value = [...(newVal.disponibilidade || [])];
    localMinPreco.value = newVal.minPreco;
    localMaxPreco.value = newVal.maxPreco;
  },
  { deep: true },
);

// Categorias ativas e seus subtipos, vindos de GET /categorias (uma carga, com cache na camada de API)
const categorias = ref<ICategory[]>([]);

onMounted(async () => {
  try {
    categorias.value = await catalogoApi.carregarCategorias();
  } catch {
    categorias.value = [];
  }
});

const categoriaSelecionada = computed<ICategory | undefined>(() => {
  const alvo = slugify(localCategoria.value);
  return alvo ? categorias.value.find((c) => c.slug === alvo) : undefined;
});

const subtiposDisponiveis = computed<ISubtype[]>(
  () => categoriaSelecionada.value?.subtypes ?? [],
);

function isCategoriaAtiva(categoria: ICategory) {
  return categoriaSelecionada.value?.id === categoria.id;
}

function isSubtipoAtivo(subtipo: ISubtype) {
  return slugify(localSubcategoria.value) === subtipo.slug;
}

function toggleCategory(categoria: ICategory) {
  localCategoria.value = isCategoriaAtiva(categoria) ? "" : categoria.slug;
  localSubcategoria.value = "";
  emitFilterChange();
  emit("apply");
}

function toggleSubcategory(subtipo: ISubtype) {
  localSubcategoria.value = isSubtipoAtivo(subtipo) ? "" : subtipo.slug;
  emitFilterChange();
  emit("apply");
}

const availabilityOptions: { value: CatalogAvailability; label: string }[] = [
  { value: "IN_STOCK", label: "Pronta Entrega" },
  { value: "ON_DEMAND", label: "Sob Encomenda" },
];

function toggleAvailability(value: CatalogAvailability) {
  const index = localDisponibilidade.value.indexOf(value);
  if (index > -1) {
    localDisponibilidade.value.splice(index, 1);
  } else {
    localDisponibilidade.value.push(value);
  }
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

    <!-- Seção: Categoria (chips vindos de GET /categorias) -->
    <template v-if="categorias.length > 0">
      <div class="mb-5">
        <h3 class="text-sm font-bold text-stone-900 mb-2.5">Categoria</h3>
        <div class="flex flex-wrap gap-2">
          <UiButton
            v-for="cat in categorias"
            :key="cat.id"
            variant="custom"
            size="xs"
            class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
            :class="
              isCategoriaAtiva(cat)
                ? 'bg-sky-50 border-secondary text-secondary font-medium'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
            "
            @click="toggleCategory(cat)"
          >
            <span
              v-if="isCategoriaAtiva(cat)"
              class="text-xs font-bold leading-none mr-1"
              >✕</span
            >
            <span>{{ cat.name }}</span>
          </UiButton>
        </div>
      </div>

      <hr class="border-stone-200 my-4" />
    </template>

    <!-- Seção: Subcategoria (subtipos da categoria selecionada) -->
    <template v-if="subtiposDisponiveis.length > 0">
      <div class="mb-5">
        <h3 class="text-sm font-bold text-stone-900 mb-2.5">Subcategoria</h3>
        <div class="flex flex-wrap gap-2">
          <UiButton
            v-for="sub in subtiposDisponiveis"
            :key="sub.id"
            variant="custom"
            size="xs"
            class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
            :class="
              isSubtipoAtivo(sub)
                ? 'bg-sky-50 border-secondary text-secondary font-medium'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
            "
            @click="toggleSubcategory(sub)"
          >
            <span
              v-if="isSubtipoAtivo(sub)"
              class="text-xs font-bold leading-none mr-1"
              >✕</span
            >
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
      >
        Filtrar
      </UiButton>
      <UiButton
        variant="outline"
        size="md"
        class="w-full text-xs font-medium py-2 text-stone-600 hover:text-stone-900"
        @click="handleReset"
      >
        Limpar filtros
      </UiButton>
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
  background: #fff;
  border: 2px solid var(--color-secondary, #007cd8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.price-slider input[type="range"]::-moz-range-thumb {
  pointer-events: auto;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid var(--color-secondary, #007cd8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
</style>
