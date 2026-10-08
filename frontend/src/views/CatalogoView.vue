<script setup lang="ts">
import CatalogFilterSidebar from "@/components/catalogo/CatalogFilterSidebar.vue";
import CatalogPagination from "@/components/catalogo/CatalogPagination.vue";
import CatalogProductCard from "@/components/catalogo/CatalogProductCard.vue";
import CatalogSortDropdown from "@/components/catalogo/CatalogSortDropdown.vue";
import UiButton from "@/components/ui/UiButton.vue";
import type {
  CatalogFilterParams,
  CatalogPaginationMeta,
  CatalogProductItem,
  CatalogSortOption,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Drawer mobile de filtros
const isMobileFiltersOpen = ref(false);

// Filtros principais reativos
const filters = ref<CatalogFilterParams>({
  name: "",
  categoria: "",
  subcategoria: "",
  materiais: [],
  cores: [],
  marcas: [],
  minPreco: undefined,
  maxPreco: undefined,
  ordem: "relevancia",
  page: 1,
  limit: 9,
});

// Banco de dados em memória desacoplado (pronto para ser substituído por GET /api/v1/catalogo)
const allProducts: CatalogProductItem[] = [
  {
    id: "p-1",
    name: "Roupeiro Roma",
    slug: "roupeiro-roma",
    price: 4850,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-veneza.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "MDF",
    brand: "Móveis primavera",
    finishes: [
      { color: "#4A3024", label: "Imbuia Escura" },
      { color: "#A58D63", label: "Carvalho Claro" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-2",
    name: "Roupeiro Veneza",
    slug: "roupeiro-veneza",
    price: 7300,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-veneza.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "Madeira maciça",
    brand: "DJ Móveis",
    finishes: [
      { color: "#4A3024", label: "Madeira Nobre" },
      { color: "#A58D63", label: "Champagne" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-3",
    name: "Guarda-roupa Nest",
    slug: "guarda-roupa-nest",
    price: 4000,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-milano.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "MDF",
    brand: "HB",
    finishes: [],
    availability: "IN_STOCK",
  },
  {
    id: "p-4",
    name: "Roupeiro Milano",
    slug: "roupeiro-milano",
    price: 4900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-milano.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "MDF",
    brand: "DJ Móveis",
    finishes: [
      { color: "#4A3024", label: "Freijó Âmbar" },
      { color: "#A58D63", label: "Carvalho Claro" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-5",
    name: "Guarda-roupa Topázio",
    slug: "guarda-roupa-topazio",
    price: 5100,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-comoda-italia.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "MDP",
    brand: "Patrimar",
    finishes: [],
    availability: "ON_DEMAND",
  },
  {
    id: "p-6",
    name: "Guarda-roupa Ouro",
    slug: "guarda-roupa-ouro",
    price: 7300,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cristaleira.png",
    category: "quarto",
    subcategory: "Roupeiros",
    material: "Madeira maciça",
    brand: "Móveis primavera",
    finishes: [],
    availability: "IN_STOCK",
  },
  {
    id: "p-7",
    name: "Cabeceira Itália",
    slug: "cabeceira-italia",
    price: 550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cabeceira-italia.png",
    category: "quarto",
    subcategory: "Cabeceiras",
    material: "MDF",
    brand: "DJ Móveis",
    finishes: [
      { color: "#A58D63", label: "Linho Areia" },
      { color: "#2B2B2B", label: "Cinza Chumbo" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-8",
    name: "Cômoda Itália",
    slug: "comoda-italia",
    price: 1500,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-comoda-italia.png",
    category: "quarto",
    subcategory: "Cômodas",
    material: "MDP",
    brand: "HB",
    finishes: [
      { color: "#4A3024", label: "Carvalho Escuro" },
      { color: "#A58D63", label: "Freijó Claro" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-9",
    name: "Mesa de Centro Pétala",
    slug: "mesa-de-centro-petala",
    price: 720,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-mesa-petala.png",
    category: "sala-de-estar",
    subcategory: "Mesas de Centro",
    material: "Madeira maciça",
    brand: "Patrimar",
    finishes: [
      { color: "#C97C49", label: "Cerejeira" },
      { color: "#EFC171", label: "Mel" },
      { color: "#D7D5CF", label: "Off White" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-10",
    name: "Home Ripado Supremo",
    slug: "home-ripado-supremo",
    price: 1550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-home-ripado.png",
    category: "sala-de-estar",
    subcategory: "Racks e Painéis",
    material: "MDF",
    brand: "Móveis primavera",
    finishes: [
      { color: "#A58D63", label: "Nogueira" },
      { color: "#4A3024", label: "Imbuia Escura" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-11",
    name: "Poltrona Tissi",
    slug: "poltrona-tissi",
    price: 2370,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-poltrona-tissi.png",
    category: "sala-de-estar",
    subcategory: "Poltronas",
    material: "Madeira maciça",
    brand: "DJ Móveis",
    finishes: [
      { color: "#4A3024", label: "Madeira Nobre" },
      { color: "#A58D63", label: "Linho Bege" },
      { color: "#2B2B2B", label: "Couro Preto" },
    ],
    availability: "IN_STOCK",
  },
  {
    id: "p-12",
    name: "Cristaleira Liara",
    slug: "cristaleira-liara",
    price: 1900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cristaleira.png",
    category: "sala-de-jantar",
    subcategory: "Cristaleiras",
    material: "MDF",
    brand: "HB",
    finishes: [],
    availability: "IN_STOCK",
  },
];

// Sincroniza estado de filtros a partir da rota
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
  const ordem = (route.query.ordem as CatalogSortOption) || "relevancia";
  const page = route.query.page ? parseInt(route.query.page as string, 10) : 1;

  filters.value = {
    ...filters.value,
    name: name || undefined,
    categoria: categoria || undefined,
    subcategoria: subcategoria || undefined,
    ordem,
    page: isNaN(page) ? 1 : page,
  };
}

onMounted(() => {
  syncFiltersFromRoute();
});

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute();
  },
);

// Produtos filtrados e ordenados reativamente
const filteredProducts = computed(() => {
  return allProducts
    .filter((product) => {
      // 1. Busca textual por nome, subcategoria ou categoria
      if (filters.value.name && filters.value.name.trim()) {
        const q = filters.value.name.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(q);
        const matchSub = product.subcategory?.toLowerCase().includes(q);
        const matchCat = product.category.toLowerCase().includes(q);
        if (!matchName && !matchSub && !matchCat) return false;
      }

      // 2. Filtro de Categoria
      if (
        filters.value.categoria &&
        product.category.toLowerCase() !== filters.value.categoria.toLowerCase()
      ) {
        return false;
      }

      // 3. Filtro de Subcategoria
      if (
        filters.value.subcategoria &&
        product.subcategory?.toLowerCase() !==
          filters.value.subcategoria.toLowerCase()
      ) {
        return false;
      }

      // 4. Filtro de Materiais
      if (
        filters.value.materiais &&
        filters.value.materiais.length > 0 &&
        (!product.material ||
          !filters.value.materiais.includes(product.material))
      ) {
        return false;
      }

      // 5. Filtro de Cores
      if (
        filters.value.cores &&
        filters.value.cores.length > 0 &&
        !product.finishes.some(
          (f) => f.color && filters.value.cores!.includes(f.color),
        )
      ) {
        return false;
      }

      // 6. Filtro de Marcas
      if (
        filters.value.marcas &&
        filters.value.marcas.length > 0 &&
        (!product.brand || !filters.value.marcas.includes(product.brand))
      ) {
        return false;
      }

      // 7. Faixa de Preço
      if (
        typeof filters.value.minPreco === "number" &&
        !isNaN(filters.value.minPreco) &&
        product.price < filters.value.minPreco
      ) {
        return false;
      }
      if (
        typeof filters.value.maxPreco === "number" &&
        !isNaN(filters.value.maxPreco) &&
        product.price > filters.value.maxPreco
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.value.ordem === "menor-preco") {
        return a.price - b.price;
      }
      if (filters.value.ordem === "maior-preco") {
        return b.price - a.price;
      }
      if (filters.value.ordem === "recentes") {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });
});

// Paginação sobre os produtos filtrados
const itemsPerPage = 9;
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage));
});

const paginatedProducts = computed(() => {
  const current = filters.value.page || 1;
  const start = (current - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const paginationMeta = computed<CatalogPaginationMeta>(() => ({
  currentPage: filters.value.page || 1,
  totalPages: totalPages.value,
  totalItems: filteredProducts.value.length,
  itemsPerPage,
}));

function handlePageChange(newPage: number) {
  filters.value.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleSortChange(newSort: CatalogSortOption) {
  filters.value.ordem = newSort;
  filters.value.page = 1;
}

function handleFiltersUpdate(updated: CatalogFilterParams) {
  filters.value = { ...updated, page: 1 };
  updateRouteQuery();
}

function updateRouteQuery() {
  const query: Record<string, string> = {};
  if (filters.value.name) query.name = filters.value.name;
  if (filters.value.categoria) query.categoria = filters.value.categoria;
  if (filters.value.subcategoria)
    query.subcategoria = filters.value.subcategoria;
  if (filters.value.ordem && filters.value.ordem !== "relevancia") {
    query.ordem = filters.value.ordem;
  }
  if (filters.value.page && filters.value.page > 1) {
    query.page = String(filters.value.page);
  }

  router.replace({ path: "/catalogo", query });
}

function handleResetFilters() {
  filters.value = {
    name: undefined,
    categoria: undefined,
    subcategoria: undefined,
    materiais: [],
    cores: [],
    marcas: [],
    minPreco: undefined,
    maxPreco: undefined,
    ordem: "relevancia",
    page: 1,
    limit: 9,
  };
  router.replace({ path: "/catalogo" });
  isMobileFiltersOpen.value = false;
}

const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.categoria) count++;
  if (filters.value.subcategoria) count++;
  if (filters.value.materiais?.length) count += filters.value.materiais.length;
  if (filters.value.cores?.length) count += filters.value.cores.length;
  if (filters.value.marcas?.length) count += filters.value.marcas.length;
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
              >“{{ filters.subcategoria }}”</span
            >
          </template>
          <template v-else-if="filters.categoria">
            Exibindo móveis para
            <span class="font-bold text-stone-900"
              >“{{ filters.categoria }}”</span
            >
          </template>
          <template v-else> Todos os móveis do catálogo </template>
        </h1>

        <!-- Linha 3: [ ⏚ Filtros (N) ] à esquerda e Ordem: [ Relevância ⇅ ] à direita -->
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

          <CatalogSortDropdown
            :model-value="filters.ordem"
            @update:model-value="handleSortChange"
          />
        </div>
      </div>

      <!-- Layout em Duas Colunas Desktop (Figma nó #96:6513 e FrontBusca.png) -->
      <div class="w-full flex flex-col lg:flex-row items-start">
        <!-- Coluna 1: Sidebar Desktop com linha vertical divisória à direita -->
        <div
          class="hidden lg:block w-72 xl:w-80 shrink-0 pr-6 xl:pr-8 border-r border-stone-200"
        >
          <CatalogFilterSidebar
            :filters="filters"
            @update:filters="handleFiltersUpdate"
            @apply="updateRouteQuery"
            @reset="handleResetFilters"
          />
        </div>

        <!-- Coluna 2: Resultados e Grid de Produtos Desktop/Mobile -->
        <div class="flex-1 min-w-0 w-full lg:pl-8 xl:pl-10">
          <!-- Cabeçalho de Resultados e Ordenação Desktop -->
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
                    filters.subcategoria
                  }}</span>
                </template>
                <template v-else-if="filters.categoria">
                  Exibindo móveis para
                  <span class="font-bold text-stone-900">{{
                    filters.categoria
                  }}</span>
                </template>
                <template v-else> Todos os móveis do catálogo </template>
              </h1>
            </div>

            <!-- Dropdown de Ordenação Desktop -->
            <div>
              <CatalogSortDropdown
                :model-value="filters.ordem"
                @update:model-value="handleSortChange"
              />
            </div>
          </div>

          <!-- Grid de Produtos Responsivo (2 colunas no mobile, 3 no desktop) -->
          <div
            v-if="paginatedProducts.length > 0"
            class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          >
            <CatalogProductCard
              v-for="prod in paginatedProducts"
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
          <div v-if="paginatedProducts.length > 0" class="mt-8">
            <CatalogPagination
              :meta="paginationMeta"
              @change-page="handlePageChange"
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

          <CatalogFilterSidebar
            :filters="filters"
            @update:filters="handleFiltersUpdate"
            @apply="
              updateRouteQuery();
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
