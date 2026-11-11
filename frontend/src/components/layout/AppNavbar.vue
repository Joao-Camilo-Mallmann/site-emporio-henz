<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useListasStore } from "@/stores/listas";
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const listasStore = useListasStore();

const searchQuery = ref("");
const isDrawerOpen = ref(false);

const accountPath = computed(() =>
  authStore.isAdmin ? `/admin/usuarios/${authStore.user?.id}/editar` : "/perfil",
);

function navigateTo(path: string) {
  closeDrawer();
  router.push(path);
}

function openDrawer() {
  isDrawerOpen.value = true;
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  isDrawerOpen.value = false;
  document.body.style.overflow = "";
}

const isLoggingOut = ref(false);
const showLogoutToast = ref(false);
const loggedOutUserName = ref("");
let logoutToastTimer: ReturnType<typeof setTimeout> | null = null;

function triggerLogoutToast(name: string) {
  if (logoutToastTimer) {
    clearTimeout(logoutToastTimer);
    logoutToastTimer = null;
  }
  loggedOutUserName.value = name;
  showLogoutToast.value = true;

  logoutToastTimer = setTimeout(() => {
    closeLogoutToast();
  }, 3500);
}

function closeLogoutToast() {
  if (logoutToastTimer) {
    clearTimeout(logoutToastTimer);
    logoutToastTimer = null;
  }
  showLogoutToast.value = false;
}

// Usado pelo menu do usuário (desktop) e pelo drawer (mobile)
async function handleLogout() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  const firstName = authStore.user?.name?.split(" ")[0] || "Usuário";

  // Pequeno delay para feedback visual claro no botão ("Desconectando...")
  await new Promise((resolve) => setTimeout(resolve, 450));

  authStore.logout();
  closeDrawer();
  isLoggingOut.value = false;

  triggerLogoutToast(firstName);
  router.push("/");
}

