<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue3-toastify";
import { produtosApi } from "@/api";
import type {
  ProductDetail,
  ProductVariationItem,
  CatalogProductItem,
} from "@/types";
import ProductGallery from "@/components/produto/ProductGallery.vue";
import ProductFinishesSelector from "@/components/produto/ProductFinishesSelector.vue";
import ProductShowroomCard from "@/components/produto/ProductShowroomCard.vue";
import ProductSpecsTable from "@/components/produto/ProductSpecsTable.vue";
import CatalogProductCard from "@/components/catalogo/CatalogProductCard.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const product = ref<ProductDetail | null>(null);

const activeImageIndex = ref(0);
const selectedVariationId = ref("");
const isFavorite = ref(false);

const formattedPriceParts = computed(() => {
  const price = product.value?.price;
  if (typeof price !== "number" || isNaN(price)) {
    return { integer: "0", cents: "00" };
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  const [integer, cents] = formatted.split(",");
  return {
    integer: integer ?? "0",
    cents: cents ?? "00",
  };
});

const selectedVariation = computed(() => {
  if (!product.value?.variations) return null;
  return (
    product.value.variations.find((v) => v.id === selectedVariationId.value) ||
    product.value.variations[0] ||
    null
  );
});

async function loadProduct(id: string) {
  loading.value = true;
  error.value = null;
  try {
    const data = await produtosApi.buscarPorId(id);
    product.value = data;
    activeImageIndex.value = 0;
    if (data.variations && data.variations.length > 0) {
      selectedVariationId.value = data.variations[0]?.id ?? "";
    }
    // Define título dinâmico na aba
    document.title = `${data.name} | Empório Henz`;
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Não foi possível carregar os detalhes do produto.";
    error.value = msg;
  } finally {
    loading.value = false;
  }
}

function onVariationChange(variation: ProductVariationItem) {
  if (!product.value) return;
  if (variation.imageRef) {
    const idx = product.value.images.findIndex(
      (img) =>
        img.url === variation.imageRef || img.thumbnailUrl === variation.imageRef
    );
    if (idx !== -1) {
      activeImageIndex.value = idx;
    }
  }
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
  if (isFavorite.value) {
    toast.success("Produto salvo nos seus favoritos!");
  } else {
    toast.info("Produto removido dos favoritos.");
  }
}

async function handleShare() {
  try {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    } else {
      toast.info(`Link do produto: ${url}`);
    }
  } catch {
    toast.info(`Link do produto: ${window.location.href}`);
  }
}

