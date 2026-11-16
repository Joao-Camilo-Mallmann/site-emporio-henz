<script setup lang="ts">
import { listasApi } from "@/api/listas";
import type { ApiSharedList } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

// Página pública de uma lista: o back só devolve a lista se ela for pública
const route = useRoute();
const list = ref<ApiSharedList | null>(null);
const isLoading = ref(true);

const LIST_ICONS: Record<string, string> = {
  FAVORITES: "mdi:heart",
  WISHLIST: "mdi:star",
  GIFT_LIST: "mdi:gift",
};

const total = computed(() =>
  (list.value?.items ?? []).reduce((sum, item) => sum + (item.price || 0), 0),
);

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

watch(
  () => route.params.shareSlug,
  async (shareSlug) => {
    isLoading.value = true;
    try {
      list.value = await listasApi.buscarCompartilhada(String(shareSlug));
    } catch {
      list.value = null;
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div
      v-if="isLoading"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="h-56 rounded-2xl bg-stone-100 animate-pulse"
      />
    </div>

    <div
      v-else-if="!list"
      class="py-20 text-center text-stone-500 space-y-3"
    >
      <Icon icon="mdi:lock-outline" class="w-12 h-12 mx-auto text-stone-300" />
      <p class="text-base font-semibold text-neutral-dark">
        Esta lista é privada ou não está mais disponível.
      </p>
      <p class="text-sm">Peça para quem enviou o link torná-la pública.</p>
      <RouterLink
        to="/catalogo"
        class="inline-block text-sm font-semibold text-secondary hover:underline"
      >
        Ver catálogo completo
      </RouterLink>
    </div>

    <div v-else class="space-y-6">
      <header
        class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-stone-200"
      >
        <div>
          <p class="text-xs text-stone-500 flex items-center gap-1.5 mb-1">
            <Icon
              :icon="LIST_ICONS[list.listType] ?? 'mdi:folder-outline'"
              class="w-4 h-4 text-primary"
            />
            Lista compartilhada com você ·
            {{ list.items.length }}
            {{ list.items.length === 1 ? "móvel" : "móveis" }}
          </p>
          <h1
            class="text-2xl sm:text-3xl font-bold text-neutral-dark tracking-tight"
          >
            {{ list.name }}
          </h1>
        </div>
        <p
          v-if="list.items.length > 0"
          class="text-sm font-semibold text-stone-700"
        >
          Total estimado: {{ formatPrice(total) }}
        </p>
      </header>

      <div
        v-if="list.items.length === 0"
        class="py-14 text-center text-stone-500"
      >
        <Icon
          icon="mdi:sofa-outline"
          class="w-10 h-10 mx-auto mb-2 text-stone-300"
        />
        Esta lista ainda não tem móveis.
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <RouterLink
          v-for="item in list.items"
          :key="item.id"
          :to="`/catalogo/${item.productSlug || item.productId}`"
          class="bg-white rounded-2xl border border-stone-200/90 overflow-hidden flex flex-col hover:shadow-xs transition-shadow duration-200"
        >
          <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-stone-300"
            >
              <Icon icon="mdi:image-outline" class="w-8 h-8" />
            </div>
          </div>

          <div class="p-3">
            <h2
              class="text-sm font-bold text-neutral-dark line-clamp-1"
              :title="item.name"
            >
              {{ item.name }}
            </h2>
            <p class="text-sm font-semibold text-secondary mt-0.5">
              {{ formatPrice(item.price) }}
            </p>
            <div
              v-if="item.finishLabel || item.finishColor"
              class="flex items-center gap-1.5 mt-1.5"
            >
              <span
                v-if="item.finishColor"
                class="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                :style="{ backgroundColor: item.finishColor }"
              />
              <span class="text-xs text-stone-500 font-medium truncate">
                {{ item.finishLabel }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <div class="flex justify-end">
        <RouterLink
          to="/catalogo"
          class="text-sm font-semibold text-secondary hover:underline"
        >
          Ver catálogo completo
        </RouterLink>
      </div>
    </div>
  </div>
</template>
