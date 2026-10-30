<script setup lang="ts">
import { useListasStore } from "@/stores/listas";
import type { UserList } from "@/types";
import { storeSiteUrl, storeWhatsappUrl } from "@/utils/phone";
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue3-toastify";

const router = useRouter();
const listasStore = useListasStore();

// Níveis de navegação interna: 'level1_folders' ou 'level2_items'
const activeLevel = ref<"level1_folders" | "level2_items">("level1_folders");
const activeListId = ref<string | null>(null);

// Estados de edição / criação
const isCreatingFolder = ref(false);
const newFolderName = ref("");
const isRenaming = ref(false);
const renameValue = ref("");
const isConfirmingDelete = ref(false);

const activeList = computed<UserList | undefined>(() => {
  if (!activeListId.value) return undefined;
  return listasStore.getListById(activeListId.value);
});

// Total estimado dos móveis na pasta ativa
const activeListTotal = computed(() => {
  if (!activeList.value) return 0;
  return activeList.value.items.reduce(
    (acc, item) => acc + (item.price || 0),
    0,
  );
});

function formatPrice(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

// Ao abrir o modal, verifica se já deve abrir direto em uma pasta específica
watch(
  () => listasStore.isManageModalOpen,
  (isOpen) => {
    if (isOpen) {
      isCreatingFolder.value = false;
      isRenaming.value = false;
      isConfirmingDelete.value = false;
      if (listasStore.selectedListIdForManage) {
        activeListId.value = listasStore.selectedListIdForManage;
        activeLevel.value = "level2_items";
      } else {
        activeLevel.value = "level1_folders";
        activeListId.value = null;
      }
    }
  },
);

function enterFolder(listId: string) {
  activeListId.value = listId;
  activeLevel.value = "level2_items";
  isRenaming.value = false;
  isConfirmingDelete.value = false;
}

function backToFolders() {
  activeLevel.value = "level1_folders";
  activeListId.value = null;
  isRenaming.value = false;
  isConfirmingDelete.value = false;
}

function handleCreateFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    toast.warning("Digite um nome para a pasta.");
    return;
  }

  try {
    const created = listasStore.createCustomList(name);
    newFolderName.value = "";
    isCreatingFolder.value = false;
    toast.success(`Pasta "${created.name}" criada com sucesso!`);
    enterFolder(created.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar pasta.";
    toast.error(msg);
  }
}

function startRename() {
  if (!activeList.value || activeList.value.isSystem) return;
  renameValue.value = activeList.value.name;
  isRenaming.value = true;
}

function handleRename() {
  if (!activeList.value || activeList.value.isSystem) return;
  const newName = renameValue.value.trim();
  if (!newName) {
    toast.warning("O nome da pasta não pode ser vazio.");
    return;
  }

  const success = listasStore.renameCustomList(activeList.value.id, newName);
  if (success) {
    toast.success("Pasta renomeada com sucesso!");
    isRenaming.value = false;
  } else {
    toast.error("Não foi possível renomear a pasta.");
  }
}

function handleDeleteFolder() {
  if (!activeList.value || activeList.value.isSystem) return;
  const listName = activeList.value.name;
  const success = listasStore.deleteCustomList(activeList.value.id);
  if (success) {
    toast.info(`Pasta "${listName}" excluída.`);
    backToFolders();
  } else {
    toast.error("Erro ao excluir a pasta.");
  }
}

function handleRemoveItem(itemId: string) {
  if (!activeListId.value) return;
  const removed = listasStore.removeItemFromList(activeListId.value, itemId);
  if (removed) {
    toast.info("Móvel removido da pasta.");
  }
}

async function copyPublicLink() {
  if (!activeList.value) return;
  const shareUrl = storeSiteUrl(`/catalogo?lista=${activeList.value.shareSlug}`);

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link público copiado para a área de transferência!");
    } else {
      toast.info(`Link público: ${shareUrl}`);
    }
  } catch {
    toast.info(`Link público: ${shareUrl}`);
  }
}

function openWhatsApp() {
  if (!activeList.value || activeList.value.items.length === 0) {
    toast.warning("Adicione móveis à pasta antes de solicitar orçamento.");
    return;
  }

  const shareUrl = storeSiteUrl(`/catalogo?lista=${activeList.value.shareSlug}`);

  let message = `Olá! Gostaria de solicitar um orçamento para a minha lista "${activeList.value.name}" no Empório Henz:\n\n`;

  activeList.value.items.forEach((item, index) => {
    const finish = item.finishLabel ? ` (${item.finishLabel})` : "";
    message += `${index + 1}. ${item.name}${finish} - ${formatPrice(item.price)}\n`;
  });

  message += `\n*Total Estimado:* ${formatPrice(activeListTotal.value)}\n`;
  message += `*Link da Lista:* ${shareUrl}\n\n`;
  message += `Gostaria de saber mais sobre as condições de pagamento e prazo de entrega.`;

  window.open(storeWhatsappUrl(message), "_blank");
}

