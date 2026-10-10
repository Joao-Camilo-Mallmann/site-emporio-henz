<script setup lang="ts">
import HeroBannerDesktop from "@/components/home/HeroBannerDesktop.vue";
import HeroBannerMobile from "@/components/home/HeroBannerMobile.vue";
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue3-toastify";

const router = useRouter();

const hoveredCategory = ref<string | null>(null);
const selectedCategory = ref<string>("");
const savedItems = ref<Set<string>>(new Set());
const selectedFinishes = ref<Record<string, string>>({});

function toggleSave(id: string, name?: string) {
  if (savedItems.value.has(id)) {
    savedItems.value.delete(id);
    toast.info(
      name ? `${name} removido dos salvos.` : "Item removido dos salvos.",
    );
  } else {
    savedItems.value.add(id);
    toast.success(
      name ? `${name} salvo nos seus favoritos!` : "Item salvo com sucesso!",
    );
  }
}

function selectFinish(productId: string, color: string) {
  selectedFinishes.value[productId] = color;
}

function goToProduct(identifier: string) {
  router.push(`/produtos/${identifier}`);
}

interface FinishColor {
  color?: string;
  label?: string;
}

interface ProductItem {
  id: string;
  slug: string;
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

// Destaques conforme Figma e catálogo mockado (p-12, p-9, p-10, p-11)
const destaques: ProductItem[] = [
  {
    id: "p-12",
    slug: "cristaleira-liara",
    name: "Cristaleira Liara",
    price: 1900,
    installments: "Até 10x no cartão",
    image: "/images/products/prod-cristaleira.png",
    finishes: [],
  },
  {
    id: "p-9",
    slug: "mesa-de-centro-petala",
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
    id: "p-10",
    slug: "home-ripado-supremo",
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
    id: "p-11",
    slug: "poltrona-tissi",
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

// Seção "Você também pode gostar" conforme footer.png e catálogo mockado (p-4, p-2, p-8, p-7)
const recomendados: ProductItem[] = [
  {
    id: "p-4",
    slug: "roupeiro-milano",
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
    id: "p-2",
    slug: "roupeiro-veneza",
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
    id: "p-8",
    slug: "comoda-italia",
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
    id: "p-7",
    slug: "cabeceira-italia",
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
        <div
          v-for="item in destaques"
          :key="item.id"
          role="link"
          tabindex="0"
          @click="goToProduct(item.slug || item.id)"
          @keydown.enter="goToProduct(item.slug || item.id)"
          class="bg-white rounded-2xl shadow-[0px_4px_14px_rgba(0,0,0,0.05)] border border-stone-200/70 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/50"
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

            <!-- Botão Flutuante de Salvar/Favoritar -->
            <UiButton
              variant="custom"
              size="icon"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-500 transition-all duration-200 shadow-sm hover:scale-110 cursor-pointer z-10 p-0 border-none"
              @click.stop.prevent="toggleSave(item.id, item.name)"
              :title="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
              :aria-label="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
            >
              <Icon
                icon="mdi:heart"
                class="w-4 h-4 transition-colors"
                :class="
                  savedItems.has(item.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-transparent text-stone-600 group-hover:text-rose-500'
                "
              />
            </UiButton>

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
        <div
          v-for="item in recomendados"
          :key="item.id"
          role="link"
          tabindex="0"
          @click="goToProduct(item.slug || item.id)"
          @keydown.enter="goToProduct(item.slug || item.id)"
          class="bg-white rounded-2xl shadow-[0px_4px_14px_rgba(0,0,0,0.05)] border border-stone-200/70 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/50"
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
            <UiButton
              variant="custom"
              size="icon"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-500 transition-all duration-200 shadow-sm hover:scale-110 cursor-pointer z-10 p-0 border-none"
              @click.stop.prevent="toggleSave(item.id, item.name)"
              :title="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
              :aria-label="
                savedItems.has(item.id) ? 'Remover dos salvos' : 'Salvar móvel'
              "
            >
              <Icon
                icon="mdi:heart"
                class="w-4 h-4 transition-colors"
                :class="
                  savedItems.has(item.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-transparent text-stone-600 group-hover:text-rose-500'
                "
              />
            </UiButton>

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
