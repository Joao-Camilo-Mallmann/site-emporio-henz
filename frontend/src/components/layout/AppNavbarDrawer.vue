<script setup lang="ts">
import { useCategoriasStore } from "@/stores/categorias";
import { useAuthStore } from "@/stores/auth";
import { useListasStore } from "@/stores/listas";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  open: boolean;
  accountPath: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "logout"): void;
}>();

const router = useRouter();
const categoriasStore = useCategoriasStore();
const authStore = useAuthStore();
const listasStore = useListasStore();
const activeAccordion = ref<string | null>(null);

const drawerAccountPath = computed(() =>
  authStore.isAuthenticated ? props.accountPath : "/login",
);

function close() {
  emit("close");
}

function toggleAccordion(slug: string) {
  activeAccordion.value = activeAccordion.value === slug ? null : slug;
}

function navigateTo(path: string) {
  close();
  router.push(path);
}

function openSavedLists() {
  close();
  listasStore.openManageModal();
}

watch(
  () => props.open,
  (open) => {
    if (!open) activeAccordion.value = null;
  },
);

// O drawer existe também nas rotas do admin, onde a barra de categorias não é montada
onMounted(() => {
  void categoriasStore.carregar();
});
</script>

<template>
  <!-- Drawer Lateral Mobile Oficial (munu-mobile.png) -->
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex">
      <!-- Backdrop Escurecido -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        appear
      >
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-xs"
          @click="close"
        ></div>
      </Transition>

      <!-- Painel Deslizante Lateral -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
        appear
      >
        <div
          class="relative w-[82%] max-w-xs sm:max-w-sm h-full flex flex-col shadow-2xl z-10 select-none overflow-hidden"
        >
          <!-- Cabeçalho do Drawer em bg-primary com a logo branca e botão fechar -->
          <div
            class="bg-primary px-5 py-5 flex items-center justify-between border-b border-primary-dark shrink-0"
          >
            <RouterLink to="/" @click="close" class="flex items-center">
              <img
                src="/images/logos/logo-horizontal.svg"
                alt="Empório Henz"
                class="h-8 w-auto object-contain filter brightness-0 invert"
              />
            </RouterLink>
            <button
              type="button"
              @click="close"
              class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <Icon icon="mdi:close" class="w-5 h-5"></Icon>
            </button>
          </div>

          <!-- Corpo do Drawer em bg-secondary com Categorias e Ações -->
          <div
            class="bg-secondary flex-1 overflow-y-auto px-5 py-4 space-y-1 text-white text-sm"
          >
            <!-- Lista de Categorias da API com Acordeão (sem limite de itens) -->
            <div v-for="cat in categoriasStore.lista" :key="cat.id">
              <button
                type="button"
                @click="toggleAccordion(cat.slug)"
                class="w-full flex items-center justify-between py-3.5 text-left font-bold text-white hover:text-white/90 text-base transition-colors cursor-pointer"
                :aria-expanded="activeAccordion === cat.slug"
              >
                <span>{{ cat.name }}</span>
                <Icon
                  :icon="
                    activeAccordion === cat.slug
                      ? 'mdi:chevron-up'
                      : 'mdi:chevron-down'
                  "
                  class="w-5 h-5 text-white transition-transform duration-200"
                />
              </button>

              <!-- Subcategorias do Acordeão -->
              <div
                v-if="activeAccordion === cat.slug"
                class="pb-3 pl-3 space-y-1 animate-in fade-in duration-200"
              >
                <RouterLink
                  :to="{ path: '/catalogo', query: { categoria: cat.slug } }"
                  @click="close"
                  class="block py-1.5 px-2.5 text-xs font-semibold text-sky-200 hover:text-white hover:bg-white/15 rounded-md transition-colors"
                >
                  Ver todos em {{ cat.name }} →
                </RouterLink>
                <RouterLink
                  v-for="sub in cat.subtypes"
                  :key="sub.id"
                  :to="{ path: '/catalogo', query: { categoria: cat.slug, subcategoria: sub.name } }"
                  @click="close"
                  class="block py-1.5 px-2.5 text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md transition-colors"
                >
                  {{ sub.name }}
                </RouterLink>
              </div>
            </div>

            <!-- Divisor Sutil -->
            <div class="border-t border-white/25 my-4 pt-3 space-y-2">
              <!-- Salvos -->
              <UiButton
                variant="custom"
                size="none"
                block
                @click="openSavedLists"
                class="w-full flex items-center justify-start gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Icon
                  icon="mdi:heart-outline"
                  class="w-5 h-5 text-white shrink-0"
                />
                <span>Salvos</span>
                <span
                  v-if="listasStore.totalSavedCount > 0"
                  class="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
                >
                  {{ listasStore.totalSavedCount }}
                </span>
              </UiButton>

              <!-- Sobre a loja -->
              <RouterLink
                to="/sobre-a-loja"
                @click="close"
                class="flex items-center gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <svg
                  class="w-5 h-5 text-white shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 9l1.5-5h15l1.5 5"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 9.5V19a1 1 0 001 1h14a1 1 0 001-1V9.5"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 20v-5a1 1 0 011-1h4a1 1 0 011 1v5"
                  />
                </svg>
                <span>Sobre a loja</span>
              </RouterLink>

              <!-- Painel Admin Mobile (Exclusivo para Equipe) -->
              <UiButton
                v-if="authStore.isEquipe"
                variant="custom"
                size="none"
                block
                @click="navigateTo('/admin')"
                class="w-full flex items-center justify-start gap-3.5 py-2.5 px-1 font-semibold text-white hover:text-amber-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer group text-left"
              >
                <Icon
                  icon="mdi:shield-account"
                  class="w-5 h-5 text-white shrink-0 transition-colors group-hover:text-amber-200"
                />
                <span>Painel Admin</span>
              </UiButton>

              <!-- Minha conta / Editar Usuário / Meu Perfil -->
              <UiButton
                variant="custom"
                size="none"
                block
                @click="navigateTo(drawerAccountPath)"
                class="w-full flex items-center justify-start gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Icon
                  :icon="
                    authStore.isAdmin
                      ? 'mdi:account-edit-outline'
                      : 'mdi:account-circle-outline'
                  "
                  class="w-5 h-5 text-white shrink-0"
                />
                <span v-if="authStore.isAuthenticated && authStore.user">
                  {{ authStore.isAdmin ? "Editar Usuário" : "Meu Perfil" }}
                  ({{ authStore.user.name.split(" ")[0] }})
                </span>
                <span v-else>Minha conta</span>
              </UiButton>

              <!-- Sair / Entrar -->
              <button
                v-if="authStore.isAuthenticated"
                type="button"
                @click="emit('logout')"
                class="w-full flex items-center gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Icon icon="mdi:logout" class="w-5 h-5 text-white shrink-0" />
                <span>Sair</span>
              </button>

              <RouterLink
                v-else
                to="/login"
                @click="close"
                class="flex items-center gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Icon icon="mdi:login" class="w-5 h-5 text-white shrink-0" />
                <span>Entrar</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
