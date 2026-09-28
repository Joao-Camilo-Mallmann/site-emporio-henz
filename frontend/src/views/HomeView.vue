<script setup lang="ts">
import HeroBannerDesktop from "@/components/home/HeroBannerDesktop.vue";
import HeroBannerMobile from "@/components/home/HeroBannerMobile.vue";
import { ref } from "vue";

const hoveredCategory = ref<string | null>(null);
const selectedCategory = ref<string>("");
const savedItems = ref<Set<string>>(new Set());
const selectedFinishes = ref<Record<string, string>>({});

function toggleSave(id: string) {
  if (savedItems.value.has(id)) {
    savedItems.value.delete(id);
  } else {
    savedItems.value.add(id);
  }
}

function selectFinish(productId: string, color: string) {
  selectedFinishes.value[productId] = color;
}

interface FinishColor {
  color?: string;
  label?: string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  installments: string;
  image: string;
  finishes: FinishColor[];
  extraFinishesCount?: number;
}

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
    image: "/images/categories/cat-quarto.png",
    slug: "quarto",
  },
  {
    id: "2",
    name: "Sala de Estar",
    image: "/images/categories/cat-sala-estar.png",
    slug: "sala-de-estar",
  },
  {
    id: "3",
    name: "Sala de Jantar",
    image: "/images/categories/cat-sala-jantar.png",
    slug: "sala-de-jantar",
  },
  {
    id: "4",
    name: "Cozinha",
    image: "/images/categories/cat-cozinha.png",
    slug: "cozinha",
  },
  {
    id: "5",
    name: "Escritório",
    image: "/images/categories/cat-escritorio.png",
    slug: "escritorio",
  },
  {
    id: "6",
    name: "Banheiro",
    image: "/images/categories/cat-banheiro.png",
    slug: "banheiro",
  },
];

// Destaques conforme Figma
const destaques: ProductItem[] = [
  {
    id: "dest-1",
    name: "Cristaleira Liara",
    price: 1900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cristaleira.png",
    finishes: [],
  },
  {
    id: "dest-2",
    name: "Mesa de Centro Pétala",
    price: 720,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-mesa-petala.png",
    finishes: [
      { color: "#C97C49", label: "Cerejeira" },
      { color: "#EFC171", label: "Mel" },
      { color: "#D7D5CF", label: "Off White" },
    ],
    extraFinishesCount: 2,
  },
  {
    id: "dest-3",
    name: "Home Ripado Supremo",
    price: 1550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-home-ripado.png",
    finishes: [
      { color: "#A58D63", label: "Nogueira" },
      { color: "#4A3024", label: "Imbuia Escura" },
    ],
  },
  {
    id: "dest-4",
    name: "Poltrona Tissi",
    price: 2370,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-poltrona-tissi.png",
    finishes: [
      { color: "#4A3024", label: "Madeira Nobre" },
      { color: "#A58D63", label: "Linho Bege" },
      { color: "#2B2B2B", label: "Couro Preto" },
    ],
  },
];

