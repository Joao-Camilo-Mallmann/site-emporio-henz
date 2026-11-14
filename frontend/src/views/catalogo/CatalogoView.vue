<script setup lang="ts">
import CatalogoFiltroLateral from "@/components/catalogo/CatalogoFiltroLateral.vue";
import CatalogoProdutoCard from "@/components/catalogo/CatalogoProdutoCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import {
  CATALOGO_POR_PAGINA,
  lerFiltrosDaRota,
  montarQueryDaRota,
  useCatalogoProdutos,
} from "@/composables/useCatalogoProdutos";
import { encontrarCategoria, useCategoriasStore } from "@/stores/categorias";
import type { CatalogFilterParams } from "@/types";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const categoriasStore = useCategoriasStore();

// Produtos e paginação vêm de GET /produtos; filtros e paginação ficam no servidor
const {
  products,
  pagination,
  loading: isLoading,
  error,
  carregar,
} = useCatalogoProdutos();

// Drawer mobile de filtros
const isMobileFiltersOpen = ref(false);

// Filtros da tela, espelhados na URL
const filters = ref<CatalogFilterParams>(lerFiltrosDaRota(route.query));

function fetchProducts() {
  return carregar(filters.value);
}

// A URL é a fonte da verdade. Mudanças em chaves que não são filtro (ex.: ?lista=) não recarregam a lista
let filtrosCarregados = "";

watch(
  () => route.query,
  (query) => {
    const daRota = lerFiltrosDaRota(query);
    const chave = JSON.stringify(daRota);
    if (chave === filtrosCarregados) return;
    filtrosCarregados = chave;
    filters.value = daRota;
    fetchProducts();
  },
  { immediate: true },
);

function updateRouteQuery() {
  router.replace({
    path: "/catalogo",
    query: montarQueryDaRota(filters.value, route.query),
  });
}

function handlePageChange(newPage: number) {
  filters.value.page = newPage;
  updateRouteQuery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleFiltersUpdate(updated: CatalogFilterParams) {
  filters.value = { ...updated, page: 1 };
}

// Aplicação automática dos filtros no desktop (debounce)
let applyTimer: ReturnType<typeof setTimeout> | undefined;

function cancelPendingApply() {
  if (applyTimer) {
    clearTimeout(applyTimer);
    applyTimer = undefined;
  }
}

function handleDesktopFiltersUpdate(updated: CatalogFilterParams) {
  handleFiltersUpdate(updated);
  cancelPendingApply();
  applyTimer = setTimeout(() => {
    applyTimer = undefined;
    updateRouteQuery();
  }, 400);
}

function handleApplyFilters() {
  cancelPendingApply();
  updateRouteQuery();
}

onBeforeUnmount(cancelPendingApply);

function handleResetFilters() {
  cancelPendingApply();
  filters.value = { page: 1, limit: CATALOGO_POR_PAGINA };
  updateRouteQuery();
  isMobileFiltersOpen.value = false;
}

// Nomes para o resumo: a URL guarda o slug da categoria e o nome (ou slug) do subtipo
const categoriaAtual = computed(() =>
  filters.value.categoria
    ? encontrarCategoria(
        categoriasStore.lista,
        slugify(filters.value.categoria),
      )
    : undefined,
);

const categoriaLabel = computed(
  () => categoriaAtual.value?.name ?? filters.value.categoria ?? "",
);

const subcategoriaLabel = computed(() => {
  const valor = filters.value.subcategoria;
  if (!valor) return "";
  const alvo = slugify(valor);
  const subtipo = categoriaAtual.value?.subtypes?.find(
    (item) => item.slug === alvo || slugify(item.name) === alvo,
  );
  return subtipo?.name ?? valor;
});

const totalLabel = computed(() => {
  const total = pagination.value.total;
  return total === 1 ? "1 móvel" : `${total} móveis`;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.categoria) count++;
  if (filters.value.subcategoria) count++;
  count += filters.value.disponibilidade?.length ?? 0;
  if (
    filters.value.minPreco !== undefined ||
    filters.value.maxPreco !== undefined
  ) {
    count++;
  }
  return count;
});
</script>

