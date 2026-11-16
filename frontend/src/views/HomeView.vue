<script setup lang="ts">
import CatalogoProdutoCard from "@/components/catalogo/CatalogoProdutoCard.vue";
import HeroBannerDesktop from "@/components/home/HeroBannerDesktop.vue";
import HeroBannerMobile from "@/components/home/HeroBannerMobile.vue";
import { catalogoApi } from "@/api";
import { mapearProdutoCatalogo } from "@/composables/useCatalogoProdutos";
import { useCategoriasStore } from "@/stores/categorias";
import type { CatalogProductItem, ProductListItemDto } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";

const categoriasStore = useCategoriasStore();
const hoveredCategory = ref<string | null>(null);
const selectedCategory = ref<string>("");

// Cards fixos do Figma, filtrados pelas categorias que existem na API (ver CARDS_HOME em stores/categorias)
onMounted(() => {
  categoriasStore.carregar();
  carregarVitrines();
});

// Vitrines de produtos: uma chamada a GET /produtos alimenta "Destaques" e "Você também pode gostar"
const ITENS_POR_VITRINE = 4;
const produtosVitrine = ref<ProductListItemDto[]>([]);
const vitrinesLoading = ref(true);

async function carregarVitrines() {
  try {
    const resposta = await catalogoApi.buscarProdutos({
      page: 1,
      limit: ITENS_POR_VITRINE * 2,
    });
    produtosVitrine.value = resposta.data;
  } catch {
    // Sem produtos a vitrine some; o resto da home continua visível
    produtosVitrine.value = [];
  } finally {
    vitrinesLoading.value = false;
  }
}

const cardsVitrine = computed<CatalogProductItem[]>(() =>
  produtosVitrine.value.map((produto) =>
    mapearProdutoCatalogo(produto, categoriasStore.lista),
  ),
);
const destaques = computed(() =>
  cardsVitrine.value.slice(0, ITENS_POR_VITRINE),
);
const recomendados = computed(() =>
  cardsVitrine.value.slice(ITENS_POR_VITRINE, ITENS_POR_VITRINE * 2),
);
</script>

