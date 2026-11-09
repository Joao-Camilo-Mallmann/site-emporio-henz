import { listasApi } from "@/api/listas";
import { useAuthStore } from "@/stores/auth";
import type {
  ApiList,
  ApiListItem,
  SavedItem,
  SharedList,
  UserList,
} from "@/types";
import { isAxiosError } from "axios";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { toast } from "vue3-toastify";

// Chave onde as listas ficavam salvas no navegador antes de existir a API.
// Hoje só é lida uma vez, para importar o que já estava salvo para a conta.
export const LISTAS_STORAGE_KEY = "emporio_henz_listas_v1";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    return typeof message === "string" && message ? message : fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

function mapItem(item: ApiListItem): SavedItem {
  return {
    id: item.id,
    productId: item.productId,
    productSlug: item.productSlug ?? undefined,
    name: item.name,
    price: item.price,
    image: item.image,
    finishLabel: item.finishLabel ?? undefined,
    finishColor: item.finishColor ?? undefined,
    addedAt: item.addedAt,
  };
}

function mapList(list: ApiList): UserList {
  return {
    id: list.id,
    name: list.name,
    isSystem: list.isSystem,
    listType: list.listType,
    shareSlug: list.shareSlug,
    createdAt: list.createdAt,
    items: (list.items ?? []).map(mapItem),
  };
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
  const authStore = useAuthStore();

  const lists = ref<UserList[]>([]);
  const isLoading = ref(false);
  const isSaveModalOpen = ref(false);
  const isManageModalOpen = ref(false);
  const activeProductToSave = ref<ActiveProductToSave | null>(null);
  const selectedListIdForManage = ref<string | null>(null);

  // Lista aberta pelo link público (somente leitura)
  const sharedList = ref<SharedList | null>(null);
  const isSharedModalOpen = ref(false);

  let isImporting = false;

  // Getters
  const totalSavedCount = computed(() => {
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
    return lists.value.some((list) =>
      list.items.some((item) => item.productId === productId),
    );
  }

  function getListsContainingProduct(productId: string): string[] {
    return lists.value
      .filter((list) => list.items.some((item) => item.productId === productId))
      .map((list) => list.id);
  }

  // Carrega do servidor as listas (e itens) do cliente logado
  async function loadLists(): Promise<void> {
    if (!authStore.isAuthenticated) {
      lists.value = [];
      return;
    }

    isLoading.value = true;
    try {
      const data = await listasApi.listar();
      lists.value = data.map(mapList);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Não foi possível carregar suas listas."));
    } finally {
      isLoading.value = false;
    }
  }

  // Visitantes sem login são levados ao login e voltam para a mesma página
  async function goToLogin(): Promise<void> {
    const { default: router } = await import("@/router");
    await router.push({
      path: "/login",
      query: { redirect: router.currentRoute.value.fullPath },
    });
  }

  function requireLogin(message: string): boolean {
    if (authStore.isAuthenticated) return true;
    toast.info(message);
    void goToLogin();
    return false;
  }

  // Modais
  function openSaveModal(product: ActiveProductToSave): void {
    if (!requireLogin("Entre na sua conta para salvar móveis nas suas listas.")) {
      return;
    }
    activeProductToSave.value = { ...product };
    isSaveModalOpen.value = true;
  }

  function closeSaveModal(): void {
    isSaveModalOpen.value = false;
    activeProductToSave.value = null;
  }

  function openManageModal(targetListId?: string): void {
    if (!requireLogin("Entre na sua conta para ver os móveis que você salvou.")) {
      return;
    }
    selectedListIdForManage.value = targetListId ?? null;
    isManageModalOpen.value = true;
  }

  function closeManageModal(): void {
    isManageModalOpen.value = false;
    selectedListIdForManage.value = null;
  }

  // Ações de itens (todas gravam no servidor; erros chegam como `Error`)
  async function addItemToList(
    listId: string,
    itemData: Omit<SavedItem, "id" | "addedAt">,
  ): Promise<SavedItem | null> {
    const list = getListById(listId);
    if (!list) return null;

    try {
      const saved = await listasApi.adicionarItem(listId, {
        productId: itemData.productId,
        productSlug: itemData.productSlug,
        name: itemData.name,
        price: Number(itemData.price) || 0,
        image: itemData.image ?? "",
        finishLabel: itemData.finishLabel,
        finishColor: itemData.finishColor,
      });

      const item = mapItem(saved);
      // O servidor devolve o item existente quando já estava salvo
      if (!list.items.some((i) => i.id === item.id)) {
        list.items.unshift(item);
      }
      return item;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Não foi possível salvar o móvel."), { cause: err });
    }
  }

  async function removeItemFromList(
    listId: string,
    itemId: string,
  ): Promise<boolean> {
    const list = getListById(listId);
    if (!list) return false;

    try {
      await listasApi.removerItem(listId, itemId);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Não foi possível remover o móvel."), { cause: err });
    }

    list.items = list.items.filter((item) => item.id !== itemId);
    return true;
  }

  // Ações de pastas
  async function createCustomList(name: string): Promise<UserList> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("O nome da pasta não pode ser vazio.");
    }

    try {
      const created = mapList(await listasApi.criar(trimmed));
      lists.value.push(created);
      return created;
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Não foi possível criar a pasta."), { cause: err });
    }
  }

  async function renameCustomList(
    listId: string,
    newName: string,
  ): Promise<boolean> {
    const list = getListById(listId);
    if (!list || list.isSystem) return false;

    const trimmed = newName.trim();
    if (!trimmed) return false;

    try {
      const updated = await listasApi.renomear(listId, trimmed);
      list.name = updated.name;
      return true;
    } catch (err) {
      throw new Error(
        apiErrorMessage(err, "Não foi possível renomear a pasta."),
        { cause: err },
      );
    }
  }

  async function deleteCustomList(listId: string): Promise<boolean> {
    const list = getListById(listId);
    if (!list || list.isSystem) return false;

    try {
      await listasApi.excluir(listId);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Não foi possível excluir a pasta."), { cause: err });
    }

    lists.value = lists.value.filter((l) => l.id !== listId);
    return true;
  }

  // Link público
  async function openSharedList(shareSlug: string): Promise<void> {
    try {
      const data = await listasApi.buscarCompartilhada(shareSlug);
      sharedList.value = {
        name: data.name,
        listType: data.listType,
        items: data.items.map(mapItem),
      };
      isSharedModalOpen.value = true;
    } catch {
      toast.error("Esta lista não existe ou não está mais disponível.");
    }
  }

  function closeSharedModal(): void {
    isSharedModalOpen.value = false;
    sharedList.value = null;
  }

  // Importa, uma única vez, as listas que o navegador guardava antes da API
  async function importLocalLists(): Promise<void> {
    if (typeof window === "undefined" || isImporting) return;

    let stored: UserList[];
    try {
      const raw = localStorage.getItem(LISTAS_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(LISTAS_STORAGE_KEY);
        return;
      }
      stored = parsed as UserList[];
    } catch {
      localStorage.removeItem(LISTAS_STORAGE_KEY);
      return;
    }

    const withItems = stored.filter(
      (l) => Array.isArray(l.items) && l.items.length > 0,
    );
    if (withItems.length === 0) {
      localStorage.removeItem(LISTAS_STORAGE_KEY);
      return;
    }

    isImporting = true;
    let hasFailure = false;
    let importedCount = 0;

    try {
      for (const local of withItems) {
        try {
          let target = local.isSystem
            ? lists.value.find(
                (l) => l.isSystem && l.listType === local.listType,
              )
            : lists.value.find(
                (l) =>
                  !l.isSystem &&
                  l.name.toLowerCase() === local.name.trim().toLowerCase(),
              );

          if (!target) {
            target = await createCustomList(local.name);
          }

          // Do mais antigo para o mais novo, para manter a ordem original
          for (const item of [...local.items].reverse()) {
            try {
              await addItemToList(target.id, {
                productId: item.productId,
                productSlug: item.productSlug,
                name: item.name,
                price: item.price,
                image: item.image,
                finishLabel: item.finishLabel,
                finishColor: item.finishColor,
              });
              importedCount++;
            } catch {
              hasFailure = true;
            }
          }
        } catch {
          hasFailure = true;
        }
      }
    } finally {
      isImporting = false;
    }

    // Se algo falhou, mantém os dados locais para tentar de novo no próximo login
    if (!hasFailure) {
      localStorage.removeItem(LISTAS_STORAGE_KEY);
    }
    if (importedCount > 0) {
      toast.success("Importamos para a sua conta os móveis salvos neste navegador.");
    }
  }

  // Ao entrar, carrega as listas da conta; ao sair, limpa tudo da tela
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await loadLists();
        await importLocalLists();
      } else {
        lists.value = [];
        closeSaveModal();
        closeManageModal();
      }
    },
    { immediate: true },
  );

  return {
    lists,
    isLoading,
    isSaveModalOpen,
    isManageModalOpen,
    activeProductToSave,
    selectedListIdForManage,
    sharedList,
    isSharedModalOpen,
    totalSavedCount,
    systemLists,
    customLists,
    loadLists,
    getListById,
    getListBySlug,
    isProductSavedInList,
    isProductSavedAnywhere,
    getListsContainingProduct,
    openSaveModal,
    closeSaveModal,
    openManageModal,
    closeManageModal,
    addItemToList,
    removeItemFromList,
    createCustomList,
    renameCustomList,
    deleteCustomList,
    openSharedList,
    closeSharedModal,
  };
});
