<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import UiButton from "@/components/UiButton.vue";
import UiCard from "@/components/UiCard.vue";

const appStore = useAppStore();

onMounted(() => {
  appStore.checkBackendHealth();
  appStore.carregarProdutos();
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
          <UiButton variant="outline" class="!text-stone-100 !border-stone-500 !bg-stone-800/60 hover:!bg-stone-700" @click="appStore.carregarProdutos">
            Recarregar Produtos
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
        title="Status da Integração Bun API (via @/api/sistema)"
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
            Aviso: {{ appStore.backendStatus.error }}. Inicie o backend com <code class="font-mono bg-stone-100 px-1 py-0.5 rounded">bun dev</code>.
          </div>
        </div>
      </UiCard>
    </section>

    <!-- Catálogo de Produtos da API (@/api/produtos) -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-stone-900">Catálogo em Destaque</h2>
          <p class="text-sm text-stone-500">Dados obtidos dinamicamente via <code class="bg-stone-200 px-1 py-0.5 rounded font-mono text-xs">produtosApi.listar()</code> instanciados na classe <code class="bg-stone-200 px-1 py-0.5 rounded font-mono text-xs">Product</code></p>
        </div>
        <span class="text-xs font-medium text-stone-500">
          {{ appStore.produtos.length }} produto(s) carregado(s)
        </span>
      </div>

      <div v-if="appStore.produtosLoading" class="py-12 text-center text-stone-500 text-sm">
        Carregando catálogo da API...
      </div>

      <div v-else-if="appStore.produtosError" class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {{ appStore.produtosError }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="prod in appStore.produtos"
          :key="prod.id"
          class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:border-amber-700/50 hover:shadow-md transition-all"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                {{ prod.category }}
              </span>
              <span class="text-xs font-mono text-stone-400">
                {{ prod.formattedDimensions }}
              </span>
            </div>

            <h3 class="text-lg font-semibold text-stone-900 pt-1">
              {{ prod.name }}
            </h3>

            <p class="text-xs text-stone-600 leading-relaxed">
              {{ prod.description }}
            </p>

            <p class="text-xs text-stone-500">
              <strong class="font-medium text-stone-700">Material:</strong> {{ prod.material }}
            </p>
          </div>

          <div class="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span class="text-base font-bold text-amber-900">
              {{ prod.formattedPrice }}
            </span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                prod.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500'
              ]"
            >
              {{ prod.isAvailable ? 'Disponível' : 'Sob Encomenda' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Recursos da Arquitetura -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-200">
      <UiCard
        title="@/plugins"
        badge="Plugins"
        description="Centralização da instância do Axios e Pinia com registro automático no app Vue via registerPlugins."
      />
      <UiCard
        title="@/types"
        badge="Tipagem & Domínio"
        description="Interfaces IProduct, ApiResponse e classes de domínio completas com métodos de formatação e regras de negócio."
      />
      <UiCard
        title="@/api"
        badge="Serviços de Rotas"
        description="Serviços modulares (produtos.ts, sistema.ts) com padrão listar, buscarPorId, insert, atualizar e deletar."
      />
    </section>
  </div>
</template>
