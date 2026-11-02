<script setup lang="ts">
import CatalogoFiltroLateral from "@/components/catalogo/CatalogoFiltroLateral.vue";
import CatalogoProdutoCard from "@/components/catalogo/CatalogoProdutoCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import {
  CATALOGO_LIMITE_PADRAO,
  catalogoApi,
  encontrarCategoria,
  encontrarSubtipo,
} from "@/api/catalogo";
import type {
  CatalogAvailability,
  CatalogFilterParams,
  CatalogProductItem,
  ICategory,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Drawer mobile de filtros
const isMobileFiltersOpen = ref(false);
const isLoading = ref(false);
const loadError = ref(false);

// Filtros reativos sincronizados com a rota e traduzidos pela camada de API para GET /produtos
const filters = ref<CatalogFilterParams>({
  name: "",
  categoria: "",
  subcategoria: "",
  disponibilidade: [],
  minPreco: undefined,
  maxPreco: undefined,
  page: 1,
  limit: CATALOGO_LIMITE_PADRAO,
});

// Lista de produtos e paginação recebidas do envelope { data, pagination } da API (sem filtragem no front)
const products = ref<CatalogProductItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);

// Categorias ativas, só para mostrar o nome real no resumo dos resultados
const categorias = ref<ICategory[]>([]);

async function fetchProducts() {
  isLoading.value = true;
  loadError.value = false;
  try {
    const response = await catalogoApi.buscarProdutos(filters.value);
    products.value = response.data;
    currentPage.value = response.pagination.page;
    totalPages.value = response.pagination.totalPages || 1;
  } catch {
    products.value = [];
    currentPage.value = filters.value.page || 1;
    totalPages.value = 1;
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
}

// Sincroniza estado de filtros a partir dos parâmetros de consulta da rota (query GET)
function syncFiltersFromRoute() {
  const name =
    typeof route.query.name === "string"
      ? route.query.name
      : typeof route.query.q === "string"
        ? route.query.q
        : "";
  const categoria =
    typeof route.query.categoria === "string" ? route.query.categoria : "";
  const subcategoria =
    typeof route.query.subcategoria === "string"
      ? route.query.subcategoria
      : "";
  const disponibilidade = (
    typeof route.query.disponibilidade === "string"
      ? route.query.disponibilidade.split(",")
      : []
  ).filter(
    (v): v is CatalogAvailability => v === "IN_STOCK" || v === "ON_DEMAND",
  );
  const minPreco =
    typeof route.query.minPreco === "string"
      ? parseFloat(route.query.minPreco)
      : undefined;
  const maxPreco =
    typeof route.query.maxPreco === "string"
      ? parseFloat(route.query.maxPreco)
      : undefined;
  const page = route.query.page ? parseInt(route.query.page as string, 10) : 1;

  filters.value = {
    name: name || undefined,
    categoria: categoria || undefined,
    subcategoria: subcategoria || undefined,
    disponibilidade,
    minPreco: isNaN(minPreco as number) ? undefined : minPreco,
    maxPreco: isNaN(maxPreco as number) ? undefined : maxPreco,
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: CATALOGO_LIMITE_PADRAO,
  };
}

onMounted(() => {
  syncFiltersFromRoute();
  fetchProducts();
  catalogoApi
    .carregarCategorias()
    .then((lista) => {
      categorias.value = lista;
    })
    .catch(() => {
      categorias.value = [];
    });
});

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute();
    fetchProducts();
  },
);

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

function updateRouteQuery() {
  const query: Record<string, string> = {};
  if (filters.value.name) query.name = filters.value.name;
  if (filters.value.categoria) query.categoria = filters.value.categoria;
  if (filters.value.subcategoria)
    query.subcategoria = filters.value.subcategoria;
  if (filters.value.disponibilidade?.length)
    query.disponibilidade = filters.value.disponibilidade.join(",");
  if (filters.value.minPreco !== undefined && !isNaN(filters.value.minPreco)) {
    query.minPreco = String(filters.value.minPreco);
  }
  if (filters.value.maxPreco !== undefined && !isNaN(filters.value.maxPreco)) {
    query.maxPreco = String(filters.value.maxPreco);
  }
  if (filters.value.page && filters.value.page > 1) {
    query.page = String(filters.value.page);
  }

  router.replace({ path: "/catalogo", query });
}

function handleResetFilters() {
  cancelPendingApply();
  filters.value = {
    name: undefined,
    categoria: undefined,
    subcategoria: undefined,
    disponibilidade: [],
    minPreco: undefined,
    maxPreco: undefined,
    page: 1,
    limit: CATALOGO_LIMITE_PADRAO,
  };
  router.replace({ path: "/catalogo" });
  isMobileFiltersOpen.value = false;
}

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.categoria) count++;
  if (filters.value.subcategoria) count++;
  if (filters.value.disponibilidade?.length)
    count += filters.value.disponibilidade.length;
  if (
    (typeof filters.value.minPreco === "number" &&
      !isNaN(filters.value.minPreco)) ||
    (typeof filters.value.maxPreco === "number" &&
      !isNaN(filters.value.maxPreco))
  ) {
    count++;
  }
  return count;
});

// Nome real da categoria/subcategoria no resumo; cai no valor da URL enquanto a lista não chega
const categoriaLabel = computed(() => {
  const categoria = encontrarCategoria(categorias.value, filters.value.categoria);
  return categoria?.name ?? filters.value.categoria ?? "";
});

const subcategoriaLabel = computed(() => {
  const categoria = encontrarCategoria(categorias.value, filters.value.categoria);
  const subtipo = encontrarSubtipo(
    categorias.value,
    filters.value.subcategoria,
    categoria,
  );
  return subtipo?.name ?? filters.value.subcategoria ?? "";
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
            <span class="font-bold text-stone-900">“{{ subcategoriaLabel }}”</span>
          </template>
          <template v-else-if="filters.categoria">
            Exibindo móveis para
            <span class="font-bold text-stone-900">“{{ categoriaLabel }}”</span>
          </template>
          <template v-else> Todos os móveis do catálogo </template>
        </h1>

        <!-- Linha 3: [ ⏚ Filtros (N) ] -->
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
          <div class="hidden lg:flex sm:items-center justify-between gap-3 mb-6">
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

          <!-- Estado de Erro: a API respondeu com erro -->
          <div
            v-else-if="loadError"
            class="bg-white rounded-2xl border border-stone-200/80 p-12 text-center shadow-xs"
          >
            <div
              class="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400"
            >
              <Icon icon="mdi:alert-circle-outline" class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-neutral-dark mb-1">
              Não foi possível carregar o catálogo
            </h3>
            <p class="text-sm text-stone-500 max-w-md mx-auto mb-6">
              Ocorreu um erro ao buscar os produtos. Tente novamente em alguns
              instantes.
            </p>
            <UiButton
              variant="outline"
              class="inline-flex items-center gap-2"
              @click="fetchProducts"
            >
              <Icon icon="mdi:refresh" class="w-4 h-4" />
              <span>Tentar de novo</span>
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

          <!-- Paginação sincronizada com ?page= -->
          <div v-if="products.length > 0 && !isLoading" class="mt-8">
            <UiPagination
              :page="currentPage"
              :total-pages="totalPages"
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
