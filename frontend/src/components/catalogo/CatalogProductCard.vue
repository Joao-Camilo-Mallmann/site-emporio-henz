<script setup lang="ts">
import type { CatalogProductItem, CatalogVariationBadge } from "@/types";
import { computed } from "vue";
import { useRouter } from "vue-router";

interface Props {
  product: CatalogProductItem;
}

const props = defineProps<Props>();

const router = useRouter();

const emit = defineEmits<{
  (e: "click", product: CatalogProductItem): void;
  (e: "select-finish", finish: CatalogVariationBadge): void;
}>();

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

function handleCardClick() {
  emit("click", props.product);
  const identifier = props.product.slug || props.product.id;
  if (identifier) {
    router.push(`/produtos/${identifier}`);
  }
}

function handleFinishClick(finish: CatalogVariationBadge) {
  emit("select-finish", finish);
}
</script>

<template>
  <article
    tabindex="0"
    role="button"
    :aria-label="product.name"
    class="bg-white rounded-2xl shadow-[0px_4px_14px_rgba(0,0,0,0.05)] border border-stone-200/70 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
  >
    <!-- Contêiner de Imagem com Aspect Square -->
    <div
      class="relative w-full aspect-square rounded-t-2xl overflow-hidden bg-stone-100"
    >
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-stone-300 bg-stone-100"
      >
        <Icon icon="mdi:image-outline" class="w-12 h-12" />
      </div>

      <!-- Pílula de Acabamentos no canto inferior direito -->
      <div
        v-if="product.finishes && product.finishes.length > 0"
        class="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-neutral-dark/85 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 border border-white/20 shadow-md z-10"
        aria-label="Acabamentos disponíveis"
        @click.stop
      >
        <span
          v-for="(finish, idx) in product.finishes"
          :key="idx"
          role="button"
          tabindex="0"
          class="w-3 sm:w-4 h-3 sm:h-4 rounded-full border border-white shrink-0 transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white cursor-pointer shadow-xs"
          :style="{ backgroundColor: finish.color }"
          :title="finish.label || `Acabamento ${idx + 1}`"
          @click.stop="handleFinishClick(finish)"
          @keydown.enter.stop="handleFinishClick(finish)"
          @keydown.space.stop.prevent="handleFinishClick(finish)"
        />
      </div>
    </div>

    <!-- Informações do Produto -->
    <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between">
      <div>
        <h3
          class="text-neutral-dark text-xs sm:text-base font-semibold leading-tight line-clamp-1 group-hover:text-secondary transition-colors"
          :title="product.name"
        >
          {{ product.name }}
        </h3>
      </div>

      <div class="mt-1 sm:mt-2">
        <div
          class="flex items-baseline text-secondary font-bold tracking-tight"
        >
          <span class="text-base sm:text-2xl font-bold tracking-tight"
            >R$&nbsp;{{ formattedPriceParts.integer }}</span
          >
          <span class="text-[10px] sm:text-xs font-bold relative -top-1 ml-0.5"
            >,{{ formattedPriceParts.cents }}</span
          >
        </div>
        <p
          v-if="product.installments"
          class="text-[11px] sm:text-xs text-secondary font-medium mt-0.5"
        >
          {{ product.installments }}
        </p>
      </div>
    </div>
  </article>
</template>
