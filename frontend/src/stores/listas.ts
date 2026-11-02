import { useAuthStore } from "@/stores/auth";
import type { SavedItem, UserList } from "@/types";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export const LISTAS_STORAGE_KEY = "emporio_henz_listas_v1";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createDefaultLists(): UserList[] {
  const now = new Date().toISOString();
  return [
    {
      id: "system-favoritos",
      name: "Favoritos",
      isSystem: true,
      listType: "FAVORITES",
      shareSlug: generateUUID(),
      createdAt: now,
      items: [],
    },
    {
      id: "system-desejos",
      name: "Lista de Desejos",
      isSystem: true,
      listType: "WISHLIST",
      shareSlug: generateUUID(),
      createdAt: now,
      items: [],
    },
    {
      id: "system-presentes",
      name: "Lista de Presentes",
      isSystem: true,
      listType: "GIFT_LIST",
      shareSlug: generateUUID(),
      createdAt: now,
      items: [],
    },
  ];
}

export interface ActiveProductToSave {
  productId: string;
  productSlug?: string;
  name: string;
  price: number;
  image: string;
  finishLabel?: string;
  finishColor?: string;
}

export const useListasStore = defineStore("listas", () => {
  const lists = ref<UserList[]>([]);
  const isSaveModalOpen = ref(false);
  const isManageModalOpen = ref(false);
  const activeProductToSave = ref<ActiveProductToSave | null>(null);
  const selectedListIdForManage = ref<string | null>(null);
  // Convite de login para visitantes (PRD UC04, fluxo A1)
  const isLoginPromptOpen = ref(false);
  const pendingProductToSave = ref<ActiveProductToSave | null>(null);
  const authStore = useAuthStore();

  // Inicializa o estado a partir do localStorage
  function initLists(): void {
    if (typeof window === "undefined") {
      lists.value = createDefaultLists();
      return;
    }

    try {
      const stored = localStorage.getItem(LISTAS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserList[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que as 3 listas padrão essenciais do sistema sempre existam
          const defaultDefaults = createDefaultLists();
          for (const def of defaultDefaults) {
            const exists = parsed.some(
              (l) => l.isSystem && (l.id === def.id || l.listType === def.listType),
            );
            if (!exists) {
              parsed.unshift(def);
            }
          }
          lists.value = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn("Falha ao recuperar listas do localStorage, reinicializando padrão:", err);
    }

    lists.value = createDefaultLists();
    persist();
  }

  function persist(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LISTAS_STORAGE_KEY, JSON.stringify(lists.value));
    } catch (err) {
      console.error("Falha ao persistir listas no localStorage:", err);
    }
  }

  // Monitora alterações profundas para salvar automaticamente
  watch(
    lists,
    () => {
      persist();
    },
    { deep: true },
  );

  // Inicializa imediatamente
  initLists();

  // Retoma o salvamento pendente assim que o visitante se autentica
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (!isAuthenticated || !pendingProductToSave.value) return;
      const product = pendingProductToSave.value;
      pendingProductToSave.value = null;
      isLoginPromptOpen.value = false;
      openSaveModal(product);
    },
  );

  // Getters
  const totalSavedCount = computed(() => {
    if (!authStore.isAuthenticated) return 0;
    const uniqueProductIds = new Set<string>();
    for (const list of lists.value) {
      for (const item of list.items) {
        uniqueProductIds.add(item.productId);
      }
    }
    return uniqueProductIds.size;
  });

  const systemLists = computed(() => lists.value.filter((l) => l.isSystem));
  const customLists = computed(() => lists.value.filter((l) => !l.isSystem));

  function getListById(id: string): UserList | undefined {
    return lists.value.find((l) => l.id === id);
  }

  function getListBySlug(slug: string): UserList | undefined {
    return lists.value.find((l) => l.shareSlug === slug);
  }

  function isProductSavedInList(productId: string, listId: string): boolean {
    const list = getListById(listId);
    if (!list) return false;
    return list.items.some((item) => item.productId === productId);
  }

  function isProductSavedAnywhere(productId: string): boolean {
    if (!authStore.isAuthenticated) return false;
    return lists.value.some((list) =>
      list.items.some((item) => item.productId === productId),
    );
  }

  function getListsContainingProduct(productId: string): string[] {
    return lists.value
      .filter((list) => list.items.some((item) => item.productId === productId))
      .map((list) => list.id);
  }

  // Modais
  function openSaveModal(product: ActiveProductToSave): void {
    if (!authStore.isAuthenticated) {
      pendingProductToSave.value = { ...product };
      isLoginPromptOpen.value = true;
      return;
    }
    activeProductToSave.value = { ...product };
    isSaveModalOpen.value = true;
  }

  function closeSaveModal(): void {
    isSaveModalOpen.value = false;
    activeProductToSave.value = null;
  }

  // Fecha o convite; mantém o produto pendente só quando o visitante segue para o login
  function closeLoginPrompt(keepPending = false): void {
    isLoginPromptOpen.value = false;
    if (!keepPending) pendingProductToSave.value = null;
  }

  function openManageModal(targetListId?: string): void {
    if (!targetListId && !authStore.isAuthenticated) {
      isLoginPromptOpen.value = true;
      return;
    }
    if (targetListId) {
      selectedListIdForManage.value = targetListId;
    } else {
      selectedListIdForManage.value = null;
    }
    isManageModalOpen.value = true;
  }

  function closeManageModal(): void {
    isManageModalOpen.value = false;
    selectedListIdForManage.value = null;
  }

  // Ações de Itens
  function addItemToList(
    listId: string,
    itemData: Omit<SavedItem, "id" | "addedAt">,
  ): SavedItem | null {
    const list = getListById(listId);
    if (!list) return null;

    // Evita duplicatas idênticas (mesmo produto e mesmo acabamento)
    const existingIndex = list.items.findIndex(
      (i) =>
        i.productId === itemData.productId &&
        i.finishLabel === itemData.finishLabel &&
        i.finishColor === itemData.finishColor,
    );

    if (existingIndex !== -1) {
      return list.items[existingIndex]!;
    }

    const newItem: SavedItem = {
      ...itemData,
      id: generateUUID(),
      addedAt: new Date().toISOString(),
    };

    list.items.unshift(newItem);
    persist();
    return newItem;
  }

  function removeItemFromList(listId: string, itemId: string): boolean {
    const list = getListById(listId);
    if (!list) return false;

    const initialLength = list.items.length;
    list.items = list.items.filter((item) => item.id !== itemId);
    if (list.items.length !== initialLength) {
      persist();
      return true;
    }
    return false;
  }

  // Ações de Pastas
  function createCustomList(name: string): UserList {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("O nome da pasta não pode ser vazio.");
    }

    const newList: UserList = {
      id: generateUUID(),
      name: trimmed,
      isSystem: false,
      listType: "CUSTOM",
      shareSlug: generateUUID(),
      createdAt: new Date().toISOString(),
      items: [],
    };

    lists.value.push(newList);
    persist();
    return newList;
  }

  function renameCustomList(listId: string, newName: string): boolean {
    const list = getListById(listId);
    if (!list) return false;

    if (list.isSystem) {
      console.warn("Tentativa bloqueada de renomear lista padrão do sistema.");
      return false;
    }

    const trimmed = newName.trim();
    if (!trimmed) return false;

    list.name = trimmed;
    persist();
    return true;
  }

  function deleteCustomList(listId: string): boolean {
    const list = getListById(listId);
    if (!list) return false;

    if (list.isSystem) {
      console.warn("Tentativa bloqueada de excluir lista padrão do sistema.");
      return false;
    }

    lists.value = lists.value.filter((l) => l.id !== listId);
    persist();
    return true;
  }

  return {
    lists,
    isSaveModalOpen,
    isManageModalOpen,
    activeProductToSave,
    selectedListIdForManage,
    isLoginPromptOpen,
    pendingProductToSave,
    totalSavedCount,
    systemLists,
    customLists,
    initLists,
    getListById,
    getListBySlug,
    isProductSavedInList,
    isProductSavedAnywhere,
    getListsContainingProduct,
    openSaveModal,
    closeSaveModal,
    closeLoginPrompt,
    openManageModal,
    closeManageModal,
    addItemToList,
    removeItemFromList,
    createCustomList,
    renameCustomList,
    deleteCustomList,
  };
});
