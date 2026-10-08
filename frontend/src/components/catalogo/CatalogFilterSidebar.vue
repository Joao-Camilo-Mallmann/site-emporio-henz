<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
import type { CatalogFilterParams } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, defineEmits, defineProps, ref, watch } from "vue";

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
const localMateriais = ref<string[]>([...(props.filters.materiais || [])]);
const localCores = ref<string[]>([...(props.filters.cores || [])]);
const localMarcas = ref<string[]>([...(props.filters.marcas || [])]);
const localMinPreco = ref<number | undefined>(props.filters.minPreco);
const localMaxPreco = ref<number | undefined>(props.filters.maxPreco);

// Toggles de expansão "Ver mais"
const showAllColors = ref(false);
const showAllBrands = ref(false);

watch(
  () => props.filters,
  (newVal) => {
    localCategoria.value = newVal.categoria || "";
    localSubcategoria.value = newVal.subcategoria || "";
    localMateriais.value = [...(newVal.materiais || [])];
    localCores.value = [...(newVal.cores || [])];
    localMarcas.value = [...(newVal.marcas || [])];
    localMinPreco.value = newVal.minPreco;
    localMaxPreco.value = newVal.maxPreco;
  },
  { deep: true },
);

const categories = [
  {
    name: "Quarto",
    slug: "quarto",
    subcategories: ["Roupeiros", "Cabeceiras", "Cômodas", "Mesas de cabeceira"],
  },
  {
    name: "Sala de Estar",
    slug: "sala-de-estar",
    subcategories: [
      "Sofás",
      "Poltronas",
      "Mesas de Centro",
      "Racks e Painéis",
      "Puffs",
    ],
  },
  {
    name: "Sala de Jantar",
    slug: "sala-de-jantar",
    subcategories: [
      "Mesas de Jantar",
      "Cadeiras",
      "Aparadores",
      "Cristaleiras",
      "Buffets",
    ],
  },
  {
    name: "Cozinha",
    slug: "cozinha",
    subcategories: [
      "Armários",
      "Balcões",
      "Bancadas",
      "Banquetas",
      "Ilhas Gourmet",
    ],
  },
  {
    name: "Escritório",
    slug: "escritorio",
    subcategories: [
      "Mesas de Escritório",
      "Cadeiras Presidente",
      "Estantes de Livros",
      "Gaveteiros",
    ],
  },
  {
    name: "Banheiro",
    slug: "banheiro",
    subcategories: [
      "Gabinetes",
      "Espelheiras",
      "Armários Aéreos",
      "Prateleiras",
    ],
  },
];

const availableSubcategories = computed(() => {
  if (localCategoria.value) {
    const found = categories.find((c) => c.slug === localCategoria.value);
    if (found) return found.subcategories;
  }
  return ["Roupeiros", "Cabeceiras", "Cômodas", "Mesas de cabeceira"];
});

const materials = ["MDF", "MDP", "Madeira maciça"];

// Cores exatas conforme mostruário do Figma e FrontBusca.png
const defaultColors = [
  { hex: "#A58D63", name: "Nogueira / Linho" },
  { hex: "#4A3024", name: "Imbuia Escura" },
  { hex: "#D7D5CF", name: "Off White" },
  { hex: "#2B2B2B", name: "Grafite Escuro" },
  { hex: "#9C6342", name: "Cerejeira / Mel" },
];

const extraColors = [
  { hex: "#EFC171", name: "Mel Dourado" },
  { hex: "#8C6239", name: "Freijó Âmbar" },
  { hex: "#FFFFFF", name: "Branco Neve" },
];

const visibleColors = computed(() => {
  return showAllColors.value
    ? [...defaultColors, ...extraColors]
    : defaultColors;
});

const defaultBrands = ["Móveis primavera", "DJ Móveis", "HB", "Patrimar"];

const extraBrands = ["Madesa", "Kappesberg", "Henrique Móveis"];

const visibleBrands = computed(() => {
  return showAllBrands.value
    ? [...defaultBrands, ...extraBrands]
    : defaultBrands;
});

function toggleCategory(slug: string) {
  if (localCategoria.value === slug) {
    localCategoria.value = "";
    localSubcategoria.value = "";
  } else {
    localCategoria.value = slug;
    localSubcategoria.value = "";
  }
  emitFilterChange();
}

function toggleSubcategory(sub: string) {
  if (localSubcategoria.value.toLowerCase() === sub.toLowerCase()) {
    localSubcategoria.value = "";
  } else {
    localSubcategoria.value = sub;
  }
  emitFilterChange();
}

function toggleMaterial(mat: string) {
  const index = localMateriais.value.indexOf(mat);
  if (index > -1) {
    localMateriais.value.splice(index, 1);
  } else {
    localMateriais.value.push(mat);
  }
  emitFilterChange();
}

function toggleColor(hex: string) {
  const index = localCores.value.indexOf(hex);
  if (index > -1) {
    localCores.value.splice(index, 1);
  } else {
    localCores.value.push(hex);
  }
  emitFilterChange();
}

function toggleBrand(brand: string) {
  const index = localMarcas.value.indexOf(brand);
  if (index > -1) {
    localMarcas.value.splice(index, 1);
  } else {
    localMarcas.value.push(brand);
  }
  emitFilterChange();
}

