<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { RouterLink } from "vue-router";

const adminModules = [
  {
    title: "Fornecedores",
    description:
      "Cadastre e gerencie marcas parceiras, fábricas e fabricantes de móveis e decorações.",
    icon: "mdi:domain",
    to: "/admin/fornecedores",
    newTo: "/admin/fornecedores/novo",
    newLabel: "Novo Fornecedor",
  },
  {
    title: "Usuários & Clientes",
    description:
      "Controle de contas, permissões de acesso, clientes e equipe de vendas ou administração.",
    icon: "mdi:account-group-outline",
    to: "/admin/usuarios",
    newTo: "/admin/usuarios/novo",
    newLabel: "Novo Usuário",
  },
];
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto">
      <!-- Cabeçalho Limpo -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Painel Administrativo
        </h1>
        <p class="text-sm text-stone-500 mt-1">
          Selecione uma área para gerenciar os dados operacionais da loja.
        </p>
      </div>

      <!-- Módulos Administrativos Clean -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          v-for="module in adminModules"
          :key="module.to"
          class="bg-white rounded-xl border border-stone-200 p-6 flex flex-col justify-between hover:border-secondary/60 hover:shadow-xs transition-all"
        >
          <div>
            <div class="flex items-center gap-3.5 mb-3">
              <div
                class="w-10 h-10 rounded-lg bg-stone-100 text-primary flex items-center justify-center shrink-0"
              >
                <Icon :icon="module.icon" class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-semibold text-neutral-dark">
                {{ module.title }}
              </h2>
            </div>

            <p class="text-sm text-stone-500 leading-relaxed">
              {{ module.description }}
            </p>
          </div>

          <div class="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm">
            <RouterLink
              :to="module.to"
              class="font-medium text-secondary hover:text-secondary-hover inline-flex items-center gap-1 transition-colors"
            >
              <span>Gerenciar listagem</span>
              <Icon icon="mdi:arrow-right" class="w-4 h-4" />
            </RouterLink>

            <RouterLink
              :to="module.newTo"
              class="text-stone-500 hover:text-neutral-dark font-medium inline-flex items-center gap-1 transition-colors"
            >
              <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
              <span>{{ module.newLabel }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
