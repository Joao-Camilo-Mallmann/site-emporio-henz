<script setup lang="ts">
import { Icon } from "@iconify/vue";
// Banner principal para resoluções mobile (< 768px / md)
// Conforme especificações do Figma (nó #38:2521 e referência home-mobile.png)
</script>

<template>
  <!-- Hero Banner Mobile: Fundo azul suave (surface-tint), composição da poltrona com luminária e título em 26px -->
  <section class="relative overflow-hidden bg-surface-tint block md:hidden">
    <div class="relative w-full mx-auto select-none">
      <!-- Imagem da Composição da Poltrona Azul com fundo orgânico marinho -->
      <img
        src="/images/hero/hero-banner-mobile.png"
        alt="Móveis para transformar o seu lar - Empório Henz"
        class="w-full h-auto block object-cover pointer-events-none"
      />

      <!-- Tipografia Oficial do Figma (26px, cor primary, sem card de benefícios) -->
      <div class="absolute top-4 left-4 z-10 space-y-2">
        <h1
          class="text-[24px] sm:text-[26px] font-normal text-primary leading-[1.12] tracking-tight"
        >
          Móveis para<br />
          <span class="font-bold text-primary">transformar</span><br />
          o seu lar
        </h1>

        <RouterLink to="/catalogo" class="inline-block pt-1">
          <UiButton
            variant="primary"
            size="sm"
            class="shadow-md text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <span>Ver Catálogo</span>
            <Icon icon="mdi:arrow-right" class="w-3.5 h-3.5" />
          </UiButton>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