function emitFilterChange() {
  const updated: CatalogFilterParams = {
    ...props.filters,
    categoria: localCategoria.value || undefined,
    subcategoria: localSubcategoria.value || undefined,
    materiais: localMateriais.value.length
      ? [...localMateriais.value]
      : undefined,
    cores: localCores.value.length ? [...localCores.value] : undefined,
    marcas: localMarcas.value.length ? [...localMarcas.value] : undefined,
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
  localMateriais.value = [];
  localCores.value = [];
  localMarcas.value = [];
  localMinPreco.value = undefined;
  localMaxPreco.value = undefined;

  const resetFilters: CatalogFilterParams = {
    name: props.filters.name,
    ordem: props.filters.ordem,
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
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="cat in categories"
          :key="cat.slug"
          variant="custom"
          size="xs"
          class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
          :class="
            localCategoria === cat.slug
              ? 'bg-sky-50 border-secondary text-secondary font-medium'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          "
          @click="toggleCategory(cat.slug)"
        >
          <span
            v-if="localCategoria === cat.slug"
            class="text-xs font-bold leading-none mr-1"
            >✕</span
          >
          <span>{{ cat.name }}</span>
        </UiButton>
      </div>
    </div>

    <!-- Divisória Sutil de Seção -->
    <hr class="border-stone-200 my-4" />

    <!-- Seção: Subcategoria -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Subcategoria</h3>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="sub in availableSubcategories"
          :key="sub"
          variant="custom"
          size="xs"
          class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
          :class="
            localSubcategoria.toLowerCase() === sub.toLowerCase()
              ? 'bg-sky-50 border-secondary text-secondary font-medium'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          "
          @click="toggleSubcategory(sub)"
        >
          <span
            v-if="localSubcategoria.toLowerCase() === sub.toLowerCase()"
            class="text-xs font-bold leading-none mr-1"
          >
            ✕
          </span>
          <span>{{ sub }}</span>
        </UiButton>
      </div>
    </div>

    <hr class="border-stone-200 my-4" />

    <!-- Seção: Material -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Material</h3>
      <div class="space-y-2.5">
        <label
          v-for="mat in materials"
          :key="mat"
          class="flex items-center gap-2.5 text-xs sm:text-sm text-stone-700 cursor-pointer select-none group"
        >
          <input
            type="checkbox"
            :checked="localMateriais.includes(mat)"
            @change="toggleMaterial(mat)"
            class="w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary/20 cursor-pointer"
          />
          <span class="group-hover:text-stone-900 transition-colors">{{
            mat
          }}</span>
        </label>
      </div>
    </div>

    <hr class="border-stone-200 my-4" />

    <!-- Seção: Cor / Swatches -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Cor</h3>
      <div class="flex flex-wrap items-center gap-2.5">
        <UiButton
          v-for="c in visibleColors"
          :key="c.hex"
          variant="custom"
          size="xs"
          class="w-8 h-8 rounded-full p-0 border border-stone-300/80 transition-all cursor-pointer shadow-2xs shrink-0"
          :class="
            localCores.includes(c.hex)
              ? 'ring-2 ring-secondary ring-offset-2 scale-110'
              : 'hover:scale-105'
          "
          :style="{ backgroundColor: c.hex }"
          :title="c.name"
          @click="toggleColor(c.hex)"
        />
      </div>
      <UiButton
        variant="ghost"
        size="none"
        class="mt-2.5 p-0 h-auto text-xs text-stone-600 hover:text-stone-900 font-normal transition-colors cursor-pointer inline-flex items-center gap-1"
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

    <!-- Seção: Marca -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Marca</h3>
      <div class="space-y-2.5">
        <label
          v-for="brand in visibleBrands"
          :key="brand"
          class="flex items-center gap-2.5 text-xs sm:text-sm text-stone-700 cursor-pointer select-none group"
        >
          <input
            type="checkbox"
            :checked="localMarcas.includes(brand)"
            @change="toggleBrand(brand)"
            class="w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary/20 cursor-pointer"
          />
          <span class="group-hover:text-stone-900 transition-colors">{{
            brand
          }}</span>
        </label>
      </div>
      <UiButton
        variant="ghost"
        size="none"
        class="mt-2.5 p-0 h-auto text-xs text-stone-600 hover:text-stone-900 font-normal transition-colors cursor-pointer inline-flex items-center gap-1"
        @click="showAllBrands = !showAllBrands"
      >
        <Icon
          :icon="showAllBrands ? 'mdi:chevron-up' : 'mdi:chevron-down'"
          class="w-4 h-4"
        />
        <span>{{ showAllBrands ? "Ver menos" : "Ver mais" }}</span>
      </UiButton>
    </div>

    <hr class="border-stone-200 my-4" />

    <!-- Seção: Faixa de Preço -->
    <div class="mb-6">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Faixa de preço</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-stone-600 mb-1">De</label>
          <input
            v-model.number="localMinPreco"
            type="number"
            placeholder="0"
            class="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-md focus:border-secondary focus:outline-none"
            @change="emitFilterChange"
            @input="emitFilterChange"
          />
        </div>
        <div>
          <label class="block text-xs text-stone-600 mb-1">Até</label>
          <input
            v-model.number="localMaxPreco"
            type="number"
            placeholder="10000"
            class="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-md focus:border-secondary focus:outline-none"
            @change="emitFilterChange"
            @input="emitFilterChange"
          />
        </div>
      </div>
    </div>

    <!-- Botões de Ação com UiButton -->
    <div class="space-y-2 pt-2">
      <UiButton
        size="md"
        variant="primary"
        class="w-full shadow-xs text-xs font-semibold py-2.5"
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