<template>
  <div class="space-y-12 md:space-y-16 pb-20 bg-surface-light">
    <!-- Banners Segregados Responsivamente: Desktop (>= 768px) e Mobile (< 768px) -->
    <HeroBannerDesktop class="hidden md:block" />
    <HeroBannerMobile />

    <!-- Vitrine de 6 Categorias com Margem Responsiva (home-mobile.png / Figma #38:2521) -->
    <section
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:-mt-24 relative z-20"
    >
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5"
      >
        <RouterLink
          v-for="cat in categoriasStore.cardsHome"
          :key="cat.slug"
          :to="{ path: '/catalogo', query: { categoria: cat.slug } }"
          @mouseenter="hoveredCategory = cat.slug"
          @mouseleave="hoveredCategory = null"
          @click="selectedCategory = cat.slug"
          class="group rounded-2xl overflow-hidden transition-all duration-300 border border-primary flex flex-col cursor-pointer"
          :class="[
            hoveredCategory === cat.slug ||
            (!hoveredCategory && selectedCategory === cat.slug)
              ? 'bg-primary border-primary shadow-2xl -translate-y-2'
              : 'bg-white border-stone-200/70 shadow-[0px_6px_16px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:-translate-y-2',
          ]"
        >
          <!-- Imagem Isolada do Móvel (Fundo muda suavemente para azul marinho #123854 no hover/ativo conforme Figma) -->
          <div
            class="h-32 sm:h-36 flex items-center justify-center p-3 transition-colors duration-300"
            :class="[
              hoveredCategory === cat.slug ||
              (!hoveredCategory && selectedCategory === cat.slug)
                ? 'bg-primary'
                : 'bg-white',
            ]"
          >
            <img
              :src="cat.image"
              :alt="cat.name"
              class="max-h-28 w-auto object-contain transition-transform duration-300 select-none"
              :class="[
                hoveredCategory === cat.slug ||
                (!hoveredCategory && selectedCategory === cat.slug)
                  ? 'scale-110 drop-shadow-md'
                  : 'group-hover:scale-105',
              ]"
            />
          </div>

          <!-- Barra Azul-Marinho Inferior (#123854) -->
          <div
            class="h-11 bg-primary text-white px-3.5 flex items-center justify-between text-xs sm:text-sm font-medium rounded-b-2xl transition-colors duration-200"
          >
            <span class="truncate">{{ cat.name }}</span>
            <svg
              class="w-3.5 h-3.5 text-white transition-transform duration-200 shrink-0"
              :class="[
                hoveredCategory === cat.slug ||
                (!hoveredCategory && selectedCategory === cat.slug)
                  ? 'translate-x-1.5'
                  : 'group-hover:translate-x-1',
              ]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Seção Destaques (Figma node #50:5154) -->
    <section
      v-if="vitrinesLoading || destaques.length > 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4"
    >
      <div class="flex items-center justify-between">
        <h2
          class="text-2xl sm:text-3xl font-serif font-bold text-neutral-dark tracking-tight"
        >
          Destaques
        </h2>
        <RouterLink
          to="/catalogo"
          class="text-xs sm:text-sm font-semibold text-secondary hover:text-sky-700 flex items-center gap-1 group transition-colors"
        >
          <span>Ver catálogo completo</span>
          <Icon
            icon="mdi:chevron-right"
            class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          />
        </RouterLink>
      </div>

      <!-- Grid de 4 Cards de Produto com Hover Elevado e Navegação para Detalhes -->
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <template v-if="vitrinesLoading">
          <div
            v-for="n in 4"
            :key="n"
            class="bg-stone-50 rounded-2xl p-4 animate-pulse h-80 flex flex-col justify-between border border-stone-100"
            aria-hidden="true"
          >
            <div class="w-full h-48 bg-stone-200 rounded-xl"></div>
            <div class="h-4 bg-stone-200 rounded w-3/4 mt-4"></div>
            <div class="h-6 bg-stone-200 rounded w-1/2 mt-2"></div>
          </div>
        </template>
        <template v-else>
          <CatalogoProdutoCard
            v-for="item in destaques"
            :key="item.id"
            :product="item"
          />
        </template>
      </div>
    </section>

    <!-- Seção "Você também pode gostar" (footer.png) -->
    <section
      v-if="vitrinesLoading || recomendados.length > 0"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4"
    >
      <div class="flex items-center justify-between">
        <h2
          class="text-2xl sm:text-3xl font-serif font-bold text-neutral-dark tracking-tight"
        >
          Você também pode gostar
        </h2>
        <RouterLink
          to="/catalogo"
          class="text-xs sm:text-sm font-semibold text-secondary hover:text-sky-700 flex items-center gap-1 group transition-colors"
        >
          <span>Explorar mais móveis</span>
          <Icon
            icon="mdi:chevron-right"
            class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          />
        </RouterLink>
      </div>

      <!-- Grid de 4 Cards de Produto (footer.png) com Navegação para Detalhes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <template v-if="vitrinesLoading">
          <div
            v-for="n in 4"
            :key="n"
            class="bg-stone-50 rounded-2xl p-4 animate-pulse h-80 flex flex-col justify-between border border-stone-100"
            aria-hidden="true"
          >
            <div class="w-full h-48 bg-stone-200 rounded-xl"></div>
            <div class="h-4 bg-stone-200 rounded w-3/4 mt-4"></div>
            <div class="h-6 bg-stone-200 rounded w-1/2 mt-2"></div>
          </div>
        </template>
        <template v-else>
          <CatalogoProdutoCard
            v-for="item in recomendados"
            :key="item.id"
            :product="item"
          />
        </template>
      </div>
    </section>
  </div>
</template>
