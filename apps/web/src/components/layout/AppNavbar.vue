<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref("");
const isUserMenuOpen = ref(false);
const isDrawerOpen = ref(false);
const activeDropdown = ref<string | null>(null);
const activeAccordion = ref<string | null>(null);

let dropdownTimer: ReturnType<typeof setTimeout> | null = null;

function handleCategoryMouseEnter(slug: string) {
  if (dropdownTimer) {
    clearTimeout(dropdownTimer);
    dropdownTimer = null;
  }
  activeDropdown.value = slug;
}

function handleCategoryMouseLeave() {
  dropdownTimer = setTimeout(() => {
    activeDropdown.value = null;
  }, 180);
}

function handleSubcategoryClick() {
  activeDropdown.value = null;
}

interface CategoryDef {
  name: string;
  slug: string;
  subcategories: string[];
}

const categories: CategoryDef[] = [
  {
    name: "Quarto",
    slug: "quarto",
    subcategories: [
      "Camas",
      "Roupeiros",
      "Cabeceiras",
      "Cômodas",
      "Mesas de Cabeceira",
    ],
  },
  {
    name: "Sala de Estar",
    slug: "sala-de-estar",
    subcategories: [
      "Sofás",
      "Poltronas",
      "Mesas de Centro",
      "Racks e Painéis",
      "Puffs",
    ],
  },
  {
    name: "Sala de Jantar",
    slug: "sala-de-jantar",
    subcategories: [
      "Mesas de Jantar",
      "Cadeiras",
      "Aparadores",
      "Cristaleiras",
      "Buffets",
    ],
  },
  {
    name: "Cozinha",
    slug: "cozinha",
    subcategories: [
      "Armários",
      "Balcões",
      "Bancadas",
      "Banquetas",
      "Ilhas Gourmet",
    ],
  },
  {
    name: "Escritório",
    slug: "escritorio",
    subcategories: [
      "Mesas de Escritório",
      "Cadeiras Presidente",
      "Estantes de Livros",
      "Gaveteiros",
    ],
  },
  {
    name: "Banheiro",
    slug: "banheiro",
    subcategories: [
      "Gabinetes",
      "Espelheiras",
      "Armários Aéreos",
      "Prateleiras",
    ],
  },
];

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
}

function openDrawer() {
  isDrawerOpen.value = true;
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  isDrawerOpen.value = false;
  activeAccordion.value = null;
  document.body.style.overflow = "";
}

function toggleAccordion(slug: string) {
  activeAccordion.value = activeAccordion.value === slug ? null : slug;
}

function handleLogout() {
  authStore.logout();
  closeUserMenu();
  router.push("/");
}

function handleLogoutDrawer() {
  authStore.logout();
  closeDrawer();
  router.push("/");
}

