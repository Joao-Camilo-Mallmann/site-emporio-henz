<script setup lang="ts">
import { useListasStore } from "@/stores/listas";
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";
import { toast } from "vue3-toastify";

const listasStore = useListasStore();

const selectedListIds = ref<Set<string>>(new Set());
const isCreatingNewFolder = ref(false);
const newFolderName = ref("");
const isSubmitting = ref(false);

const product = computed(() => listasStore.activeProductToSave);

// Formatação do preço do produto
const formattedPrice = computed(() => {
  if (!product.value || typeof product.value.price !== "number") {
    return "0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.value.price);
});

// Ao abrir o modal, pré-seleciona as listas que já contêm este produto
watch(
  () => listasStore.isSaveModalOpen,
  (isOpen) => {
    if (isOpen && product.value) {
      isCreatingNewFolder.value = false;
      newFolderName.value = "";
      const alreadyIn = listasStore.getListsContainingProduct(product.value.productId);
      if (alreadyIn.length > 0) {
        selectedListIds.value = new Set(alreadyIn);
      } else {
        // Se ainda não estiver em nenhuma, pré-seleciona "Favoritos" por padrão
        const favList = listasStore.lists.find((l) => l.listType === "FAVORITES");
        selectedListIds.value = new Set(favList ? [favList.id] : []);
      }
    }
  },
);

function toggleListSelection(listId: string) {
  if (selectedListIds.value.has(listId)) {
    selectedListIds.value.delete(listId);
  } else {
    selectedListIds.value.add(listId);
  }
}

function handleCreateFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    toast.warning("Digite um nome para a pasta.");
    return;
  }

  try {
    const created = listasStore.createCustomList(name);
    selectedListIds.value.add(created.id);
    newFolderName.value = "";
    isCreatingNewFolder.value = false;
    toast.success(`Pasta "${created.name}" criada com sucesso!`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar pasta.";
    toast.error(msg);
  }
}

