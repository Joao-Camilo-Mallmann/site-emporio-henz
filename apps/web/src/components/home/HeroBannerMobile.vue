<script setup lang="ts">
// Banner principal para resoluções mobile (< 768px / md)
// Conforme especificações do Figma (nó #38:2521 e referência home-mobile.png)
</script>

<template>
  <!-- Hero Banner Mobile: Fundo azul suave (surface-tint), composição da poltrona com luminária e título em 26px -->
  <section class="relative overflow-hidden bg-surface-tint block md:hidden">
    <div class="relative w-full mx-auto select-none">
      <!-- Imagem da Composição da Poltrona Azul com fundo orgânico marinho -->
      <img
        src="/images/hero-banner-mobile.png"
        alt="Móveis para transformar o seu lar - Empório Henz"
        class="w-full h-auto block object-cover pointer-events-none"
      />

      <!-- Tipografia Oficial do Figma (26px, cor primary, sem card de benefícios) -->
      <div class="absolute top-5 left-5 z-10">
        <h1
          class="text-[26px] font-normal text-primary leading-[1.12] tracking-tight"
        >
          Móveis para<br />
          <span class="font-bold text-primary">transformar</span><br />
          o seu lar
        </h1>
      </div>
    </div>
  </section>
</template>