<template>
  <main class="min-h-screen bg-white py-6 sm:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Cabeçalho Mobile Oficial (conforme image.png) -->
      <div class="lg:hidden mb-6">
        <!-- Linha 1: Voltar + Busca -->
        <div class="flex items-center gap-2 mb-3">
          <UiButton
            variant="custom"
            class="border-none shadow-none bg-transparent p-1 text-stone-700 hover:text-stone-900"
            aria-label="Voltar"
            @click="router.back()"
          >
            <Icon icon="mdi:arrow-left" class="w-6 h-6" />
          </UiButton>
          <span class="text-base font-medium">Busca</span>
        </div>

        <!-- Linha 2: Exibindo resultados para “...” -->
        <h1 class="text-sm text-stone-500 font-normal mb-4">
          <template v-if="filters.name">
            Exibindo resultados para
            <span class="font-bold text-stone-900">“{{ filters.name }}”</span>
          </template>
          <template v-else-if="filters.subcategoria">
            Exibindo móveis de
            <span class="font-bold text-stone-900"
              >“{{ subcategoriaLabel }}”</span
            >
          </template>
          <template v-else-if="filters.categoria">
            Exibindo móveis para
            <span class="font-bold text-stone-900"
              >“{{ categoriaLabel }}”</span
            >
          </template>
          <template v-else> Todos os móveis do catálogo </template>
        </h1>

        <!-- Linha 3: [ ⏚ Filtros (N) ] à esquerda e total de resultados à direita -->
        <div class="flex items-center justify-between gap-3">
          <UiButton
            variant="outline"
            class="border border-stone-300 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium text-stone-800 bg-white hover:bg-stone-50 shadow-none flex items-center gap-2"
            @click="isMobileFiltersOpen = true"
          >
            <Icon icon="mdi:filter-variant" class="w-4 h-4 text-stone-800" />
            <span
              >Filtros{{
                activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""
              }}</span
            >
          </UiButton>

          <span
            v-if="!isLoading && !error"
            class="text-xs text-stone-500"
            aria-live="polite"
          >
            {{ totalLabel }}
          </span>
        </div>
      </div>

      <!-- Layout em Duas Colunas Desktop (Figma nó #96:6513 e FrontBusca.png) -->
      <div class="w-full flex flex-col lg:flex-row items-start">
        <!-- Coluna 1: Sidebar Desktop com linha vertical divisória à direita -->
        <div
          class="hidden lg:block w-72 xl:w-80 shrink-0 pr-6 xl:pr-8 border-r border-stone-200"
        >
          <CatalogoFiltroLateral
            :filters="filters"
            @update:filters="handleDesktopFiltersUpdate"
            @apply="handleApplyFilters"
            @reset="handleResetFilters"
          />
        </div>

        <!-- Coluna 2: Resultados e Grid de Produtos Desktop/Mobile -->
        <div class="flex-1 min-w-0 w-full lg:pl-8 xl:pl-10">
          <!-- Cabeçalho de Resultados Desktop -->
          <div
            class="hidden lg:flex sm:items-center justify-between gap-3 mb-6"
          >
            <div>
              <h1 class="text-sm sm:text-base text-stone-600 font-normal">
                <template v-if="filters.name">
                  Exibindo resultados para
                  <span class="font-bold text-stone-900"
                    >“{{ filters.name }}”</span
                  >
                </template>
                <template v-else-if="filters.subcategoria">
                  Exibindo móveis de
                  <span class="font-bold text-stone-900">{{
                    subcategoriaLabel
                  }}</span>
                </template>
                <template v-else-if="filters.categoria">
                  Exibindo móveis para
                  <span class="font-bold text-stone-900">{{
                    categoriaLabel
                  }}</span>
                </template>
                <template v-else> Todos os móveis do catálogo </template>
              </h1>
            </div>

            <span
              v-if="!isLoading && !error"
              class="text-sm text-stone-500 shrink-0"
              aria-live="polite"
            >
              {{ totalLabel }}
            </span>
          </div>

          <!-- Estado de Carregamento (Skeleton) -->
          <div
            v-if="isLoading"
            class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="bg-stone-50 rounded-2xl p-4 animate-pulse h-80 flex flex-col justify-between border border-stone-100"
            >
              <div class="w-full h-48 bg-stone-200 rounded-xl"></div>
              <div class="h-4 bg-stone-200 rounded w-3/4 mt-4"></div>
              <div class="h-6 bg-stone-200 rounded w-1/2 mt-2"></div>
            </div>
          </div>

          <!-- Estado de Erro: a requisição à API falhou -->
          <div
            v-else-if="error"
            class="bg-white rounded-2xl border border-stone-200/80 p-12 text-center shadow-xs"
            role="alert"
          >
            <div
              class="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400"
            >
              <Icon icon="mdi:wifi-off" class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-neutral-dark mb-1">
              Não foi possível carregar os móveis
            </h3>
            <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">
              {{ error }}
            </p>
            <UiButton
              variant="outline"
              class="inline-flex items-center gap-2"
              @click="fetchProducts"
            >
              <Icon icon="mdi:refresh" class="w-4 h-4" />
              <span>Tentar novamente</span>
            </UiButton>
          </div>

          <!-- Grid de Produtos Responsivo (2 colunas no mobile, 3 no desktop) -->
          <div
            v-else-if="products.length > 0"
            class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          >
            <CatalogoProdutoCard
              v-for="prod in products"
              :key="prod.id"
              :product="prod"
            />
          </div>

          <!-- Estado Vazio Caso Nenhum Produto Seja Encontrado -->
          <div
            v-else
            class="bg-white rounded-2xl border border-stone-200/80 p-12 text-center shadow-xs"
          >
            <div
              class="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400"
            >
              <Icon icon="mdi:magnify-close" class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-neutral-dark mb-1">
              Nenhum móvel encontrado
            </h3>
            <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">
              Não encontramos nenhum produto com a combinação de filtros
              selecionada. Experimente remover filtros ou buscar por outro
              termo.
            </p>
            <UiButton
              variant="outline"
              class="inline-flex items-center gap-2"
              @click="handleResetFilters"
            >
              <Icon icon="mdi:refresh" class="w-4 h-4" />
              <span>Limpar todos os filtros</span>
            </UiButton>
          </div>

          <!-- Paginação -->
          <div v-if="products.length > 0 && !isLoading" class="mt-8">
            <UiPagination
              :page="pagination.page"
              :total-pages="pagination.totalPages"
              :disabled="isLoading"
              @update:page="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer Lateral de Filtros para Mobile -->
    <Teleport to="body">
      <div v-if="isMobileFiltersOpen" class="fixed inset-0 z-50 flex lg:hidden">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          @click="isMobileFiltersOpen = false"
        ></div>

        <!-- Painel Lateral -->
        <div
          class="relative w-[85%] max-w-sm h-full bg-white flex flex-col shadow-2xl z-10 overflow-y-auto p-5"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-stone-200 mb-4"
          >
            <h2 class="text-lg font-bold text-neutral-dark">Filtros</h2>
            <UiButton variant="outline" @click="isMobileFiltersOpen = false">
              <Icon icon="mdi:close" class="w-5 h-5" />
            </UiButton>
          </div>

          <CatalogoFiltroLateral
            :filters="filters"
            @update:filters="handleFiltersUpdate"
            @apply="
              handleApplyFilters();
              isMobileFiltersOpen = false;
            "
            @reset="
              handleResetFilters();
              isMobileFiltersOpen = false;
            "
          />
        </div>
      </div>
    </Teleport>

  </main>
</template>
