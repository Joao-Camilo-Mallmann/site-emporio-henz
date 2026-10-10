<script setup lang="ts">
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import { UserRole } from "@/types";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const isUserAdmin = computed(() => {
  return authStore.user?.role === UserRole.Administrador;
});

// Definição dos Módulos Administrativos com Ícones Sofisticados
interface AdminModule {
  id: string;
  title: string;
  group: string;
  description: string;
  icon: string;
  iconClass: string;
  to: string;
  newTo?: string;
  newLabel?: string;
  adminOnly?: boolean;
}

const allModules: AdminModule[] = [
  {
    id: "suppliers",
    title: "Fornecedores & Marcas",
    group: "Parceiros & Fábricas",
    description:
      "Cadastre e gerencie fabricantes parceiros de móveis nobres e alta decoração.",
    icon: "mdi-domain",
    iconClass:
      "bg-primary/10 text-primary border border-primary/15 group-hover:bg-primary group-hover:text-white",
    to: "/admin/fornecedores",
    newTo: "/admin/fornecedores/novo",
    newLabel: "Novo Fornecedor",
    adminOnly: true,
  },
  {
    id: "users",
    title: "Usuários & Equipe",
    group: "Acessos & Clientes",
    description:
      "Controle de contas, permissões de acesso, clientes e vendedores da loja.",
    icon: "mdi-account-group",
    iconClass:
      "bg-secondary/10 text-secondary border border-secondary/15 group-hover:bg-secondary group-hover:text-white",
    to: "/admin/usuarios",
    newTo: "/admin/usuarios/novo",
    newLabel: "Novo Usuário",
    adminOnly: true,
  },
  {
    id: "categories",
    title: "Categorias & Subtipos",
    group: "Estrutura do Acervo",
    description:
      "Organize os ambientes da loja (Sala, Quarto, etc.) e seus subtipos vinculados.",
    icon: "mdi-sofa",
    iconClass:
      "bg-amber-900/10 text-wood-dark border border-amber-900/15 group-hover:bg-wood-dark group-hover:text-white",
    to: "/admin/categorias",
    newTo: "/admin/categorias/nova",
    newLabel: "Nova Categoria",
    adminOnly: true,
  },
  {
    id: "user-suppliers",
    title: "Vínculos de Vendedores",
    group: "Governança Multi-empresa",
    description:
      "Associe marcas e fabricantes autorizados aos vendedores para isolamento do catálogo.",
    icon: "mdi-handshake",
    iconClass:
      "bg-primary-dark/10 text-primary-dark border border-primary-dark/15 group-hover:bg-primary-dark group-hover:text-white",
    to: "/admin/usuarios",
    adminOnly: true,
  },
  {
    id: "catalog",
    title: "Catálogo & Vitrine Digital",
    group: "Experiência de Venda",
    description:
      "Consulte o mostruário público exatamente como seus clientes o visualizam no portal.",
    icon: "mdi-storefront",
    iconClass:
      "bg-surface-tint text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white",
    to: "/catalogo",
    adminOnly: false,
  },
];

const availableModules = computed(() => {
  return allModules.filter((module) => {
    if (module.adminOnly && !isUserAdmin.value) {
      return false;
    }
    return true;
  });
});

// Acesso seguro ou feedback para rotas em desenvolvimento
function handleNavigate(to: string, label: string) {
  try {
    const resolved = router.resolve(to);
    if (
      resolved.matched.length > 0 &&
      resolved.name !== "not-found" &&
      resolved.matched[0].name !== "not-found"
    ) {
      router.push(to);
      return;
    }
  } catch {
    // Fallback silencioso
  }

  toast.info(
    `O módulo de ${label} está em desenvolvimento pela equipe e estará disponível em breve.`,
  );
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Grid Unificado de Módulos Operacionais -->
      <section aria-label="Módulos operacionais">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="mod in availableModules"
            :key="mod.id"
            class="bg-white rounded-2xl border border-stone-200/90 p-6 flex flex-col justify-between hover:border-secondary/60 hover:shadow-xs transition-all group"
          >
            <div>
              <!-- Cabeçalho do Card: Tag de Grupo -->
              <div class="flex items-center justify-between gap-2 mb-3">
                <span
                  class="text-[11px] font-semibold text-stone-500 uppercase tracking-wider"
                >
                  {{ mod.group }}
                </span>
              </div>

              <!-- Título e Ícone Destacado -->
              <div class="flex items-start gap-4 mb-3">
                <div
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:shadow-xs transition-all duration-300"
                  :class="mod.iconClass"
                >
                  <Icon :icon="mod.icon" class="w-6 h-6" />
                </div>
                <div>
                  <h2
                    class="text-base font-semibold text-neutral-dark leading-snug group-hover:text-primary transition-colors"
                  >
                    {{ mod.title }}
                  </h2>
                  <p class="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {{ mod.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Rodapé de Ações do Card -->
            <div
              class="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between gap-3 text-xs"
            >
              <UiButton
                variant="link"
                size="none"
                class="inline-flex items-center gap-1.5 font-medium text-xs sm:text-sm text-secondary hover:text-secondary-hover"
                @click="handleNavigate(mod.to, mod.title)"
              >
                <span>Acessar</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                />
              </UiButton>

              <UiButton
                v-if="mod.newTo"
                variant="ghost"
                size="sm"
                class="text-stone-600 hover:text-neutral-dark font-medium text-xs gap-1.5 px-3 h-8"
                @click="handleNavigate(mod.newTo, mod.title)"
              >
                <Icon
                  icon="solar:add-circle-linear"
                  class="w-4 h-4 text-secondary"
                />
                <span>{{ mod.newLabel }}</span>
              </UiButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
