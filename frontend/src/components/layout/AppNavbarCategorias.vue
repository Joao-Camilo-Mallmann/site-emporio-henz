<script setup lang="ts">
import { linkCategoria, linkSubcategoria, useAppStore } from "@/stores/app";
import { Icon } from "@iconify/vue";
import { onMounted, onUnmounted, ref } from "vue";

// Chave do dropdown "Mais"; as demais chaves são os slugs das categorias
const MAIS = "__mais__";
const FECHAMENTO_MS = 180;

const appStore = useAppStore();
const activeDropdown = ref<string | null>(null);
// "Mais" aberto por clique (toque/teclado) não fecha ao tirar o mouse, só com Esc, clique fora ou outro clique
const maisFixado = ref(false);
const maisContainer = ref<HTMLElement | null>(null);

let dropdownTimer: ReturnType<typeof setTimeout> | null = null;

function cancelarFechamento() {
  if (dropdownTimer) {
    clearTimeout(dropdownTimer);
    dropdownTimer = null;
  }
}

function abrir(chave: string) {
  cancelarFechamento();
  if (chave !== MAIS) maisFixado.value = false;
  activeDropdown.value = chave;
}

function fechar() {
  cancelarFechamento();
  activeDropdown.value = null;
  maisFixado.value = false;
}

function agendarFechamento() {
  if (activeDropdown.value === MAIS && maisFixado.value) return;
  cancelarFechamento();
  dropdownTimer = setTimeout(fechar, FECHAMENTO_MS);
}

function clicarMais() {
  if (activeDropdown.value === MAIS && maisFixado.value) {
    fechar();
    return;
  }
  abrir(MAIS);
  maisFixado.value = true;
}

function alinhamentoDropdown(index: number) {
  // O último item fica colado na borda direita: o dropdown abre para dentro da página
  const ultimo =
    index === appStore.categoriasBarra.length - 1 &&
    appStore.categoriasMais.length === 0;
  return ultimo ? "right-0" : "left-0";
}

function handleClickOutside(event: MouseEvent) {
  if (activeDropdown.value !== MAIS) return;
  if (!maisContainer.value?.contains(event.target as Node)) fechar();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && activeDropdown.value) fechar();
}

onMounted(() => {
  void appStore.carregarCategorias();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  cancelarFechamento();
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!-- Links de Categorias Desktop (API) com Dropdowns no Hover: no máximo 6 itens, o excedente vai para "Mais" -->
  <nav
    v-if="appStore.categoriasBarra.length"
    aria-label="Categorias"
    class="hidden md:flex items-center gap-1 sm:gap-2"
  >
    <div
      v-for="(cat, index) in appStore.categoriasBarra"
      :key="cat.id"
      class="relative group/cat py-2"
      @mouseenter="abrir(cat.slug)"
      @mouseleave="agendarFechamento"
    >
      <!-- Botão da Categoria -->
      <RouterLink
        :to="linkCategoria(cat)"
        @click="fechar"
        class="flex items-center gap-1 font-medium text-white hover:bg-white/15 px-1 lg:px-3 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap"
      >
        <span>{{ cat.name }}</span>
        <Icon
          v-if="cat.subtypes?.length"
          :icon="
            activeDropdown === cat.slug ? 'mdi:chevron-up' : 'mdi:chevron-down'
          "
          class="w-4 h-4 text-white transition-transform duration-200"
        />
      </RouterLink>

      <!-- Dropdown de Subcategorias com ponte anti-flicker (pt-1.5) -->
      <div
        v-if="cat.subtypes?.length"
        v-show="activeDropdown === cat.slug"
        class="absolute top-full pt-1.5 w-52 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        :class="alinhamentoDropdown(index)"
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
            v-for="sub in cat.subtypes"
            :key="sub.id"
            :to="linkSubcategoria(cat, sub)"
            @click="fechar"
            class="flex items-center justify-between px-3 py-1.5 text-xs text-stone-700 hover:bg-sky-50 hover:text-secondary rounded-lg transition-colors cursor-pointer group/item"
          >
            <span>{{ sub.name }}</span>
            <Icon
              icon="mdi:chevron-right"
              class="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all text-secondary"
            />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Botão "Mais": categorias que não cabem na barra, com suas subcategorias -->
    <div
      v-if="appStore.categoriasMais.length"
      ref="maisContainer"
      class="relative py-2"
      @mouseenter="abrir(MAIS)"
      @mouseleave="agendarFechamento"
    >
      <UiButton
        variant="custom"
        size="none"
        aria-haspopup="true"
        aria-controls="navbar-mais-categorias"
        :aria-expanded="activeDropdown === MAIS"
        class="gap-1 font-medium text-white hover:bg-white/15 px-1 lg:px-3 py-1 rounded-md whitespace-nowrap"
        @click="clicarMais"
      >
        <span>Mais</span>
        <Icon
          :icon="activeDropdown === MAIS ? 'mdi:chevron-up' : 'mdi:chevron-down'"
          class="w-4 h-4 text-white transition-transform duration-200"
        />
      </UiButton>

      <div
        v-show="activeDropdown === MAIS"
        id="navbar-mais-categorias"
        class="absolute right-0 top-full pt-1.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
      >
        <div
          class="bg-white text-stone-800 rounded-xl shadow-2xl py-2 px-1 border border-stone-200 max-h-[70vh] overflow-y-auto"
        >
          <div
            v-for="(cat, index) in appStore.categoriasMais"
            :key="cat.id"
            :class="index > 0 && 'border-t border-stone-100 mt-1 pt-1'"
          >
            <RouterLink
              :to="linkCategoria(cat)"
              @click="fechar"
              class="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider hover:bg-sky-50 hover:text-secondary rounded-lg transition-colors cursor-pointer group/item"
            >
              <span>{{ cat.name }}</span>
              <Icon
                icon="mdi:chevron-right"
                class="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all text-secondary"
              />
            </RouterLink>
            <RouterLink
              v-for="sub in cat.subtypes"
              :key="sub.id"
              :to="linkSubcategoria(cat, sub)"
              @click="fechar"
              class="flex items-center justify-between px-3 py-1.5 text-xs text-stone-700 hover:bg-sky-50 hover:text-secondary rounded-lg transition-colors cursor-pointer group/item"
            >
              <span>{{ sub.name }}</span>
              <Icon
                icon="mdi:chevron-right"
                class="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all text-secondary"
              />
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
