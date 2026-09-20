<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
}

// Cards da seção "Como funciona" (Figma node #1-1518)
const comoFuncionaItems = [
  {
    icon: "mdi:magnify",
    title: "Explore e inspire-se",
    description:
      "Navegue pelo nosso site e conheça diferentes estilos e possibilidades para o seu ambiente no conforto da sua casa.",
  },
  {
    icon: "mdi:layers-outline",
    title: "Loja física e amostras",
    description:
      "Visite-nos para conferir tecidos e acabamentos de perto, tirar dúvidas e finalizar sua compra com segurança.",
  },
  {
    icon: "mdi:sofa-outline",
    title: "Móveis sob encomenda",
    description:
      "Garantia de produtos novos, feitos especialmente para você com alta qualidade de materiais e muita atenção aos detalhes.",
  },
  {
    icon: "mdi:truck-delivery-outline",
    title: "Entrega e montagem",
    description:
      "Entrega e montagem em todo Vale do Taquari. Tudo feito com uma equipe experiente, garantindo cuidado em cada etapa.",
  },
];
</script>

<template>
  <div class="w-full min-h-screen bg-white">
    <!-- 1. HERO BANNER INSTITUCIONAL -->
    <section
      class="relative w-full overflow-hidden bg-primary min-h-[260px] sm:min-h-[320px] md:min-h-[360px] flex items-center justify-center"
      aria-label="Hero institucional Empório Henz"
    >
      <!-- Imagem de fundo do showroom com overlay escuro -->
      <img
        src="/images/about/showroom-loja.png"
        alt="Showroom da Empório Henz"
        class="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div class="absolute inset-0 bg-primary/80 backdrop-blur-[1px]"></div>

      <!-- Botão Voltar (SPA) posicionado no topo esquerdo do Hero -->
      <div class="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <button
          type="button"
          @click="goBack"
          class="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-white/40"
          aria-label="Voltar para a página anterior"
        >
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
      </div>

      <!-- Conteúdo Centralizado do Hero Banner -->
      <div
        class="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center text-center text-white"
      >
        <div class="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
          <!-- Logo Horizontal Branca -->
          <div class="flex flex-col items-center">
            <img
              src="/images/logo-horizontal.svg"
              alt="Empório Henz"
              class="h-10 sm:h-12 md:h-14 w-auto object-contain filter brightness-0 invert"
            />
          </div>

          <!-- Divisória vertical elegante -->
          <div class="h-12 sm:h-16 w-px bg-white/30"></div>

          <!-- Selo Comemorativo de 50 Anos -->
          <div class="flex flex-col items-start text-left">
            <span
              class="text-xs sm:text-sm font-medium tracking-wide text-white/90"
            >
              Há quase
            </span>
            <span
              class="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-none font-sans"
            >
              50 ANOS
            </span>
            <span
              class="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-white/90"
            >
              CONSTRUINDO HISTÓRIAS
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTAINER PRINCIPAL CENTRALIZADO -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <!-- 2. SEÇÃO EDITORIAL E TEXTUAL DA HISTÓRIA -->
      <section aria-label="História da Empório Henz" class="space-y-6">
        <h1
          class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-dark tracking-tight leading-tight"
        >
          Empório Henz: Onde a sua história encontra o seu lugar
        </h1>

        <div
          class="space-y-4 text-neutral-dark/90 text-base sm:text-lg leading-relaxed"
        >
          <p>
            Acreditamos que uma casa vira um lar quando é preenchida por memórias.
            Nascida em Cruzeiro do Sul, a
            <strong class="font-bold text-neutral-dark">Empório Henz</strong> é um
            negócio familiar que há quase cinco décadas transforma ambientes e
            constrói relações de confiança que passam de geração em geração.
          </p>

          <p>
            Hoje, unimos nossa tradição à praticidade digital. Você escolhe os
            móveis no conforto da sua tela e finaliza a compra na nossa loja
            física, com total segurança e o atendimento acolhedor de sempre.
          </p>
        </div>

        <!-- Foto da Equipe / Fundadores -->
        <div class="pt-4">
          <div class="w-full rounded-2xl overflow-hidden shadow-sm border border-stone-200/80">
            <img
              src="/images/about/equipe-henz-alta.png"
              alt="Fundadoras e Equipe Empório Henz"
              class="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      <!-- Divisória sutil -->
      <hr class="border-t border-stone-200" />

      <!-- 3. SEÇÃO COMO FUNCIONA -->
      <section aria-label="Como funciona" class="space-y-6">
        <div>
          <h2
            class="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight"
          >
            Como funciona
          </h2>
          <p class="mt-2 text-neutral-dark/80 text-sm sm:text-base leading-relaxed">
            Unimos a praticidade do digital à segurança da experiência presencial para tornar sua compra simples e confiável.
          </p>
        </div>

        <!-- Grid de 4 Cards azuis -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="(item, idx) in comoFuncionaItems"
            :key="idx"
            class="bg-surface-tint/40 border border-secondary/30 rounded-2xl p-5 sm:p-6 flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:bg-surface-tint/60"
          >
            <div class="shrink-0 text-primary mt-1">
              <Icon :icon="item.icon" class="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div class="space-y-1.5 flex-1">
              <h3 class="font-bold text-neutral-dark text-base sm:text-lg leading-snug">
                {{ item.title }}
              </h3>
              <p class="text-neutral-dark/80 text-xs sm:text-sm leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Divisória sutil -->
      <hr class="border-t border-stone-200" />

      <!-- 4. SEÇÃO VISITE NOSSA LOJA -->
      <section aria-label="Visite nossa loja" class="space-y-6">
        <h2
          class="text-2xl sm:text-3xl font-extrabold text-neutral-dark tracking-tight"
        >
          Visite nossa loja
        </h2>

        <!-- Informações de Contato e Horários -->
        <div class="space-y-5 text-neutral-dark">
          <!-- Endereço -->
          <div class="flex items-start gap-3">
            <div class="text-secondary shrink-0 mt-0.5">
              <Icon icon="mdi:map-marker-outline" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-neutral-dark">Endereço</h3>
              <p class="text-xs sm:text-sm text-neutral-dark/85 mt-0.5">
                Rua General Neto, 317 – Centro, Cruzeiro do Sul – RS, 95930–000
              </p>
            </div>
          </div>

          <!-- Horário de funcionamento -->
          <div class="flex items-start gap-3">
            <div class="text-secondary shrink-0 mt-0.5">
              <Icon icon="mdi:clock-outline" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-neutral-dark">
                Horário de funcionamento
              </h3>
              <div class="text-xs sm:text-sm text-neutral-dark/85 mt-0.5 space-y-0.5">
                <p>Segunda à sexta–feira: 08:00 – 12:00 | 13:30 – 18:00</p>
                <p>Sábado: 08:00 – 12:00</p>
              </div>
            </div>
          </div>

          <!-- Contato -->
          <div class="flex items-start gap-3">
            <div class="text-secondary shrink-0 mt-0.5">
              <Icon icon="mdi:whatsapp" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-sm sm:text-base text-neutral-dark">Contato</h3>
              <p class="text-xs sm:text-sm text-neutral-dark/85 mt-0.5">
                <a
                  href="https://wa.me/5551998981063"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-secondary transition-colors"
                >
                  (51) 99898–1063
                </a>
              </p>
            </div>
          </div>
        </div>

        <!-- Google Maps Iframe Interativo -->
        <div class="w-full rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative aspect-[16/10] sm:aspect-[21/9]">
          <iframe
            title="Localização da Empório Henz"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3472.6393529342417!2d-51.9897184!3d-29.5168233!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951c6204c34a9bbf%3A0xe54955b253b3b2c!2sR.%20Gen.%20Neto%2C%20317%20-%20Centro%2C%20Cruzeiro%20do%20Sul%20-%20RS%2C%2095930-000!5e0!3m2!1spt-BR!2sbr!4v1710000000000!5m2!1spt-BR!2sbr"
            class="w-full h-full border-0"
            allowfullscreen="false"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>
    </div>
  </div>
</template>