function handleSearch() {
  if (!searchQuery.value.trim()) return;
  router.push({ path: "/", query: { q: searchQuery.value.trim() } });
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest("#user-menu-container")) {
    closeUserMenu();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (isDrawerOpen.value) {
      closeDrawer();
    }
    if (isUserMenuOpen.value) {
      closeUserMenu();
    }
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (dropdownTimer) clearTimeout(dropdownTimer);
  document.removeEventListener("click", handleClickOutside);
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
            class="h-8 md:h-9 w-auto object-contain filter brightness-0 invert"
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
            <button
              type="submit"
              class="absolute right-0 top-0 h-full px-3.5 flex items-center justify-center text-stone-400 hover:text-secondary hover:scale-110 transition-all cursor-pointer"
              aria-label="Buscar"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
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
          <RouterLink
            to="/"
            class="flex flex-col items-center justify-center gap-1 text-white hover:text-rose-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group cursor-pointer"
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
          </RouterLink>

          <!-- Botão Painel Admin Desktop (Visível apenas para Vendedores e Administradores) -->
          <RouterLink
            v-if="authStore.isEquipe"
            to="/admin"
            class="bg-amber-500/15 text-amber-300 border border-amber-400/30 hover:bg-amber-500/25 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Icon icon="mdi:shield-account" class="w-4 h-4 text-amber-400 shrink-0" />
            <span>Painel Admin</span>
          </RouterLink>

          <!-- Menu de Usuário Desktop -->
          <div id="user-menu-container" class="relative">
            <!-- Usuário Autenticado -->
            <button
              v-if="authStore.isAuthenticated && authStore.user"
              @click="toggleUserMenu"
              class="flex flex-col sm:flex-row items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-all focus:outline-none cursor-pointer group"
              aria-label="Abrir menu do usuário"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center border-white justify-center text-white font-bold text-xs uppercase transition-colors border"
              >
                {{ authStore.user.name.charAt(0) }}
              </div>
              <div class="hidden sm:block text-left">
                <div
                  class="font-bold text-xs leading-tight text-white truncate max-w-[100px]"
                >
                  {{ authStore.user.name.split(" ")[0] }}
                </div>
                <div class="text-[10px] text-amber-300 capitalize leading-none">
                  {{
                    authStore.user.roleName ||
                    (authStore.isAdmin
                      ? "Admin"
                      : authStore.isVendedor
                        ? "Vendedor"
                        : "Cliente")
                  }}
                </div>
              </div>
              <Icon
                :icon="isUserMenuOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                class="w-4 h-4 text-white/80 transition-transform duration-200"
              />
            </button>

            <!-- Dropdown do Usuário Autenticado -->
            <div
              v-if="
                isUserMenuOpen && authStore.isAuthenticated && authStore.user
              "
              class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 text-stone-800 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div
                class="px-4 py-3 border-b border-stone-100 bg-stone-50/50 rounded-t-xl"
              >
                <p class="font-bold text-stone-900 truncate">
                  {{ authStore.user.name }}
                </p>
                <p class="text-xs text-stone-500 truncate">
                  {{ authStore.user.email }}
                </p>
                <span
                  class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                  :class="
                    authStore.isAdmin
                      ? 'bg-purple-100 text-purple-800'
                      : authStore.isVendedor
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                  "
                >
                  Perfil
                  {{
                    authStore.user.roleName ||
                    (authStore.isAdmin
                      ? "Administrador"
                      : authStore.isVendedor
                        ? "Vendedor"
                        : "Cliente")
                  }}
                </span>
              </div>

              <div class="py-1">
                <RouterLink
                  to="/"
                  @click="closeUserMenu"
                  class="flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <svg
                    class="w-4 h-4 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Minha Conta</span>
                </RouterLink>

                <RouterLink
                  to="/"
                  @click="closeUserMenu"
                  class="flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <svg
                    class="w-4 h-4 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>Móveis Salvos</span>
                </RouterLink>

                <RouterLink
                  v-if="authStore.isEquipe"
                  to="/admin"
                  @click="closeUserMenu"
                  class="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-900 transition-colors font-medium"
                >
                  <Icon icon="mdi:shield-account" class="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Painel Admin</span>
                </RouterLink>
              </div>

              <div class="border-t border-stone-100 pt-1">
                <button
                  type="button"
                  @click="handleLogout"
                  class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>

            <!-- Visitante Não Autenticado Desktop -->
            <RouterLink
              v-if="!authStore.isAuthenticated"
              to="/login"
              class="flex flex-col items-center justify-center gap-1 text-white hover:text-sky-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group cursor-pointer"
            >
              <svg
                class="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110 group-hover:text-sky-200"
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
              <span class="text-xs font-semibold leading-tight tracking-tight"
                >Minha conta</span
              >
            </RouterLink>
          </div>
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
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
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
            <RouterLink
              to="/"
              class="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Móveis Salvos"
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
            </RouterLink>

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
          <span class="font-normal text-white ">
            Entrega e montagem em todo Vale do Taquari
          </span>
        </div>

        <!-- Links de Categorias Desktop com Dropdowns no Hover (hidden md:flex) -->
        <nav class="hidden md:flex items-center gap-1 sm:gap-2">
          <div
            v-for="cat in categories"
            :key="cat.slug"
            class="relative group/cat py-2"
            @mouseenter="handleCategoryMouseEnter(cat.slug)"
            @mouseleave="handleCategoryMouseLeave"
          >
            <!-- Botão da Categoria -->
            <RouterLink
              to="/"
              class="flex items-center gap-1 font-medium text-white hover:bg-white/15 px-1 lg:px-3 py-1 rounded-md transition-all cursor-pointer"
            >
              <span>{{ cat.name }}</span>
              <Icon
                :icon="
                  activeDropdown === cat.slug
                    ? 'mdi:chevron-up'
                    : 'mdi:chevron-down'
                "
                class="w-4 h-4 text-white transition-transform duration-200"
              />
            </RouterLink>

            <!-- Dropdown Menu Flutuante ao passar o mouse com ponte anti-flicker -->
            <div
              v-show="activeDropdown === cat.slug"
              @mouseenter="handleCategoryMouseEnter(cat.slug)"
              @mouseleave="handleCategoryMouseLeave"
              class="absolute left-0 top-full pt-1.5 w-52 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div
                class="bg-white text-stone-800 rounded-xl shadow-2xl py-2 px-1 border border-stone-200"
              >
                <div
                  class="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1"
                >
                  {{ cat.name }}
                </div>
                <RouterLink
                  v-for="sub in cat.subcategories"
                  :key="sub"
                  to="/"
                  @click="handleSubcategoryClick"
                  class="flex items-center justify-between px-3 py-1.5 text-xs text-stone-700 hover:bg-sky-50 hover:text-secondary rounded-lg transition-colors cursor-pointer group/item"
                >
                  <span>{{ sub }}</span>
                  <svg
                    class="w-3 h-3 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>

    <!-- 3. Drawer Lateral Mobile Oficial (munu-mobile.png) -->
    <Teleport to="body">
      <div v-if="isDrawerOpen" class="fixed inset-0 z-50 flex">
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
            @click="closeDrawer"
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
              <RouterLink to="/" @click="closeDrawer" class="flex items-center">
                <img
                  src="/images/logos/logo-horizontal.svg"
                  alt="Empório Henz"
                  class="h-8 w-auto object-contain filter brightness-0 invert"
                />
              </RouterLink>
              <button
                type="button"
                @click="closeDrawer"
                class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Corpo do Drawer em bg-secondary com Categorias e Ações -->
            <div
              class="bg-secondary flex-1 overflow-y-auto px-5 py-4 space-y-1 text-white text-sm"
            >
              <!-- Lista de Categorias com Acordeão -->
              <div v-for="cat in categories" :key="cat.slug">
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
                    v-for="sub in cat.subcategories"
                    :key="sub"
                    to="/"
                    @click="closeDrawer"
                    class="block py-1.5 px-2.5 text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md transition-colors"
                  >
                    {{ sub }}
                  </RouterLink>
                </div>
              </div>

              <!-- Divisor Sutil -->
              <div class="border-t border-white/25 my-4 pt-3 space-y-2">
                <!-- Salvos -->
                <RouterLink
                  to="/"
                  @click="closeDrawer"
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>Salvos</span>
                </RouterLink>

                <!-- Sobre a loja -->
                <RouterLink
                  to="/sobre-a-loja"
                  @click="closeDrawer"
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
                <RouterLink
                  v-if="authStore.isEquipe"
                  to="/admin"
                  @click="closeDrawer"
                  class="flex items-center gap-3 py-2.5 px-3 font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-lg hover:bg-amber-500/25 transition-colors cursor-pointer shadow-xs my-1"
                >
                  <Icon icon="mdi:shield-account" class="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Painel Admin</span>
                </RouterLink>

                <!-- Minha conta -->
                <RouterLink
                  :to="authStore.isAuthenticated ? '/' : '/login'"
                  @click="closeDrawer"
                  class="flex items-center gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    class="w-5 h-5 text-white shrink-0"
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
                  <span v-if="authStore.isAuthenticated && authStore.user">
                    Minha conta ({{ authStore.user.name.split(" ")[0] }})
                  </span>
                  <span v-else>Minha conta</span>
                </RouterLink>

                <!-- Sair / Entrar -->
                <button
                  v-if="authStore.isAuthenticated"
                  type="button"
                  @click="handleLogoutDrawer"
                  class="w-full flex items-center gap-3.5 py-2.5 px-1 font-semibold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sair</span>
                </button>

                <RouterLink
                  v-else
                  to="/login"
                  @click="closeDrawer"
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
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Entrar</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>
  </header>
</template>