function handleSearch() {
  if (!searchQuery.value.trim()) {
    router.push("/catalogo");
    return;
  }
  router.push({ path: "/catalogo", query: { name: searchQuery.value.trim() } });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isDrawerOpen.value) {
    closeDrawer();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (logoutToastTimer) clearTimeout(logoutToastTimer);
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <header class="sticky top-0 z-40 w-full shadow-md">
    <!-- Cabeçalho Principal (bg-primary #123854) -->
    <div class="bg-primary text-white">
      <!-- 1. Linha Superior Desktop (hidden md:flex) -->
      <div
        class="hidden md:flex mx-auto px-4 sm:px-6 lg:px-8 h-20 items-center justify-between gap-4 max-w-7xl"
      >
        <!-- Logo Horizontal Desktop -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 shrink-0 group transition-opacity hover:opacity-95"
        >
          <img
            src="/images/logos/logo-horizontal.svg"
            alt="Empório Henz"
            class="h-8 md:h-9 w-auto object-contain filter brightness-0 invert transition-all duration-300 hover:scale-105"
            onerror="
              this.style.display = 'none';
              this.nextElementSibling.style.display = 'flex';
            "
          />
          <div class="hidden items-center gap-2">
            <span
              class="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-serif font-bold text-lg"
            >
              H
            </span>
            <span
              class="text-xl font-serif font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors"
            >
              Empório Henz
            </span>
          </div>
        </RouterLink>

        <!-- Campo de Busca Central Desktop -->
        <div class="flex flex-1 max-w-xl mx-4">
          <form @submit.prevent="handleSearch" class="relative w-full group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Busque por móveis para sua casa"
              class="w-full bg-white text-stone-900 placeholder:text-stone-400 text-sm rounded-lg pl-4 pr-11 py-2.5 border border-transparent hover:border-sky-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all shadow-sm"
            />
            <UiButton
              type="submit"
              variant="custom"
              size="none"
              class="absolute right-0 top-0 h-full px-3.5 text-stone-400 hover:text-secondary hover:scale-110"
              aria-label="Buscar"
            >
              <Icon
                icon="mdi:magnify"
                class="w-5 h-5 transition-transform duration-200"
              />
            </UiButton>
          </form>
        </div>

        <!-- Ações Desktop: Sobre a loja, Salvos, Minha conta -->
        <div class="flex items-center gap-2 sm:gap-4 text-xs font-medium">
          <!-- Sobre a loja -->
          <RouterLink
            to="/sobre-a-loja"
            class="flex flex-col items-center justify-center gap-1 text-white hover:text-sky-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <svg
              class="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110 group-hover:text-sky-200"
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
            <span class="text-xs font-semibold leading-tight tracking-tight"
              >Sobre a loja</span
            >
          </RouterLink>

          <!-- Salvos -->
          <UiButton
            variant="custom"
            size="none"
            @click="listasStore.openManageModal()"
            title="Ver móveis salvos e pastas"
            aria-label="Ver móveis salvos e pastas"
            class="flex-col gap-1 text-white hover:text-rose-200 hover:bg-white/10 px-3 py-1.5 rounded-xl group"
          >
            <svg
              class="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110 group-hover:text-rose-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span class="text-xs font-semibold leading-tight tracking-tight"
              >Salvos</span
            >
          </UiButton>

          <!-- Botão Painel Admin Desktop (Visível apenas para Vendedores e Administradores) -->
          <UiButton
            v-if="authStore.isEquipe"
            variant="custom"
            size="none"
            @click="navigateTo('/admin')"
            class="flex-col gap-1 text-white hover:text-amber-200 hover:bg-white/10 px-3 py-1.5 rounded-xl group"
          >
            <Icon
              icon="mdi:shield-account"
              class="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110 group-hover:text-amber-200"
            />
            <span class="text-xs font-semibold leading-tight tracking-tight"
              >Painel Admin</span
            >
          </UiButton>

          <AppNavbarUserMenu
            :account-path="accountPath"
            @logout="handleLogout"
          />
        </div>
      </div>

      <!-- 2. Cabeçalho Mobile Oficial Figma (block md:hidden) -->
      <div class="block md:hidden">
        <!-- Linha Superior Mobile: Hambúrguer à esquerda, Logo Centralizada, Salvos e Perfil à direita -->
        <div class="px-3.5 sm:px-4 h-14 flex items-center justify-between">
          <!-- Hambúrguer à esquerda (Figma node #1:175) -->
          <button
            type="button"
            class="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            @click="openDrawer"
            aria-label="Abrir menu de navegação"
          >
            <Icon icon="mdi:menu" class="w-5 h-5"></Icon>
          </button>

          <!-- Logo Centralizada (Figma node #3094:1333) -->
          <RouterLink to="/" class="flex items-center justify-center">
            <img
              src="/images/logos/logo-horizontal.svg"
              alt="Empório Henz"
              class="h-7 w-auto object-contain filter brightness-0 invert"
            />
          </RouterLink>

          <!-- Ícones da Direita: Salvos e Perfil (Figma nodes #1:144 e #1:177) -->
          <div class="flex items-center gap-1 sm:gap-2">
            <!-- Salvos -->
            <UiButton
              variant="custom"
              size="icon"
              @click="listasStore.openManageModal()"
              title="Ver móveis salvos e pastas"
              aria-label="Móveis Salvos"
              class="text-white hover:bg-white/10"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </UiButton>

            <!-- Perfil / Minha Conta -->
            <RouterLink
              v-if="!authStore.isAuthenticated"
              to="/login"
              class="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Minha conta"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="10" r="3" />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.168 18.849A4 4 0 0110 16h4a4 4 0 013.832 2.849"
                />
              </svg>
            </RouterLink>

            <button
              v-else
              type="button"
              @click="openDrawer"
              class="w-7 h-7 rounded-full flex items-center justify-center border border-white text-white font-bold text-xs uppercase hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Menu do Usuário"
            >
              {{ authStore.user?.name.charAt(0) }}
            </button>
          </div>
        </div>

        <!-- Linha de Busca Dedicada Mobile (Abaixo da logo, Figma node #3094:2619) -->
        <div class="px-3.5 sm:px-4 pb-3 pt-0.5">
          <form @submit.prevent="handleSearch" class="relative w-full">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Busque por móveis para sua casa"
              class="w-full bg-white text-stone-900 placeholder:text-stone-400 text-sm rounded-xl pl-4 pr-11 py-2.5 border border-transparent focus:border-secondary focus:outline-none shadow-sm"
            />
            <button
              type="submit"
              class="absolute right-0 top-0 h-full px-3.5 flex items-center justify-center text-stone-500 hover:text-secondary cursor-pointer"
              aria-label="Buscar móveis"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Barra Secundária (#007CD8) com Dropdowns Desktop e Centralização Mobile -->
    <div
      v-if="!router.currentRoute.value.path.includes('/admin')"
      class="bg-secondary text-white border-b border-sky-600 shadow-sm relative"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 md:h-10 flex items-center justify-center md:justify-between text-xs"
      >
        <!-- Aviso Vale do Taquari (Centralizado no mobile, alinhado à esquerda no desktop) -->
        <div
          class="flex items-center justify-center gap-2 text-white font-medium select-none text-center w-full md:w-auto"
        >
          <Icon icon="mdi-truck" class="w-5 h-5 shrink-0" />
          <span class="font-normal text-white">
            Entrega e montagem em todo Vale do Taquari
          </span>
        </div>

        <AppNavbarCategorias />
      </div>
    </div>

    <AppNavbarDrawer
      :open="isDrawerOpen"
      :account-path="accountPath"
      @close="closeDrawer"
      @logout="handleLogout"
    />
  </header>
</template>
