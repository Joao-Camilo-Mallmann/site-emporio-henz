<script setup lang="ts">
import CatalogoFiltroAtributos from "@/components/catalogo/CatalogoFiltroAtributos.vue";
import UiButton from "@/components/ui/UiButton.vue";
import {
  encontrarFornecedor,
  useFornecedoresCatalogo,
} from "@/composables/useCatalogoProdutos";
import { encontrarCategoria, useCategoriasStore } from "@/stores/categorias";
import type {
  CatalogAvailability,
  CatalogFilterParams,
  ColorGroupSlug,
  Subtype,
  Supplier,
} from "@/types";
import { slugify } from "@/utils/slug";
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

// Fornecedores ativos vindos de GET /suppliers (listagem pública)
const {
  lista: fornecedores,
  loading: fornecedoresLoading,
  error: fornecedoresError,
  carregar: carregarFornecedores,
} = useFornecedoresCatalogo();

onMounted(() => {
  categoriasStore.carregar();
  carregarFornecedores();
});

// Estado local reativo sincronizado com props.filters
const localCategoria = ref(props.filters.categoria || "");
const localSubcategoria = ref(props.filters.subcategoria || "");
const localFornecedor = ref(props.filters.fornecedor || "");
const localDisponibilidade = ref<CatalogAvailability[]>([
  ...(props.filters.disponibilidade || []),
]);
const localCores = ref<ColorGroupSlug[]>([...(props.filters.cores || [])]);
const localMinPreco = ref<number | undefined>(props.filters.minPreco);
const localMaxPreco = ref<number | undefined>(props.filters.maxPreco);

watch(
  () => props.filters,
  (newVal) => {
    localCategoria.value = newVal.categoria || "";
    localSubcategoria.value = newVal.subcategoria || "";
    localFornecedor.value = newVal.fornecedor || "";
    localDisponibilidade.value = [...(newVal.disponibilidade || [])];
    localCores.value = [...(newVal.cores || [])];
    localMinPreco.value = newVal.minPreco;
    localMaxPreco.value = newVal.maxPreco;
  },
  { deep: true },
);

// A URL guarda o slug da categoria, o nome (ou slug) do subtipo e o slug (ou UUID) do fornecedor
const categoriaSelecionada = computed(() =>
  localCategoria.value
    ? encontrarCategoria(categorias.value, slugify(localCategoria.value))
    : undefined,
);

const subcategoriasDisponiveis = computed<Subtype[]>(
  () => categoriaSelecionada.value?.subtypes ?? [],
);

const fornecedorSelecionado = computed(() =>
  localFornecedor.value
    ? encontrarFornecedor(fornecedores.value, localFornecedor.value)
    : undefined,
);

function isCategoriaAtiva(slug: string) {
  return categoriaSelecionada.value?.slug === slug;
}

function isSubcategoriaAtiva(sub: Subtype) {
  if (!localSubcategoria.value) return false;
  const alvo = slugify(localSubcategoria.value);
  return sub.slug === alvo || slugify(sub.name) === alvo;
}

function isFornecedorAtivo(supplier: Supplier) {
  return fornecedorSelecionado.value?.id === supplier.id;
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

function toggleSupplier(supplier: Supplier) {
  localFornecedor.value = isFornecedorAtivo(supplier)
    ? ""
    : slugify(supplier.name);
  emitFilterChange();
  emit("apply");
}

function emitFilterChange() {
  const updated: CatalogFilterParams = {
    ...props.filters,
    categoria: localCategoria.value || undefined,
    subcategoria: localSubcategoria.value || undefined,
    fornecedor: localFornecedor.value || undefined,
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
  localFornecedor.value = "";
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

    <!-- Seção: Fornecedor -->
    <div class="mb-5">
      <h3 class="text-sm font-bold text-stone-900 mb-2.5">Fornecedor</h3>
      <div
        v-if="fornecedoresLoading && fornecedores.length === 0"
        class="flex flex-wrap gap-2"
        aria-hidden="true"
      >
        <span
          v-for="n in 4"
          :key="n"
          class="h-7 w-24 rounded-lg bg-stone-100 animate-pulse"
        ></span>
      </div>
      <p
        v-else-if="fornecedores.length === 0"
        class="text-xs text-stone-500"
        role="status"
      >
        {{ fornecedoresError || "Nenhum fornecedor disponível." }}
      </p>
      <div v-else class="flex flex-wrap gap-2">
        <UiButton
          v-for="sup in fornecedores"
          :key="sup.id"
          variant="custom"
          size="xs"
          class="font-normal border text-xs py-1.5 px-3 rounded-lg transition-all"
          :class="
            isFornecedorAtivo(sup)
              ? 'bg-sky-50 border-secondary text-secondary font-medium'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          "
          :aria-pressed="isFornecedorAtivo(sup)"
          @click="toggleSupplier(sup)"
        >
          <span
            v-if="isFornecedorAtivo(sup)"
            class="text-xs font-bold leading-none mr-1"
          >
            ✕
          </span>
          <span>{{ sup.name }}</span>
        </UiButton>
      </div>
    </div>

    <hr class="border-stone-200 my-4" />

    <!-- Seções: Disponibilidade, Cor e Faixa de Preço -->
    <CatalogoFiltroAtributos
      v-model:disponibilidade="localDisponibilidade"
      v-model:cores="localCores"
      v-model:min-preco="localMinPreco"
      v-model:max-preco="localMaxPreco"
      @change="emitFilterChange"
    />

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
