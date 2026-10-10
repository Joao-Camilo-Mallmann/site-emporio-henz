<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ProductImageItem } from "@/types";

interface Props {
  images: ProductImageItem[];
  modelValue?: number;
  isFavorite?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  isFavorite: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", index: number): void;
  (e: "toggle-favorite"): void;
  (e: "share"): void;
}>();

const internalIndex = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    internalIndex.value = val;
  }
);

function selectImage(index: number) {
  if (index >= 0 && index < props.images.length) {
    internalIndex.value = index;
    emit("update:modelValue", index);
  }
}

const currentImage = computed(() => {
  if (!props.images || props.images.length === 0) {
    return {
      id: "placeholder",
      url: "/images/products/roupeiro-roma-clean-1.png",
      alt: "Produto Empório Henz",
    };
  }
  return props.images[internalIndex.value] || props.images[0];
});

// Suporte a swipe no mobile
const touchStartX = ref(0);
const touchEndX = ref(0);

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  if (touch) {
    touchStartX.value = touch.clientX;
  }
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  if (touch) {
    touchEndX.value = touch.clientX;
  }
}

function handleTouchEnd() {
  const diff = touchStartX.value - touchEndX.value;
  // Threshold de 40px para detecção de gesto de swipe
  if (Math.abs(diff) > 40 && touchEndX.value !== 0) {
    if (diff > 0) {
      // Próxima imagem
      if (internalIndex.value < props.images.length - 1) {
        selectImage(internalIndex.value + 1);
      }
    } else {
      // Imagem anterior
      if (internalIndex.value > 0) {
        selectImage(internalIndex.value - 1);
      }
    }
  }
  touchStartX.value = 0;
  touchEndX.value = 0;
}
</script>

<template>
  <div class="flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 items-start w-full">
    <!-- Coluna de miniaturas verticais (Desktop) / Linha horizontal (Mobile) -->
    <div
      v-if="images && images.length > 1"
      class="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 w-full lg:w-auto shrink-0 justify-start"
      role="tablist"
      aria-label="Miniaturas de fotos do produto"
    >
      <button
        v-for="(img, idx) in images"
        :key="img.id || idx"
        type="button"
        role="tab"
        :aria-selected="internalIndex === idx"
        :aria-label="`Ver foto ${idx + 1}`"
        class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-stone-50 shrink-0 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        :class="[
          internalIndex === idx
            ? 'border-secondary ring-2 ring-secondary/20 shadow-xs'
            : 'border-stone-200/80 hover:border-stone-300 opacity-80 hover:opacity-100',
        ]"
        @click="selectImage(idx)"
      >
        <img
          :src="img.thumbnailUrl || img.url"
          :alt="img.alt || `Miniatura ${idx + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
    </div>

    <!-- Contêiner da Imagem Principal -->
    <div
      class="relative w-full aspect-square max-w-[687px] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 shadow-xs border border-stone-200/60 flex items-center justify-center select-none"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Foto Principal -->
      <transition name="fade" mode="out-in">
        <img
          :key="currentImage.url"
          :src="currentImage.url"
          :alt="currentImage.alt"
          class="w-full h-full object-cover transition-transform duration-300"
          loading="eager"
        />
      </transition>

      <!-- Chip Indicador de Foto (Top-Left) -->
      <div
        class="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-white/95 backdrop-blur-xs text-neutral-dark text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-md shadow-xs border border-stone-200/50 z-10"
        aria-live="polite"
      >
        {{ internalIndex + 1 }}/{{ images.length || 1 }}
      </div>

      <!-- Botões de Ação Flutuantes (Top-Right) -->
      <div class="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
        <!-- Botão Favoritar -->
        <button
          type="button"
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-neutral-dark hover:text-red-500 hover:bg-stone-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
          :aria-label="isFavorite ? 'Remover dos favoritos' : 'Salvar produto nos favoritos'"
          @click="emit('toggle-favorite')"
        >
          <Icon
            :icon="isFavorite ? 'mdi:heart' : 'mdi:heart-outline'"
            class="w-5 h-5 transition-transform active:scale-125"
            :class="{ 'text-red-500': isFavorite }"
          />
        </button>

        <!-- Botão Compartilhar -->
        <button
          type="button"
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-neutral-dark hover:text-secondary hover:bg-stone-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
          aria-label="Compartilhar produto"
          @click="emit('share')"
        >
          <Icon icon="mdi:share-variant-outline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Indicadores de Pontos (Bottom Dots) -->
      <div
        v-if="images && images.length > 1"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-1 rounded-full bg-black/10 backdrop-blur-xs"
      >
        <button
          v-for="(_, idx) in images"
          :key="idx"
          type="button"
          :aria-label="`Ir para foto ${idx + 1}`"
          class="transition-all duration-300 cursor-pointer rounded-full focus:outline-none"
          :class="[
            internalIndex === idx
              ? 'w-5 h-2 bg-secondary'
              : 'w-2 h-2 bg-white/80 hover:bg-white shadow-xs',
          ]"
          @click="selectImage(idx)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
