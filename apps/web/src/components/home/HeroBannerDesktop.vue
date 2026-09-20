<script setup lang="ts">
// Banner principal para resoluções desktop (>= 768px / md)
</script>

<template>
  <!-- Hero Banner Desktop: Fundo azul suave (surface-tint), Círculo Azul-marinho (primary) e Sofá 3 Lugares -->
  <section class="relative overflow-hidden bg-surface-tint">
    <!-- Círculo decorativo azul marinho atrás do sofá (Figma node #50:4729) -->
    <div
      class="absolute -right-32 lg:-right-0 top-10 w-[900px] h-[500px] rounded-[52%_48%_40%_25%/45%_55%_38%_48%] bg-primary pointer-events-none rotate-320"
    ></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div
        class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
      >
        <!-- Textos e Cartão Flutuante de Benefícios -->
        <div class="lg:col-span-5 space-y-8">
          <h1
            class="text-4xl sm:text-5xl lg:text-[50px] font-normal text-primary leading-[1.12]"
          >
            Móveis para<br />
            <span class="font-bold text-primary">transformar</span><br />
            o seu lar
          </h1>

          <!-- Card Branco de Benefícios (Figma node #128:9170) com Microinterações -->
          <div
            class="bg-white rounded-2xl p-4 sm:p-5 shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-stone-200/60 max-w-sm"
          >
            <div
              class="grid grid-cols-3 divide-x divide-stone-200 text-center"
            >
              <!-- Receba montado -->
              <div
                class="px-2 flex flex-col items-center gap-2 group/b py-1 rounded-lg hover:bg-sky-50/70 transition-colors cursor-default"
              >
                <img
                  src="/images/icons/icon-entrega.svg"
                  alt="Entrega"
                  class="w-8 h-8 object-contain transition-transform group-hover/b:scale-110 duration-200"
                />
                <span
                  class="text-xs font-semibold text-primary leading-tight"
                >
                  Receba<br />montado
                </span>
              </div>

              <!-- Sinta as amostras -->
              <div
                class="px-2 flex flex-col items-center gap-2 group/b py-1 rounded-lg hover:bg-sky-50/70 transition-colors cursor-default"
              >
                <img
                  src="/images/icons/icon-amostras.svg"
                  alt="Amostras"
                  class="w-8 h-8 object-contain transition-transform group-hover/b:scale-110 duration-200"
                />
                <span
                  class="text-xs font-semibold text-primary leading-tight"
                >
                  Sinta as<br />amostras
                </span>
              </div>

              <!-- Parcele em até 10x -->
              <div
                class="px-2 flex flex-col items-center gap-2 group/b py-1 rounded-lg hover:bg-sky-50/70 transition-colors cursor-default"
              >
                <img
                  src="/images/icons/icon-parcela.svg"
                  alt="Cartão"
                  class="w-8 h-8 object-contain transition-transform group-hover/b:scale-110 duration-200"
                />
                <span
                  class="text-xs font-semibold text-primary leading-tight"
                >
                  Parcele em<br />até 10x
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cena de Móveis do Figma (PNG Transparente recortado) -->
        <div
          class="lg:col-span-7 relative flex justify-center lg:justify-end"
        >
          <img
            src="/images/hero/hero-furniture.png"
            alt="Ambiente Empório Henz"
            class="w-full max-w-2xl h-auto object-contain drop-shadow-sm select-none"
          />
        </div>
      </div>
    </div>
  </section>
</template>
