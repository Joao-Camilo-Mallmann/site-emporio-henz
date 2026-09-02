<script setup lang="ts">
import { RouterView, RouterLink } from "vue-router";
</script>

<template>
  <div class="min-h-screen flex flex-col bg-stone-50 text-stone-900">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-8 h-8 rounded-lg bg-amber-800 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            H
          </div>
          <span class="text-xl font-serif font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">
            Empório Henz
          </span>
        </RouterLink>

        <nav class="flex items-center gap-6 text-sm font-medium text-stone-600">
          <RouterLink
            to="/"
            class="hover:text-amber-800 transition-colors"
            active-class="text-amber-800 font-semibold"
          >
            Início
          </RouterLink>
          <a
            href="http://localhost:3001/health"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-amber-800 transition-colors"
          >
            API Health ↗
          </a>
        </nav>
      </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
      <p>© {{ new Date().getFullYear() }} Empório Henz — Todos os direitos reservados.</p>
    </footer>
  </div>
</template>
