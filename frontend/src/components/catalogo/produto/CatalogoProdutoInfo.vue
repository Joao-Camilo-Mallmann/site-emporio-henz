<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { ProductDetail, ProductVariationItem } from "@/types";
import { slugify } from "@/utils/slug";

const props = defineProps<{
  product: ProductDetail;
  selectedVariationId: string;
}>();

const emit = defineEmits<{
  (e: "select-variation", variation: ProductVariationItem): void;
  (e: "whatsapp-contact"): void;
}>();

const router = useRouter();

const formattedPriceParts = computed(() => {
  const price = props.product.price;
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
  if (!props.product.variations) return null;
  return (
    props.product.variations.find((v) => v.id === props.selectedVariationId) ||
    props.product.variations[0] ||
    null
  );
});

function variationSwatchStyle(
  variation: ProductVariationItem,
): Record<string, string> {
  if (variation.sampleImageUrl) {
    return {
      backgroundImage: `url(${variation.sampleImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  const colors = variation.colorsHex?.filter(Boolean) ?? [];
  if (colors.length >= 2) {
    return {
      background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`,
    };
  }
  return {
    backgroundColor: colors[0] || variation.colorHex || "#A58D63",
  };
}

function handleFilterBySupplier() {
  if (!props.product.supplierName) return;
  void router.push({
    path: "/catalogo",
    query: { fornecedor: slugify(props.product.supplierName) },
  });
}
</script>

<template>
  <div class="flex flex-col gap-5 sm:gap-6">
    <!-- Título do Móvel, Fornecedor e Badges -->
    <div>
      <h1
        class="text-2xl sm:text-3xl font-bold text-neutral-dark tracking-tight leading-tight"
      >
        {{ product.name }}
      </h1>

      <p
        v-if="product.supplierName"
        class="mt-1.5 text-xs sm:text-sm text-stone-600 flex flex-wrap items-center gap-1"
      >
        <span>Fornecedor:</span>
        <UiButton
          variant="link"
          size="none"
          class="text-xs sm:text-sm"
          @click="handleFilterBySupplier"
        >
          {{ product.supplierName }}
        </UiButton>
      </p>

      <!-- Badges de Fabricação e Condições Regionais -->
      <div class="flex flex-wrap items-center gap-2 mt-2.5">
        <span
          v-if="product.manufacturingTime"
          class="bg-surface-tint text-primary text-xs font-semibold px-2.5 py-1 rounded-md"
        >
          {{ product.manufacturingTime }}
        </span>
      </div>
    </div>

    <!-- Seletor de Acabamentos -->
    <div
      v-if="product.variations && product.variations.length > 0"
      class="flex flex-col gap-2.5"
    >
      <div class="text-sm text-stone-700">
        <span>Acabamento: </span>
        <span class="font-bold text-neutral-dark">
          {{ selectedVariation?.name || "Padrão" }}
        </span>
      </div>

      <div
        class="flex items-center gap-3"
        role="radiogroup"
        aria-label="Opções de acabamento"
      >
        <UiButton
          v-for="variation in product.variations"
          :key="variation.id"
          variant="custom"
          size="icon"
          role="radio"
          :aria-checked="selectedVariation?.id === variation.id"
          :aria-label="variation.name"
          :title="variation.name"
          class="size-9! sm:size-10! rounded-full! shadow-xs relative border border-black/10"
          :class="
            selectedVariation?.id === variation.id
              ? 'ring-2 ring-secondary/80 ring-offset-2 ring-offset-white scale-105'
              : 'hover:border-black/25 hover:scale-105'
          "
          :style="variationSwatchStyle(variation)"
          @click="emit('select-variation', variation)"
        >
          <span class="sr-only">{{ variation.name }}</span>
        </UiButton>
      </div>
    </div>

    <!-- Bloco de Preço e Condições de Pagamento -->
    <div class="pt-1">
      <div class="flex items-baseline text-secondary font-bold tracking-tight">
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
      <p class="text-xs text-stone-500 mt-2">
        Preço de referência, negociável junto com o frete e a montagem.
      </p>
    </div>

    <!-- Botão Principal de Conversão WhatsApp (RF12) -->
    <div>
      <UiButton
        variant="primary"
        size="lg"
        block
        class="h-12 sm:h-13 text-sm sm:text-base font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
        @click="emit('whatsapp-contact')"
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
      <div
        class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-row items-stretch"
      >
        <div
          class="w-28 sm:w-36 shrink-0 relative bg-stone-100 overflow-hidden"
        >
          <img
            src="/images/products/amostras-showroom.webp"
            alt="Experimente as amostras"
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>

        <div class="p-3.5 sm:p-5 flex flex-col justify-center flex-1">
          <h4 class="text-neutral-dark font-bold text-sm sm:text-base leading-snug">
            Experimente as amostras
          </h4>
          <p class="text-stone-600 text-xs sm:text-sm mt-1 leading-relaxed">
            Visite nossa loja e conheça de perto a qualidade dos materiais
          </p>
          <div class="mt-2.5">
            <UiButton
              variant="custom"
              size="none"
              class="inline-flex items-center gap-1.5 text-secondary hover:text-secondary-hover font-semibold text-xs sm:text-sm transition-colors group"
              @click="router.push('/sobre-a-loja')"
            >
              <Icon
                icon="mdi:map-marker-outline"
                class="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-secondary"
              />
              <span>Ver localização</span>
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
