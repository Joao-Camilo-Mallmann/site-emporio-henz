<script setup lang="ts">
import UiFloatingActions from "@/components/UiFloatingActions.vue";
import UiFloatingButton from "@/components/UiFloatingButton.vue";
</script>

<template>
  <footer
    class="bg-primary text-white py-10 px-4 sm:px-6 lg:px-8 border-t border-sky-950"
  >
    <div
      class="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-center justify-center gap-8 md:gap-12"
    >
      <!-- Coluna 1: Logo Vertical e Divisor -->
      <div class="flex items-center gap-10 md:gap-12 shrink-0">
        <div class="flex flex-col items-center">
          <img
            src="/images/logos/logo-vertical.svg"
            alt="Empório Henz"
            class="h-28 w-auto object-contain filter brightness-0 invert"
          />
        </div>
        <!-- Linha vertical divisória (Figma node #I56:2164;3106:1817) -->
        <div class="hidden md:block w-[1px] h-36 bg-white/30"></div>
      </div>

      <!-- Coluna 2: Categorias e Setas de Navegação -->
      <div class="flex flex-col items-start gap-4">
        <h3 class="text-sm font-bold text-white tracking-wide">Categorias</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-white">
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Quarto
          </RouterLink>
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Cozinha
          </RouterLink>
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Sala de Estar
          </RouterLink>
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Escritório
          </RouterLink>
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Sala de Jantar
          </RouterLink>
          <RouterLink
            to="/"
            class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
          >
            Banheiro
          </RouterLink>
        </div>
      </div>

      <!-- Coluna 3: Empório Henz, Sobre, Endereço e Redes Sociais -->
      <div
        class="flex flex-col items-start gap-2.5 max-w-xs text-xs text-white"
      >
        <h3 class="text-sm font-bold text-white tracking-wide">Empório Henz</h3>
        <RouterLink
          to="/sobre-a-loja"
          class="hover:text-sky-300 opacity-90 hover:opacity-100 transition-all duration-150 cursor-pointer"
        >
          Sobre a loja
        </RouterLink>
        <p class="opacity-90 leading-relaxed">
          Rua General Neto, 317 – Centro,<br />
          Cruzeiro do Sul – RS, 95930–000
        </p>

        <!-- Ícones Sociais (WhatsApp e Instagram circulares azuis com hover suave) -->
        <div class="flex items-center gap-3 pt-2">
          <!-- WhatsApp -->
          <UiFloatingButton
            href="https://wa.me/5551998981063"
            target="_blank"
            size="sm"
            variant="primary"
            icon="mdi:whatsapp"
            aria-label="WhatsApp"
            title="WhatsApp"
          />

          <!-- Instagram -->
          <UiFloatingButton
            href="https://www.instagram.com/emporiohenz/"
            target="_blank"
            size="sm"
            variant="primary"
            icon="mdi:instagram"
            aria-label="Instagram"
            title="Instagram"
          />

          <!-- Atalho sutil para portal da equipe -->
          <RouterLink
            to="/equipe/login"
            class="ml-2 text-white/40 hover:text-white transition-colors"
            title="Acesso da Equipe"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </RouterLink>
        </div>
      </div>
    </div>
  </footer>

  <!-- Componente Flutuante Genérico (Botão Voltar ao Topo + Botão do Zap com @iconify/vue) -->
  <UiFloatingActions />
</template>