function handleWhatsAppContact() {
  if (!product.value) return;
  const whatsappNumber = "5551998981063";
  const currentUrl = window.location.href;
  const finishName = selectedVariation.value?.name || "Padrão";
  const formattedPrice = `R$ ${formattedPriceParts.value.integer},${formattedPriceParts.value.cents}`;
  const message = `Olá! Gostaria de mais informações sobre o ${product.value.name} (Acabamento: ${finishName}) no valor de ${formattedPrice}.\n\nLink: ${currentUrl}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

function navigateToRelated(related: CatalogProductItem) {
  const identifier = related.slug || related.id;
  router.push(`/produtos/${identifier}`);
}

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadProduct(newId as string);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
);

onMounted(() => {
  const id = (route.params.id as string) || "p-1";
  loadProduct(id);
});
</script>

<template>
  <div class="bg-surface-light min-h-[70vh]">
    <!-- Estado de Carregamento (Skeleton) -->
    <div
      v-if="loading"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse space-y-8"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div class="lg:col-span-7 aspect-square bg-stone-200/70 rounded-3xl" />
        <div class="lg:col-span-5 space-y-4">
          <div class="h-8 bg-stone-200/70 rounded-md w-3/4" />
          <div class="flex gap-2">
            <div class="h-6 bg-stone-200/70 rounded-md w-28" />
            <div class="h-6 bg-stone-200/70 rounded-md w-32" />
          </div>
          <div class="h-12 bg-stone-200/70 rounded-md w-1/2" />
          <div class="h-12 bg-stone-200/70 rounded-xl w-full" />
        </div>
      </div>
    </div>

    <!-- Estado de Erro -->
    <div
      v-else-if="error || !product"
      class="max-w-3xl mx-auto px-4 py-20 text-center space-y-4"
    >
      <div
        class="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400"
      >
        <Icon icon="mdi:alert-circle-outline" class="w-8 h-8" />
      </div>
      <h2 class="text-2xl font-bold text-neutral-dark">
        Produto não encontrado
      </h2>
      <p class="text-stone-600 max-w-md mx-auto">
        {{ error || "O móvel que você procura não está mais disponível ou o link é inválido." }}
      </p>
      <div class="pt-4">
        <UiButton
          variant="primary"
          size="md"
          @click="router.push('/catalogo')"
        >
          Explorar Catálogo Completo
        </UiButton>
      </div>
    </div>

    <!-- Conteúdo Completo do Produto -->
    <div
      v-else
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-12 sm:space-y-16"
    >
      <!-- Bloco Superior: Galeria e Ficha de Compra -->
      <section
        class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
        aria-label="Detalhes principais do produto"
      >
        <!-- Coluna Esquerda: Galeria de Fotos Interativa -->
        <div class="lg:col-span-7 w-full">
          <ProductGallery
            :images="product.images"
            v-model="activeImageIndex"
            :is-favorite="isFavorite"
            @toggle-favorite="toggleFavorite"
            @share="handleShare"
          />
        </div>

        <!-- Coluna Direita: Informações Comerciais e Conversão -->
        <div class="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          <!-- Título do Móvel -->
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold text-neutral-dark tracking-tight leading-tight"
            >
              {{ product.name }}
            </h1>

            <!-- Badges de Fabricação e Condições Regionais -->
            <div class="flex flex-wrap items-center gap-2 mt-2.5">
              <span
                v-if="product.manufacturingTime"
                class="bg-surface-tint text-primary text-xs font-semibold px-2.5 py-1 rounded-md"
              >
                {{ product.manufacturingTime }}
              </span>
              <span
                v-if="product.deliveryCondition"
                class="bg-surface-tint text-primary text-xs font-semibold px-2.5 py-1 rounded-md"
              >
                {{ product.deliveryCondition }}
              </span>
            </div>
          </div>

          <!-- Seletor de Acabamentos -->
          <ProductFinishesSelector
            v-if="product.variations && product.variations.length > 0"
            :variations="product.variations"
            v-model="selectedVariationId"
            @change="onVariationChange"
          />

          <!-- Bloco de Preço e Condições de Pagamento -->
          <div class="pt-1">
            <div
              class="flex items-baseline text-secondary font-bold tracking-tight"
            >
              <span class="text-xl sm:text-2xl font-bold mr-1">R$</span>
              <span class="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {{ formattedPriceParts.integer }}
              </span>
              <span class="text-lg sm:text-xl font-bold relative -top-1.5 ml-0.5">
                ,{{ formattedPriceParts.cents }}
              </span>
            </div>

            <!-- Chips de Condições Comerciais -->
            <div class="flex items-center gap-2 mt-2">
              <span
                v-if="product.installments"
                class="bg-surface-tint text-primary text-xs font-semibold px-2.5 py-1 rounded-md"
              >
                {{ product.installments }}
              </span>
              <span
                v-if="product.discountPixPercent"
                class="bg-surface-tint text-primary text-xs font-semibold px-2.5 py-1 rounded-md"
              >
                {{ product.discountPixPercent }}% OFF no PIX
              </span>
            </div>
          </div>

          <!-- Botão Principal de Conversão WhatsApp (RF12) -->
          <div>
            <UiButton
              variant="primary"
              size="lg"
              block
              class="h-12 sm:h-13 text-sm sm:text-base font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              @click="handleWhatsAppContact"
            >
              <Icon icon="mdi:whatsapp" class="w-5 h-5 shrink-0 text-white" />
              <span>Entrar em contato</span>
            </UiButton>
          </div>

          <!-- Principais Características (Bullet points) -->
          <div
            v-if="product.mainFeatures && product.mainFeatures.length > 0"
            class="pt-1"
          >
            <h3 class="text-sm sm:text-base font-bold text-neutral-dark">
              Principais características
            </h3>
            <ul
              class="mt-2 space-y-1.5 text-xs sm:text-sm text-stone-700 list-disc list-inside marker:text-stone-400"
            >
              <li v-for="(feature, idx) in product.mainFeatures" :key="idx">
                {{ feature }}
              </li>
            </ul>
          </div>

          <!-- Card Oficial de Convite ao Showroom Físico (RF06) -->
          <div class="pt-2">
            <ProductShowroomCard />
          </div>
        </div>
      </section>

      <!-- Bloco Médio: Descrição Detalhada e Ficha Técnica Zebrada -->
      <section
        class="border-t border-stone-200/80 pt-10 sm:pt-12 space-y-6"
        aria-label="Especificações e descrição do móvel"
      >
        <div class="max-w-4xl space-y-3">
          <h2 class="text-lg sm:text-xl font-bold text-neutral-dark">
            Descrição do produto
          </h2>
          <p
            class="text-sm sm:text-base text-stone-700 leading-relaxed font-normal"
          >
            {{ product.description }}
          </p>
        </div>

        <!-- Tabela Técnica Zebrada -->
        <div class="max-w-4xl pt-2">
          <ProductSpecsTable :specifications="product.specifications" />
        </div>
      </section>

      <!-- Bloco Inferior: Produtos Recomendados ("Você também pode gostar") -->
      <section
        v-if="product.relatedProducts && product.relatedProducts.length > 0"
        class="border-t border-stone-200/80 pt-10 sm:pt-12"
        aria-label="Produtos relacionados"
      >
        <h2 class="text-lg sm:text-xl font-bold text-neutral-dark mb-6">
          Você também pode gostar
        </h2>

        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          <CatalogProductCard
            v-for="relProduct in product.relatedProducts"
            :key="relProduct.id"
            :product="relProduct"
            @click="navigateToRelated(relProduct)"
          />
        </div>
      </section>
    </div>
  </div>
</template>
