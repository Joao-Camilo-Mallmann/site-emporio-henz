<script setup lang="ts">
import HeroBannerDesktop from "@/components/home/HeroBannerDesktop.vue";
import HeroBannerMobile from "@/components/home/HeroBannerMobile.vue";
import CatalogoProdutoCard from "@/components/catalogo/CatalogoProdutoCard.vue";
import type { CatalogProductItem } from "@/types";
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const hoveredCategory = ref<string | null>(null);
const selectedCategory = ref<string>("");

interface CategoryItem {
  id: string;
  name: string;
  image: string;
  slug: string;
}

// Categorias extraídas diretamente do Figma
const categories: CategoryItem[] = [
  {
    id: "1",
    name: "Quarto",
    image: "/images/categories/cat-quarto.webp",
    slug: "quarto",
  },
  {
    id: "2",
    name: "Sala de Estar",
    image: "/images/categories/cat-sala-estar.webp",
    slug: "sala-de-estar",
  },
  {
    id: "3",
    name: "Sala de Jantar",
    image: "/images/categories/cat-sala-jantar.webp",
    slug: "sala-de-jantar",
  },
  {
    id: "4",
    name: "Cozinha",
    image: "/images/categories/cat-cozinha.webp",
    slug: "cozinha",
  },
  {
    id: "5",
    name: "Escritório",
    image: "/images/categories/cat-escritorio.webp",
    slug: "escritorio",
  },
  {
    id: "6",
    name: "Banheiro",
    image: "/images/categories/cat-banheiro.webp",
    slug: "banheiro",
  },
];

// Destaques conforme Figma e catálogo mockado (p-12, p-9, p-10, p-11)
const destaques: CatalogProductItem[] = [
  {
    id: "p-12",
    slug: "cristaleira-liara",
    category: "sala-de-jantar",
    name: "Cristaleira Liara",
    price: 1900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cristaleira.webp",
    finishes: [],
  },
  {
    id: "p-9",
    slug: "mesa-de-centro-petala",
    category: "sala-de-estar",
    name: "Mesa de Centro Pétala",
    price: 720,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-mesa-petala.webp",
    finishes: [
      { color: "#C97C49", label: "Cerejeira" },
      { color: "#EFC171", label: "Mel" },
      { color: "#D7D5CF", label: "Off White" },
    ],
  },
  {
    id: "p-10",
    slug: "home-ripado-supremo",
    category: "sala-de-estar",
    name: "Home Ripado Supremo",
    price: 1550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-home-ripado.webp",
    finishes: [
      { color: "#A58D63", label: "Nogueira" },
      { color: "#4A3024", label: "Imbuia Escura" },
    ],
  },
  {
    id: "p-11",
    slug: "poltrona-tissi",
    category: "sala-de-estar",
    name: "Poltrona Tissi",
    price: 2370,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-poltrona-tissi.webp",
    finishes: [
      { color: "#4A3024", label: "Madeira Nobre" },
      { color: "#A58D63", label: "Linho Bege" },
      { color: "#2B2B2B", label: "Couro Preto" },
    ],
  },
];

// Seção "Você também pode gostar" conforme footer.png e catálogo mockado (p-4, p-2, p-8, p-7)
const recomendados: CatalogProductItem[] = [
  {
    id: "p-4",
    slug: "roupeiro-milano",
    category: "quarto",
    name: "Roupeiro Milano",
    price: 4900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-milano.webp",
    finishes: [
      { color: "#4A3025", label: "Freijó Âmbar" },
      { color: "#A58D66", label: "Carvalho Claro" },
    ],
  },
  {
    id: "p-2",
    slug: "roupeiro-veneza",
    category: "quarto",
    name: "Roupeiro Veneza",
    price: 7300,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-veneza.webp",
    finishes: [
      { color: "#4A3025", label: "Madeira Maciça" },
      { color: "#A58D66", label: "Champagne" },
    ],
  },
  {
    id: "p-8",
    slug: "comoda-italia",
    category: "quarto",
    name: "Cômoda Itália",
    price: 1500,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-comoda-italia.webp",
    finishes: [
      { color: "#4A3025", label: "Carvalho Escuro" },
      { color: "#A58D66", label: "Freijó Claro" },
    ],
  },
  {
    id: "p-7",
    slug: "cabeceira-italia",
    category: "quarto",
    name: "Cabeceira Itália",
    price: 550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cabeceira-italia.webp",
    finishes: [
      { color: "#4A3025", label: "Linho Areia" },
      { color: "#A58D66", label: "Cinza Chumbo" },
    ],
  },
];
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
          v-for="cat in categories"
          :key="cat.id"
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
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
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
        <CatalogoProdutoCard
          v-for="item in destaques"
          :key="item.id"
          :product="item"
        />
      </div>
    </section>

    <!-- Seção "Você também pode gostar" (footer.png) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
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
        <CatalogoProdutoCard
          v-for="item in recomendados"
          :key="item.id"
          :product="item"
        />
      </div>
    </section>
  </div>
</template>
