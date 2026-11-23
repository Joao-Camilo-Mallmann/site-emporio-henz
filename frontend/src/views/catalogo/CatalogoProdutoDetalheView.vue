<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue3-toastify";
import { produtosApi } from "@/api";
import { mapearDetalheProduto } from "@/composables/useCatalogoProdutos";
import { useCategoriasStore } from "@/stores/categorias";
import { useListasStore } from "@/stores/listas";
import { storeSiteUrl, storeWhatsappUrl } from "@/utils/phone";
import { shareOrCopyLink } from "@/utils/share";
import type {
  ProductDetail,
  ProductVariationItem,
  CatalogProductItem,
} from "@/types";
import CatalogoProdutoGaleria from "@/components/catalogo/produto/CatalogoProdutoGaleria.vue";
import CatalogoProdutoInfo from "@/components/catalogo/produto/CatalogoProdutoInfo.vue";
import CatalogoProdutoCard from "@/components/catalogo/CatalogoProdutoCard.vue";

const route = useRoute();
const router = useRouter();
const categoriasStore = useCategoriasStore();
const listasStore = useListasStore();

const loading = ref(true);
const error = ref<string | null>(null);
const product = ref<ProductDetail | null>(null);

const activeImageIndex = ref(0);
const selectedVariationId = ref("");
const isFavorite = computed(() => {
  if (!product.value) return false;
  return listasStore.isProductSavedAnywhere(product.value.id);
});

const selectedVariation = computed(() => {
  if (!product.value?.variations) return null;
  return (
    product.value.variations.find((v) => v.id === selectedVariationId.value) ||
    product.value.variations[0] ||
    null
  );
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadProduct(identifier: string) {
  loading.value = true;
  error.value = null;
  try {
    const isUuid = UUID_REGEX.test(identifier);
    const [dto, recomendados] = await Promise.all([
      produtosApi.buscarPorId(identifier),
      produtosApi.buscarRecomendados(identifier).catch(() => []),
      categoriasStore.carregar(),
    ]);
    const data = mapearDetalheProduto(dto, categoriasStore.lista, recomendados);
    product.value = data;
    activeImageIndex.value = 0;
    if (data.variations.length > 0) {
      selectedVariationId.value = data.variations[0]?.id ?? "";
    }
    // Define título dinâmico na aba
    document.title = `${data.name} | Empório Henz`;

    if (isUuid && data.slug) {
      void router.replace({
        name: "catalogo-produto",
        params: { slug: data.slug },
      });
    }
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
        img.url === variation.imageRef || img.thumbnailUrl === variation.imageRef,
    );
    if (idx !== -1) {
      activeImageIndex.value = idx;
    }
  }
}

function selectVariation(variation: ProductVariationItem) {
  selectedVariationId.value = variation.id;
  onVariationChange(variation);
}

function toggleFavorite() {
  if (!product.value) return;

  const currentVariation = product.value.variations.find(
    (v) => v.id === selectedVariationId.value,
  );

  listasStore.openSaveModal({
    productId: product.value.id,
    variationId: currentVariation?.id,
    productSlug: product.value.slug,
    name: product.value.name,
    price: product.value.price,
    image:
      product.value.images[activeImageIndex.value]?.url ||
      product.value.images[0]?.url ||
      "",
    finishLabel: currentVariation?.name,
    finishColor: currentVariation?.colorHex,
  });
}

async function handleShare() {
  if (!product.value) return;

  const productRoute = router.resolve({
    name: "catalogo-produto",
    params: { slug: product.value.slug || product.value.id },
  });
  const url = storeSiteUrl(productRoute.href);

  const result = await shareOrCopyLink({
    title: `${product.value.name} | Empório Henz`,
    url,
  });

  if (result === "copied") {
    toast.success("Link copiado para a área de transferência!");
  } else if (result === "failed") {
    toast.info(`Não foi possível copiar. Link do produto: ${url}`);
  }
}

function handleWhatsAppContact() {
  if (!product.value) return;
  const currentUrl = storeSiteUrl(route.fullPath);
  const finishName = selectedVariation.value?.name || "Padrão";
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.value.price || 0);
  const message = `Olá! Gostaria de mais informações sobre o ${product.value.name} (Acabamento: ${finishName}) no valor de ${formattedPrice}.\n\nLink: ${currentUrl}`;
  window.open(storeWhatsappUrl(message), "_blank", "noopener,noreferrer");
}

function navigateToRelated(related: CatalogProductItem) {
  router.push({
    name: "catalogo-produto",
    params: { slug: related.slug || related.id },
  });
}

watch(
  () => route.params.slug,
  (newSlug) => {
    if (
      typeof newSlug === "string" &&
      newSlug &&
      product.value?.slug !== newSlug
    ) {
      loadProduct(newSlug);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
);

onMounted(() => {
  const slug = route.params.slug as string;
  if (slug) {
    loadProduct(slug);
  }
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
        {{
          error ||
          "O móvel que você procura não está mais disponível ou o link é inválido."
        }}
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
          <CatalogoProdutoGaleria
            :images="product.images"
            v-model="activeImageIndex"
            :is-favorite="isFavorite"
            @toggle-favorite="toggleFavorite"
            @share="handleShare"
          />
        </div>

        <!-- Coluna Direita: Informações Comerciais e Conversão -->
        <div class="lg:col-span-5">
          <CatalogoProdutoInfo
            :product="product"
            :selected-variation-id="selectedVariationId"
            @select-variation="selectVariation"
            @whatsapp-contact="handleWhatsAppContact"
          />
        </div>
      </section>

      <!-- Bloco Médio: Descrição Detalhada e Ficha Técnica Zebrada -->
      <section
        v-if="product.description || (product.specifications && product.specifications.length > 0)"
        class="border-t border-stone-200/80 pt-10 sm:pt-12 space-y-6"
        aria-label="Especificações e descrição do móvel"
      >
        <div v-if="product.description" class="max-w-4xl space-y-3">
          <h2 class="text-lg sm:text-xl font-bold text-neutral-dark">
            Descrição do produto
          </h2>
          <p
            class="text-sm sm:text-base text-stone-700 leading-relaxed font-normal whitespace-pre-line"
          >
            {{ product.description }}
          </p>
        </div>

        <!-- Tabela Técnica Zebrada -->
        <div class="max-w-4xl pt-2">
          <div
            v-if="product.specifications && product.specifications.length > 0"
            class="w-full overflow-hidden rounded-xl border border-stone-200 shadow-xs"
          >
            <table class="w-full text-left border-collapse">
              <tbody>
                <tr
                  v-for="(spec, index) in product.specifications"
                  :key="spec.label"
                  class="transition-colors border-b border-stone-100 last:border-b-0"
                  :class="index % 2 === 0 ? 'bg-white' : 'bg-stone-50'"
                >
                  <td
                    class="py-3 px-4 sm:px-6 text-xs sm:text-sm font-medium text-stone-700 w-1/3 sm:w-1/4 align-top"
                  >
                    {{ spec.label }}
                  </td>
                  <td
                    class="py-3 px-4 sm:px-6 text-xs sm:text-sm text-neutral-dark font-normal leading-relaxed align-top"
                  >
                    {{ spec.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
          <CatalogoProdutoCard
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
