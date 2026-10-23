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

// Seções do painel: agrupam os módulos pelo tipo de tarefa
type SectionId = "catalog" | "people" | "store";

interface AdminSection {
  id: SectionId;
  title: string;
  description: string;
}

const sections: AdminSection[] = [
  {
    id: "catalog",
    title: "Catálogo",
    description: "O que a loja vende e como está organizado.",
  },
  {
    id: "people",
    title: "Parceiros e equipe",
    description: "Quem fornece, quem vende e quem tem acesso ao painel.",
  },
  {
    id: "store",
    title: "Loja",
    description: "Como os clientes enxergam o catálogo.",
  },
];

// Definição dos Módulos Administrativos
interface AdminModule {
  id: string;
  section: SectionId;
  title: string;
  description: string;
  actionLabel: string;
  icon: string;
  iconClass: string;
  to: string;
  external?: boolean;
  adminOnly?: boolean;
}

const allModules: AdminModule[] = [
  {
    id: "products",
    section: "catalog",
    title: "Produtos",
    description: "Móveis com variações de acabamento, fotos e ficha técnica.",
    actionLabel: "Gerenciar produtos",
    icon: "mdi-table-furniture",
    iconClass: "bg-wood-honey/20 text-wood-dark",
    to: "/admin/produtos",
    adminOnly: false,
  },
  {
    id: "categories",
    section: "catalog",
    title: "Categorias",
    description: "Ambientes da loja (Sala, Quarto…) e seus subtipos.",
    actionLabel: "Gerenciar categorias",
    icon: "mdi-sofa",
    iconClass: "bg-wood-cherry/15 text-wood-dark",
    to: "/admin/categorias",
    adminOnly: true,
  },
  {
    id: "suppliers",
    section: "people",
    title: "Fornecedores",
    description: "Fábricas e marcas parceiras que abastecem o catálogo.",
    actionLabel: "Gerenciar fornecedores",
    icon: "mdi-domain",
    iconClass: "bg-primary/10 text-primary",
    to: "/admin/fornecedores",
    adminOnly: true,
  },
  {
    id: "users",
    section: "people",
    title: "Usuários",
    description: "Contas de clientes, vendedores e administradores.",
    actionLabel: "Gerenciar usuários",
    icon: "mdi-account-group",
    iconClass: "bg-secondary/10 text-secondary",
    to: "/admin/usuarios",
    adminOnly: true,
  },
  {
    id: "user-suppliers",
    section: "people",
    title: "Vínculos de vendedores",
    description:
      "Defina, no cadastro de cada vendedor, quais marcas ele pode ver e vender.",
    actionLabel: "Escolher vendedor",
    icon: "mdi-handshake",
    iconClass: "bg-primary-dark/10 text-primary-dark",
    to: "/admin/usuarios",
    adminOnly: true,
  },
  {
    id: "catalog",
    section: "store",
    title: "Vitrine pública",
    description: "O catálogo exatamente como os clientes veem no site.",
    actionLabel: "Abrir vitrine",
    icon: "mdi-storefront",
    iconClass: "bg-surface-tint/60 text-primary",
    to: "/catalogo",
    external: true,
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

const visibleSections = computed(() => {
  return sections
    .map((section) => ({
      ...section,
      modules: availableModules.value.filter((m) => m.section === section.id),
    }))
    .filter((section) => section.modules.length > 0);
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
    <div class="max-w-6xl mx-auto space-y-10">
      <!-- Módulos agrupados por seção -->
      <section
        v-for="section in visibleSections"
        :key="section.id"
        :aria-labelledby="`section-${section.id}`"
        class="space-y-4"
      >
        <div class="border-b border-stone-200 pb-2">
          <h2
            :id="`section-${section.id}`"
            class="text-lg font-semibold text-neutral-dark"
          >
            {{ section.title }}
          </h2>
          <p class="text-sm text-stone-500">{{ section.description }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- O card inteiro é clicável: o botão principal se estende sobre ele -->
          <article
            v-for="mod in section.modules"
            :key="mod.id"
            class="group relative flex flex-col rounded-2xl border border-stone-200/90 bg-white p-5 transition-all hover:border-secondary/60 hover:shadow-sm focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                :class="mod.iconClass"
              >
                <Icon :icon="mod.icon" class="w-6 h-6" />
              </div>
              <h3
                class="text-base font-semibold text-neutral-dark leading-snug group-hover:text-primary transition-colors"
              >
                {{ mod.title }}
              </h3>
            </div>

            <p class="mt-3 flex-1 text-sm text-stone-500 leading-relaxed">
              {{ mod.description }}
            </p>

            <UiButton
              variant="custom"
              size="none"
              class="mt-4 self-start inline-flex items-center gap-1.5 text-sm font-semibold text-secondary group-hover:text-secondary-hover after:absolute after:inset-0 after:rounded-2xl after:content-['']"
              @click="handleNavigate(mod.to, mod.title)"
            >
              <span>{{ mod.actionLabel }}</span>
              <Icon
                :icon="
                  mod.external ? 'mdi:open-in-new' : 'solar:arrow-right-linear'
                "
                class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              />
            </UiButton>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
