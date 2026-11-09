<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import { useListasStore } from "@/stores/listas";
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// Modal somente leitura aberto por um link público de lista (`?lista=...`)
const listasStore = useListasStore();
const route = useRoute();
const router = useRouter();

const list = computed(() => listasStore.sharedList);

const total = computed(() =>
  (list.value?.items ?? []).reduce((sum, item) => sum + (item.price || 0), 0),
);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Produtos reais abrem pelo UUID; produtos de exemplo, pelo slug
function productPath(productId: string, productSlug?: string): string {
  const target = UUID_REGEX.test(productId) ? productId : productSlug || productId;
  return `/produtos/${target}`;
}

function getListIcon(listType: string): string {
  switch (listType) {
    case "FAVORITES":
      return "mdi:heart";
    case "WISHLIST":
      return "mdi:star";
    case "GIFT_LIST":
      return "mdi:gift";
    default:
      return "mdi:folder-outline";
  }
}

function close() {
  listasStore.closeSharedModal();
  if (route.query.lista) {
    const query = { ...route.query };
    delete query.lista;
    void router.replace({ query });
  }
}

function openProduct(productId: string, productSlug?: string) {
  const path = productPath(productId, productSlug);
  close();
  void router.push(path);
}

function goToCatalog() {
  close();
  void router.push("/catalogo");
}
</script>

<template>
  <UiModal
    :model-value="listasStore.isSharedModalOpen"
    :title="list?.name || 'Lista compartilhada'"
    max-width="3xl"
    :show-footer="false"
    :show-close="true"
    :show-icon="false"
    @update:model-value="(val) => (!val ? close() : null)"
    @close="close"
  >
    <div v-if="list" class="space-y-4">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200"
      >
        <p class="text-xs text-stone-500 flex items-center gap-1.5">
          <Icon :icon="getListIcon(list.listType)" class="w-4 h-4 text-primary" />
          Lista compartilhada com você ·
          {{ list.items.length }}
          {{ list.items.length === 1 ? "móvel" : "móveis" }}
        </p>
        <p v-if="list.items.length > 0" class="text-xs font-semibold text-stone-700">
          Total estimado: {{ formatPrice(total) }}
        </p>
      </div>

      <div
        v-if="list.items.length === 0"
        class="py-10 text-center text-sm text-stone-500"
      >
        Esta lista ainda não tem móveis.
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="item in list.items"
          :key="item.id"
          type="button"
          class="text-left bg-white rounded-xl border border-stone-200/90 overflow-hidden flex flex-col hover:shadow-xs transition-shadow duration-200 cursor-pointer"
          @click="openProduct(item.productId, item.productSlug)"
        >
          <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
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
            <h5
              class="text-xs font-bold text-neutral-dark line-clamp-1"
              :title="item.name"
            >
              {{ item.name }}
            </h5>
            <p class="text-xs font-semibold text-secondary mt-0.5">
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
              <span class="text-[10px] text-stone-500 font-medium truncate">
                {{ item.finishLabel }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <div class="pt-2 flex justify-end">
        <UiButton variant="outline" size="xs" @click="goToCatalog">
          Ver catálogo completo
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>