// Seção "Você também pode gostar" conforme footer.png
const recomendados: ProductItem[] = [
  {
    id: "rec-1",
    name: "Roupeiro Milano",
    price: 4900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-milano.png",
    finishes: [
      { color: "#4A3025", label: "Freijó Âmbar" },
      { color: "#A58D66", label: "Carvalho Claro" },
    ],
  },
  {
    id: "rec-2",
    name: "Roupeiro Veneza",
    price: 7300,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-roupeiro-veneza.png",
    finishes: [
      { color: "#4A3025", label: "Madeira Maciça" },
      { color: "#A58D66", label: "Champagne" },
    ],
  },
  {
    id: "rec-3",
    name: "Cômoda Itália",
    price: 1500,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-comoda-italia.png",
    finishes: [
      { color: "#4A3025", label: "Carvalho Escuro" },
      { color: "#A58D66", label: "Freijó Claro" },
    ],
  },
  {
    id: "rec-4",
    name: "Cabeceira Itália",
    price: 550,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cabeceira-italia.png",
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
          to="/"
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
      </div>

      <!-- Grid de 4 Cards de Produto com Hover Elevado e Tooltip de Acabamento -->
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="item in destaques"
          :key="item.id"
          class="bg-white rounded-2xl shadow-[0px_4px_14px_rgba(0,0,0,0.05)] border border-stone-200/70 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-pointer"
        >
          <!-- Imagem e Seletor de Acabamentos -->
          <div
            class="relative aspect-[4/3] sm:aspect-square w-full bg-stone-100 overflow-hidden rounded-t-2xl"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out select-none"
            />

            <!-- Botão Flutuante de Salvar/Favoritar com Microinteração no Hover -->
            <button
              type="button"
              @click.stop.prevent="toggleSave(item.id)"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-500 transition-all duration-200 shadow-sm hover:scale-110 cursor-pointer z-10"
              :title="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
              aria-label="Favoritar móvel"
            >
              <svg
                class="w-4 h-4 transition-colors"
                :class="
                  savedItems.has(item.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-transparent text-stone-600 group-hover:text-rose-500'
                "
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            <!-- Pílula de Acabamentos Flutuante no Canto Inferior Direito (Figma node #2:941) -->
            <div
              v-if="item.finishes.length"
              class="absolute bottom-3 right-3 bg-neutral-dark/80 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/30 shadow-sm z-10"
            >
              <span
                v-for="(finish, idx) in item.finishes"
                :key="idx"
                @click.stop.prevent="selectFinish(item.id, finish.color || '')"
                class="w-4 h-4 rounded-full border border-white inline-block shrink-0 shadow-xs hover:scale-125 transition-all duration-150 cursor-pointer"
                :class="{
                  'ring-2 ring-white scale-110':
                    selectedFinishes[item.id] === finish.color,
                }"
                :style="{ backgroundColor: finish.color || '#A58D63' }"
                :title="finish.label"
              ></span>
              <span
                v-if="item.extraFinishesCount"
                class="text-[11px] font-medium text-white px-0.5 select-none"
              >
                +{{ item.extraFinishesCount }}
              </span>
            </div>
          </div>

          <!-- Informações de Nome e Preço -->
          <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
            <h3
              class="text-neutral-dark text-[15px] font-medium leading-tight line-clamp-1 group-hover:text-secondary transition-colors"
            >
              {{ item.name }}
            </h3>

            <div class="space-y-0.5">
              <div class="text-2xl font-bold text-secondary tracking-tight">
                R$ {{ item.price.toLocaleString("pt-BR")
                }}<span class="text-sm font-bold align-top">,00</span>
              </div>
              <p class="text-xs text-secondary/80 font-normal">
                {{ item.installments }}
              </p>
            </div>
          </div>
        </div>
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
      </div>

      <!-- Grid de 4 Cards de Produto (footer.png) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="item in recomendados"
          :key="item.id"
          class="bg-white rounded-2xl shadow-[0px_4px_14px_rgba(0,0,0,0.05)] border border-stone-200/70 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-pointer"
        >
          <!-- Imagem e Acabamentos -->
          <div
            class="relative aspect-[4/3] sm:aspect-square w-full bg-stone-100 overflow-hidden rounded-t-2xl"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out select-none"
            />

            <!-- Botão Flutuante de Salvar/Favoritar -->
            <button
              type="button"
              @click.stop.prevent="toggleSave(item.id)"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-500 transition-all duration-200 shadow-sm hover:scale-110 cursor-pointer z-10"
              :title="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
              aria-label="Favoritar móvel"
            >
              <svg
                class="w-4 h-4 transition-colors"
                :class="
                  savedItems.has(item.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-transparent text-stone-600 group-hover:text-rose-500'
                "
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            <!-- Pílula de Acabamentos -->
            <div
              v-if="item.finishes.length"
              class="absolute bottom-3 right-3 bg-neutral-dark/80 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/30 shadow-sm z-10"
            >
              <span
                v-for="(finish, idx) in item.finishes"
                :key="idx"
                @click.stop.prevent="selectFinish(item.id, finish.color || '')"
                class="w-4 h-4 rounded-full border border-white inline-block shrink-0 shadow-xs hover:scale-125 transition-all duration-150 cursor-pointer"
                :class="{
                  'ring-2 ring-white scale-110':
                    selectedFinishes[item.id] === finish.color,
                }"
                :style="{ backgroundColor: finish.color || '#A58D63' }"
                :title="finish.label"
              ></span>
            </div>
          </div>

          <!-- Informações de Nome e Preço -->
          <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
            <h3
              class="text-neutral-dark text-[15px] font-medium leading-tight line-clamp-1 group-hover:text-secondary transition-colors"
            >
              {{ item.name }}
            </h3>

            <div class="space-y-0.5">
              <div class="text-2xl font-bold text-secondary tracking-tight">
                R$ {{ item.price.toLocaleString("pt-BR")
                }}<span class="text-sm font-bold align-top">,00</span>
              </div>
              <p class="text-xs text-secondary/80 font-normal">
                {{ item.installments }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
