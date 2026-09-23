<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";

const authStore = useAuthStore();

const userFirstName = computed(() => {
  return authStore.user?.name ? authStore.user.name.split(" ")[0] : "Colaborador";
});

const roleBadgeLabel = computed(() => {
  if (authStore.isAdmin) return "Administrador";
  if (authStore.isVendedor) return "Vendedor";
  return "Colaborador";
});

const stats = [
  {
    label: "Orçamentos Abertos",
    value: "12",
    icon: "mdi:clipboard-text-clock-outline",
    change: "+3 hoje",
  },
  {
    label: "Produtos no Catálogo",
    value: "148",
    icon: "mdi:sofa-outline",
    change: "Ativos",
  },
  {
    label: "Atendimentos Ativos",
    value: "5",
    icon: "mdi:account-group-outline",
    change: "Em andamento",
  },
];

const quickActions = [
  {
    title: "Gestão do Catálogo",
    description: "Visualizar, cadastrar e atualizar móveis e decorações no acervo.",
    icon: "mdi:package-variant-closed",
    badge: "Módulo Catálogo",
  },
  {
    title: "Orçamentos & Clientes",
    description: "Acompanhar solicitações enviadas através da vitrine virtual.",
    icon: "mdi:file-document-edit-outline",
    badge: "Atendimento",
  },
  {
    title: "Configurações da Empresa",
    description: "Dados cadastrais da loja física, filiais e parâmetros de contato.",
    icon: "mdi:cog-outline",
    badge: "Administração",
  },
];
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 pb-16">
    <!-- Cabeçalho Nobre Institucional -->
    <section class="bg-primary-dark text-white border-b border-sky-950 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              :class="
                authStore.isAdmin
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-sky-400/20 text-sky-200 border border-sky-400/30'
              "
            >
              <Icon
                :icon="authStore.isAdmin ? 'mdi:shield-crown' : 'mdi:badge-account-outline'"
                class="w-4 h-4"
              />
              {{ roleBadgeLabel }}
            </span>
            <span class="text-xs text-stone-400">Portal Interno</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Olá, {{ userFirstName }}! Bem-vindo ao Painel de Controle
          </h1>
          <p class="text-sm text-stone-300 mt-1 max-w-2xl">
            Acompanhe a operação comercial, orçamentos e a curadoria de produtos exclusivos do Empório Henz.
          </p>
        </div>

        <!-- Ação de Retorno à Vitrine -->
        <div class="flex items-center gap-3 shrink-0">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 transition-all cursor-pointer backdrop-blur-xs shadow-sm"
          >
            <Icon icon="mdi:storefront-outline" class="w-4 h-4" />
            <span>Voltar para a Loja</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Conteúdo Principal -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
      <!-- Cards de Métricas Rápidas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex items-center justify-between"
        >
          <div>
            <p class="text-xs font-medium text-stone-500 uppercase tracking-wider">
              {{ stat.label }}
            </p>
            <p class="text-2xl font-bold text-stone-900 mt-1">
              {{ stat.value }}
            </p>
            <span class="text-[11px] text-emerald-700 font-medium">
              {{ stat.change }}
            </span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-sky-50 text-secondary flex items-center justify-center">
            <Icon :icon="stat.icon" class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Seção de Ações Rápidas -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-bold text-stone-900">
              Módulos Administrativos
            </h2>
            <p class="text-xs text-stone-500 mt-0.5">
              Acesso às áreas de gestão da loja e operação de vendas
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            v-for="action in quickActions"
            :key="action.title"
            class="group p-5 rounded-xl border border-stone-200 hover:border-secondary/50 hover:shadow-md transition-all duration-200 bg-stone-50/50 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary-dark group-hover:bg-secondary group-hover:text-white transition-colors flex items-center justify-center">
                  <Icon :icon="action.icon" class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-semibold text-stone-500 uppercase tracking-wider bg-stone-200/60 px-2 py-0.5 rounded">
                  {{ action.badge }}
                </span>
              </div>
              <h3 class="font-bold text-stone-900 text-sm mb-1 group-hover:text-secondary transition-colors">
                {{ action.title }}
              </h3>
              <p class="text-xs text-stone-600 leading-relaxed">
                {{ action.description }}
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-secondary">
              <span>Em desenvolvimento</span>
              <Icon icon="mdi:arrow-right" class="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
