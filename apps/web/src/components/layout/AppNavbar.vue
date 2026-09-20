<script setup lang="ts">
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { onMounted, onUnmounted, ref } from "vue";

const authStore = useAuthStore();

const searchQuery = ref("");
const isUserMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);
const activeDropdown = ref<string | null>(null);

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

function handleLogout() {
  authStore.logout();
  closeUserMenu();
  router.push("/");
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest("#user-menu-container")) {
    closeUserMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (dropdownTimer) clearTimeout(dropdownTimer);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <header class="sticky top-0 z-50 w-full shadow-md">
    <div class="bg-primary text-white">
      <div
        class="mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4"
      >
        <!-- Logo Horizontal -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 shrink-0 group transition-opacity hover:opacity-95"
        >
          <img
            src="/images/logo-horizontal.svg"
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

        <!-- Campo de Busca Central -->
        <div class="hidden md:flex flex-1 max-w-xl mx-4">
          <div class="relative w-full group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Busque por móveis para sua casa"
              class="w-full bg-white text-stone-900 placeholder:text-stone-400 text-sm rounded-lg pl-4 pr-11 py-2.5 border border-transparent hover:border-sky-300 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all shadow-sm"
            />
            <button
              type="button"
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
          </div>
        </div>

        <!-- Ações do Cabeçalho Direito (Sobre a loja, Salvos, Minha conta) -->
        <div class="flex items-center gap-2 sm:gap-4 text-xs font-medium">
          <!-- Sobre a loja -->
          <RouterLink
            to="/"
            class="flex flex-col items-center justify-center gap-1 text-white hover:text-sky-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <!-- Ícone Loja Física Oficial Figma (Storefront com toldo e entrada) -->
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

          <!-- Salvos (Ícone de Coração do Figma image.png) -->
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

          <!-- Menu de Usuário Autenticado / Não Autenticado -->
          <div id="user-menu-container" class="relative">
            <!-- Usuário Autenticado -->
            <button
              v-if="authStore.isAuthenticated && authStore.user"
              @click="toggleUserMenu"
              class="flex flex-col sm:flex-row items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-all focus:outline-none cursor-pointer group"
              aria-label="Abrir menu do usuário"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center border-white justify-center text-white font-bold text-xs uppercase transition-colors border-1"
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
              <svg
                class="w-3.5 h-3.5 text-white/80 group-hover:rotate-180 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
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
                  to="/equipe/login"
                  @click="closeUserMenu"
                  class="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-900 transition-colors font-medium"
                >
                  <svg
                    class="w-4 h-4 text-amber-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Painel da Equipe</span>
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

            <!-- Visitante Não Autenticado (Ícone Pessoa em Círculo conforme image.png) -->
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

          <!-- Botão Mobile Hamburger -->
          <button
            type="button"
            class="md:hidden p-2 text-stone-300 hover:text-white focus:outline-none cursor-pointer"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Menu de navegação mobile"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Barra Secundária (#007CD8) com Dropdowns Interativos nos Hovers das Categorias -->
    <div
      class="bg-secondary text-white border-b border-sky-600 shadow-sm relative"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs"
      >
        <!-- Aviso Vale do Taquari (Ícone de Caminhão de Entrega conforme Figma image.png) -->
        <div class="flex items-center gap-2 text-white font-medium select-none">
          <svg
            class="w-4 h-4 text-white shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h4"
            />
          </svg>
          <span class="font-normal text-white"
            >Entrega e montagem em todo Vale do Taquari</span
          >
        </div>

        <!-- Links de Categorias com Dropdowns Anti-flicker no Hover -->
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
              class="flex items-center gap-1 font-medium text-white hover:bg-white/15 px-3 py-1 rounded-md transition-all cursor-pointer"
            >
              <span>{{ cat.name }}</span>
              <svg
                class="w-3 h-3 text-white transition-transform duration-200"
                :class="{ 'rotate-180': activeDropdown === cat.slug }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </RouterLink>

            <!-- Dropdown Menu Flutuante ao passar o mouse com ponte invisível anti-flicker -->
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

    <!-- Gaveta Mobile Aberta -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white border-b border-stone-200 p-4 space-y-4 shadow-lg text-sm animate-in fade-in duration-150"
    >
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Busque por móveis..."
          class="w-full bg-stone-100 text-stone-900 text-sm rounded-lg pl-3 pr-10 py-2 border border-stone-300 focus:outline-none focus:border-secondary"
        />
        <button
          type="button"
          class="absolute right-0 top-0 h-full px-3 text-stone-500 cursor-pointer"
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
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
        <RouterLink
          v-for="cat in categories"
          :key="cat.slug"
          to="/"
          @click="isMobileMenuOpen = false"
          class="p-2 rounded-lg hover:bg-sky-50 text-stone-700 font-medium text-xs flex items-center justify-between transition-colors"
        >
          <span>{{ cat.name }}</span>
          <span class="text-stone-400">›</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