function goToCatalog() {
  listasStore.closeManageModal();
  router.push("/catalogo");
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
    :model-value="listasStore.isManageModalOpen"
    :title="
      activeLevel === 'level1_folders'
        ? 'Móveis Salvos & Pastas de Ambientes'
        : activeList?.name || 'Móveis da Pasta'
    "
    max-width="3xl"
    :show-footer="false"
    :show-close="true"
    :show-icon="false"
    @update:model-value="
      (val) => (!val ? listasStore.closeManageModal() : null)
    "
    @close="listasStore.closeManageModal"
  >
    <!-- ========================================== -->
    <!-- NÍVEL 1: LISTAGEM LIMPA E COMPACTA DE PASTAS -->
    <!-- ========================================== -->
    <div v-if="activeLevel === 'level1_folders'" class="space-y-4">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200"
      >
        <div>
          <p class="text-xs text-stone-500">
            Organize os ambientes da sua casa ou os projetos dos seus clientes.
          </p>
        </div>
        <UiButton
          v-if="!isCreatingFolder"
          variant="secondary"
          size="xs"
          class="shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          @click="isCreatingFolder = true"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          Nova Pasta
        </UiButton>
      </div>

      <!-- Formulário Inline de Nova Pasta -->
      <div
        v-if="isCreatingFolder"
        class="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 animate-in fade-in duration-200"
      >
        <label class="block text-xs font-semibold text-stone-700">
          Criar nova pasta de projeto ou ambiente:
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model="newFolderName"
            type="text"
            placeholder="Ex: Reforma Sala Estar, Apartamento 302..."
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
            @click="isCreatingFolder = false"
          >
            Cancelar
          </UiButton>
        </div>
      </div>

      <!-- Lista Limpa de Pastas -->
      <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        <div
          v-for="list in listasStore.lists"
          :key="list.id"
          class="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/90 bg-white hover:border-secondary/50 hover:shadow-xs transition-all duration-200 group cursor-pointer"
          @click="enterFolder(list.id)"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 border border-stone-200/60 group-hover:scale-105 transition-transform"
            >
              <Icon
                :icon="getListIcon(list.listType)"
                class="w-5 h-5 shrink-0"
                :class="getIconColorClass(list.listType)"
              />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4
                  class="text-sm font-bold text-neutral-dark truncate group-hover:text-secondary transition-colors"
                >
                  {{ list.name }}
                </h4>
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                  :class="[
                    list.isSystem
                      ? 'bg-stone-100 text-stone-600 border-stone-200'
                      : 'bg-sky-50 text-secondary border-sky-200',
                  ]"
                >
                  {{ list.isSystem ? "Padrão" : "Personalizada" }}
                </span>
              </div>
              <p class="text-xs text-stone-400 mt-0.5">
                {{ list.items.length }}
                {{ list.items.length === 1 ? "móvel salvo" : "móveis salvos" }}
              </p>
            </div>
          </div>

          <UiButton
            variant="ghost"
            size="sm"
            class="shrink-0 text-stone-600 group-hover:text-secondary group-hover:bg-secondary/10 flex items-center gap-1"
            @click.stop="enterFolder(list.id)"
          >
            Abrir Pasta
            <Icon icon="mdi:arrow-right" class="w-4 h-4" />
          </UiButton>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- NÍVEL 2: VISUALIZAÇÃO DOS ITENS DA PASTA   -->
    <!-- ========================================== -->
    <div
      v-else-if="activeLevel === 'level2_items' && activeList"
      class="space-y-4"
    >
      <!-- Navegação de Volta e Ações da Pasta -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200"
      >
        <UiButton
          variant="ghost"
          size="xs"
          class="text-stone-600 hover:text-neutral-dark flex items-center gap-1.5 self-start px-1"
          @click="backToFolders"
        >
          <Icon icon="mdi:arrow-left" class="w-4 h-4" />
          Voltar para Minhas Pastas
        </UiButton>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Ações exclusivas de pastas personalizadas -->
          <template v-if="!activeList.isSystem">
            <UiButton
              v-if="!isRenaming"
              variant="outline"
              size="xs"
              class="flex items-center gap-1"
              @click="startRename"
            >
              <Icon icon="mdi:pencil-outline" class="w-3.5 h-3.5" />
              Renomear
            </UiButton>
            <UiButton
              variant="outline"
              size="xs"
              class="text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
              @click="isConfirmingDelete = true"
            >
              <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
              Excluir
            </UiButton>
          </template>

          <!-- Ações Globais: Copiar Link e WhatsApp -->
          <UiButton
            variant="outline"
            size="xs"
            class="flex items-center gap-1"
            title="Compartilhar pasta por link público"
            @click="copyPublicLink"
          >
            <Icon icon="mdi:link-variant" class="w-3.5 h-3.5" />
            Copiar Link
          </UiButton>

          <UiButton
            variant="outline"
            size="xs"
            class="text-emerald-700 border-emerald-300 hover:bg-emerald-50 flex items-center gap-1 font-semibold"
            title="Solicitar orçamento pelo WhatsApp"
            @click="openWhatsApp"
          >
            <Icon icon="mdi:whatsapp" class="w-3.5 h-3.5 text-emerald-600" />
            Orçar no WhatsApp
          </UiButton>
        </div>
      </div>

      <!-- Barra de Renomear Inline -->
      <div
        v-if="isRenaming"
        class="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2 animate-in fade-in duration-200"
      >
        <input
          v-model="renameValue"
          type="text"
          class="flex-1 px-3 py-1 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-secondary/40 bg-white"
          @keydown.enter.prevent="handleRename"
        />
        <UiButton variant="primary" size="xs" @click="handleRename"
          >Salvar</UiButton
        >
        <UiButton variant="outline" size="xs" @click="isRenaming = false"
          >Cancelar</UiButton
        >
      </div>

      <!-- Confirmação de Exclusão de Pasta -->
      <div
        v-if="isConfirmingDelete"
        class="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-2 animate-in fade-in duration-200"
      >
        <p class="font-semibold">
          Tem certeza que deseja excluir a pasta "{{ activeList.name }}"? Todos
          os itens salvos nela serão removidos.
        </p>
        <div class="flex items-center gap-2">
          <UiButton variant="danger" size="xs" @click="handleDeleteFolder">
            Sim, excluir pasta
          </UiButton>
          <UiButton
            variant="outline"
            size="xs"
            @click="isConfirmingDelete = false"
          >
            Cancelar
          </UiButton>
        </div>
      </div>

      <!-- Estado Vazio (Sem Itens) -->
      <div
        v-if="activeList.items.length === 0"
        class="text-center py-10 px-4 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 space-y-3"
      >
        <Icon
          icon="mdi:package-variant-closed"
          class="w-12 h-12 mx-auto text-stone-300"
        />
        <div>
          <h4 class="text-sm font-semibold text-neutral-dark">
            Esta pasta está vazia
          </h4>
          <p class="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Navegue pelo catálogo ou detalhes dos produtos e clique no botão de
            salvar para guardar móveis nesta pasta.
          </p>
        </div>
        <UiButton
          variant="secondary"
          size="sm"
          class="mt-2"
          @click="goToCatalog"
        >
          Explorar Catálogo de Móveis
        </UiButton>
      </div>

      <!-- Grid de Móveis Salvos -->
      <div v-else class="space-y-3">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1"
        >
          <div
            v-for="item in activeList.items"
            :key="item.id"
            class="bg-white rounded-xl border border-stone-200/90 overflow-hidden flex flex-col hover:shadow-xs transition-shadow duration-200"
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

            <div class="p-3 flex-1 flex flex-col justify-between">
              <div>
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

              <div
                class="mt-3 pt-2 border-t border-stone-100 flex items-center justify-end"
              >
                <UiButton
                  variant="ghost"
                  size="none"
                  class="text-xs text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1"
                  @click="handleRemoveItem(item.id)"
                >
                  <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
                  Remover
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé do Nível 2: Total e Fechar -->
        <div
          class="flex items-center justify-between pt-3 border-t border-stone-200"
        >
          <div>
            <span class="text-xs text-stone-500 block"
              >Total estimado da pasta:</span
            >
            <span class="text-base font-bold text-neutral-dark">
              {{ formatPrice(activeListTotal) }}
            </span>
          </div>

          <UiButton
            variant="primary"
            size="sm"
            @click="listasStore.closeManageModal"
          >
            Fechar
          </UiButton>
        </div>
      </div>
    </div>
  </UiModal>
</template>