function handleSave() {
  if (!product.value) return;

  if (selectedListIds.value.size === 0) {
    toast.warning("Selecione ao menos uma pasta para salvar o móvel.");
    return;
  }

  isSubmitting.value = true;
  try {
    const targetIds = Array.from(selectedListIds.value);

    for (const listId of targetIds) {
      listasStore.addItemToList(listId, {
        productId: product.value.productId,
        productSlug: product.value.productSlug,
        name: product.value.name,
        price: product.value.price,
        image: product.value.image,
        finishLabel: product.value.finishLabel,
        finishColor: product.value.finishColor,
      });
    }

    const count = targetIds.length;
    const toastMsg =
      count === 1
        ? `Móvel salvo com sucesso na sua lista!`
        : `Móvel salvo em ${count} listas com sucesso!`;

    toast.success(toastMsg);

    // Fecha o modal de salvar
    listasStore.closeSaveModal();
  } catch (err) {
    console.error("Erro ao salvar produto em listas:", err);
    toast.error("Ocorreu um erro ao salvar o móvel.");
  } finally {
    isSubmitting.value = false;
  }
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

function getIconColorClass(listType: string): string {
  switch (listType) {
    case "FAVORITES":
      return "text-rose-500";
    case "WISHLIST":
      return "text-amber-500";
    case "GIFT_LIST":
      return "text-indigo-500";
    default:
      return "text-primary";
  }
}
</script>

<template>
  <UiModal
    :model-value="listasStore.isSaveModalOpen"
    title="Salvar Móvel em uma Lista"
    max-width="lg"
    :show-footer="false"
    :show-close="true"
    @update:model-value="(val) => (!val ? listasStore.closeSaveModal() : null)"
    @close="listasStore.closeSaveModal"
  >
    <div v-if="product" class="space-y-5">
      <!-- Mini Card Resumo do Produto -->
      <div
        class="flex items-center gap-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80"
      >
        <div
          class="w-16 h-16 rounded-lg bg-stone-200 shrink-0 overflow-hidden flex items-center justify-center"
        >
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="w-full h-full object-cover"
          />
          <Icon v-else icon="mdi:image-outline" class="w-7 h-7 text-stone-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-bold text-neutral-dark truncate" :title="product.name">
            {{ product.name }}
          </h4>
          <p class="text-xs font-semibold text-secondary mt-0.5">
            {{ formattedPrice }}
          </p>
          <div
            v-if="product.finishLabel || product.finishColor"
            class="flex items-center gap-1.5 mt-1.5"
          >
            <span
              v-if="product.finishColor"
              class="w-3 h-3 rounded-full border border-stone-300 shrink-0"
              :style="{ backgroundColor: product.finishColor }"
            />
            <span class="text-[11px] text-stone-500 font-medium truncate">
              Acabamento: {{ product.finishLabel || "Padrão" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Lista de Pastas Disponíveis -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Selecione a(s) pasta(s) de destino:
        </label>

        <div
          class="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-stone-200/80 rounded-xl p-2 bg-white"
        >
          <div
            v-for="list in listasStore.lists"
            :key="list.id"
            class="flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none"
            :class="[
              selectedListIds.has(list.id)
                ? 'bg-sky-50/60 border-secondary/40 shadow-xs'
                : 'bg-white border-transparent hover:bg-stone-50',
            ]"
            @click="toggleListSelection(list.id)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                :checked="selectedListIds.has(list.id)"
                class="w-4 h-4 rounded-sm text-secondary focus:ring-secondary/40 cursor-pointer shrink-0"
                @click.stop="toggleListSelection(list.id)"
              />
              <Icon
                :icon="getListIcon(list.listType)"
                class="w-5 h-5 shrink-0"
                :class="getIconColorClass(list.listType)"
              />
              <div class="min-w-0">
                <span class="text-sm font-semibold text-neutral-dark truncate block">
                  {{ list.name }}
                </span>
                <span class="text-[11px] text-stone-400">
                  {{ list.items.length }} {{ list.items.length === 1 ? "móvel" : "móveis" }}
                </span>
              </div>
            </div>

            <!-- Badge indicando se já está salvo nesta pasta -->
            <span
              v-if="listasStore.isProductSavedInList(product.productId, list.id)"
              class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0"
            >
              Já salvo
            </span>
          </div>
        </div>
      </div>

      <!-- Criar Nova Pasta Inline -->
      <div class="pt-1">
        <div v-if="!isCreatingNewFolder">
          <UiButton
            variant="ghost"
            size="sm"
            class="text-xs text-secondary font-semibold hover:text-secondary-hover px-1 flex items-center gap-1.5"
            @click="isCreatingNewFolder = true"
          >
            <Icon icon="mdi:plus-circle-outline" class="w-4 h-4" />
            Criar nova pasta personalizada
          </UiButton>
        </div>

        <div
          v-else
          class="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2 animate-in fade-in duration-200"
        >
          <label class="block text-xs font-semibold text-stone-700">
            Nome da nova pasta:
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="newFolderName"
              type="text"
              placeholder="Ex: Reforma Sala Estar, Casa de Praia..."
              class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-secondary/40 bg-white"
              @keydown.enter.prevent="handleCreateFolder"
            />
            <UiButton
              variant="primary"
              size="xs"
              class="h-8"
              @click="handleCreateFolder"
            >
              Criar
            </UiButton>
            <UiButton
              variant="outline"
              size="xs"
              class="h-8"
              @click="isCreatingNewFolder = false"
            >
              Cancelar
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Ações do Rodapé do Modal -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
        <UiButton
          variant="outline"
          size="sm"
          @click="listasStore.closeSaveModal"
        >
          Cancelar
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :loading="isSubmitting"
          :disabled="selectedListIds.size === 0"
          @click="handleSave"
        >
          Salvar na Pasta
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>
