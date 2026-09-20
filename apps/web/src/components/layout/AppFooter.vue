<script setup lang="ts">
import UiFloatingActions from "@/components/UiFloatingActions.vue";
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
            src="/images/logo-vertical.svg"
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
          to="/"
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
          <a
            href="https://wa.me/5551998765432"
            target="_blank"
            rel="noopener noreferrer"
            class="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-115 cursor-pointer"
            aria-label="WhatsApp"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"
              />
            </svg>
          </a>
          <!-- Instagram -->
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            class="w-7 h-7 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-115 cursor-pointer"
            aria-label="Instagram"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
              />
            </svg>
          </a>

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
