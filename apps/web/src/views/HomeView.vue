<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import UiButton from "@/components/UiButton.vue";
import UiCard from "@/components/UiCard.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.checkBackendHealth();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <section class="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 md:p-12 text-white shadow-xl">
      <div class="max-w-3xl space-y-4">
        <span class="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 border border-amber-500/30">
          Vue 3 + Vite + Bun
        </span>
        <h1 class="text-3xl md:text-5xl font-serif font-bold tracking-tight text-stone-100">
          Empório Henz
        </h1>
        <p class="text-stone-300 text-base md:text-lg leading-relaxed">
          Catálogo digital de móveis de alto padrão. Arquitetura moderna com frontend Vue 3 desacoplado e backend veloz em Bun.
        </p>
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <UiButton variant="primary" @click="appStore.checkBackendHealth">
            Testar Conexão Backend
          </UiButton>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center rounded-lg border border-stone-600 bg-stone-800/80 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors"
          >
            Abrir API Bun (Porta 3001) ↗
          </a>
        </div>
      </div>
    </section>

    <!-- Status do Backend Bun -->
    <section>
      <UiCard
        title="Status da Integração Bun API"
        :badge="appStore.backendStatus.online ? 'Online' : 'Offline'"
      >
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'h-3 w-3 rounded-full',
                appStore.backendStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
              ]"
            />
            <span class="font-medium text-stone-800">
              {{ appStore.backendStatus.online ? "Conectado ao Backend Bun" : "Desconectado do Backend Bun" }}
            </span>
          </div>

          <div v-if="appStore.backendStatus.timestamp" class="text-stone-600 text-xs font-mono">
            Último ping: {{ appStore.backendStatus.timestamp }} (uptime: {{ appStore.backendStatus.uptime?.toFixed(1) }}s)
          </div>

          <div v-if="appStore.backendStatus.error" class="text-rose-600 text-xs">
            Aviso: {{ appStore.backendStatus.error }}. Inicie o backend com <code class="font-mono bg-stone-100 px-1 py-0.5 rounded">bun --filter backend dev</code>.
          </div>
        </div>
      </UiCard>
    </section>

    <!-- Recursos e Pilares -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UiCard
        title="Vue 3 + Vite"
        badge="Frontend"
        description="Single Page Application com Vue Router, Pinia, Single-File Components e compilação ultra rápida com Vite."
      />
      <UiCard
        title="Tailwind CSS v4"
        badge="Estilo"
        description="Nova geração do Tailwind CSS integrada diretamente via @tailwindcss/vite com zero configuração."
      />
      <UiCard
        title="Bun.serve Nativo"
        badge="Backend"
        description="API ultrarrápida nativa em Bun rodando na porta 3001 com suporte CORS e tipagem TypeScript."
      />
    </section>
  </div>
</template>
