<script setup lang="ts">
import { RouterLink } from "vue-router";

interface Props {
  imageSrc?: string;
  title?: string;
  description?: string;
  linkText?: string;
  to?: string;
}

withDefaults(defineProps<Props>(), {
  imageSrc: "/images/products/amostras-showroom.png",
  title: "Experimente as amostras",
  description: "Visite nossa loja e conheça de perto a qualidade dos materiais",
  linkText: "Ver localização",
  to: "/sobre-a-loja",
});
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-row items-stretch"
  >
    <!-- Imagem de Amostras de Tecidos e Madeiras -->
    <div class="w-28 sm:w-36 shrink-0 relative bg-stone-100 overflow-hidden">
      <img
        :src="imageSrc"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </div>

    <!-- Conteúdo do Convite -->
    <div class="p-3.5 sm:p-5 flex flex-col justify-center flex-1">
      <h4 class="text-neutral-dark font-bold text-sm sm:text-base leading-snug">
        {{ title }}
      </h4>
      <p class="text-stone-600 text-xs sm:text-sm mt-1 leading-relaxed">
        {{ description }}
      </p>
      <div class="mt-2.5">
        <RouterLink
          :to="to"
          class="inline-flex items-center gap-1.5 text-secondary hover:text-secondary-hover font-semibold text-xs sm:text-sm transition-colors group"
        >
          <Icon
            icon="mdi:map-marker-outline"
            class="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-secondary"
          />
          <span>{{ linkText }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
