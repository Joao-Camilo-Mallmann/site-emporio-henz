<script setup lang="ts">
import { fornecedoresApi, usuariosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type { IAssignedSupplier, ISupplier } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";

interface VendedorInfo {
  id: string;
  fullName: string;
  email?: string;
}

interface Props {
  open: boolean;
  vendedor: VendedorInfo | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

interface SupplierRow extends ISupplier {
  // Vínculo existente com fornecedor desativado (não vem da listagem de ativos).
  inactiveLinked?: boolean;
}

const allSuppliers = ref<SupplierRow[]>([]);
const initialSelectedIds = ref<Set<string>>(new Set());
const selectedIds = ref<Set<string>>(new Set());
const searchTerm = ref("");

const filteredSuppliers = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return allSuppliers.value;
  return allSuppliers.value.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      (s.contact && s.contact.toLowerCase().includes(term)),
  );
});

const totalSelected = computed(() => selectedIds.value.size);
const hasChanges = computed(() => {
  if (selectedIds.value.size !== initialSelectedIds.value.size) return true;
  for (const id of selectedIds.value) {
    if (!initialSelectedIds.value.has(id)) return true;
  }
  return false;
});

async function listarTodosFornecedoresAtivos(): Promise<ISupplier[]> {
  const items: ISupplier[] = [];
  let page = 1;
  let totalPages: number;
  do {
    const res = await fornecedoresApi.listar({
      active: true,
      page,
      limit: 100,
    });
    items.push(...res.data);
    totalPages = res.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

// Evita que uma resposta antiga (outro vendedor / recarga anterior) sobrescreva o estado.
let loadToken = 0;

async function carregarDados() {
  const vendedorId = props.vendedor?.id;
  if (!vendedorId) return;

  const token = ++loadToken;
  loading.value = true;
  error.value = null;
  searchTerm.value = "";

  try {
    const [ativos, vinculos] = await Promise.all([
      listarTodosFornecedoresAtivos(),
      usuariosApi.listarTodosFornecedores(vendedorId),
    ]);
    if (token !== loadToken) return;

    // Vínculos com fornecedores inativos continuam visíveis e removíveis.
    const activeIds = new Set(ativos.map((s) => s.id));
    const inativosVinculados = vinculos
      .filter((v: IAssignedSupplier) => !activeIds.has(v.id))
      .map(
        (v: IAssignedSupplier) =>
          ({
            id: v.id,
            name: v.name,
            contact: v.contact,
            active: false,
            inactiveLinked: true,
          }) as SupplierRow,
      );

    allSuppliers.value = [...ativos, ...inativosVinculados];

    const assignedIds = new Set<string>(vinculos.map((item) => item.id));
    initialSelectedIds.value = new Set(assignedIds);
    selectedIds.value = new Set(assignedIds);
  } catch (err: unknown) {
    if (token !== loadToken) return;
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Falha ao carregar os fornecedores para vínculo.";
  } finally {
    if (token === loadToken) loading.value = false;
  }
}

watch(
  () => [props.open, props.vendedor?.id] as const,
  ([isOpen, vendedorId]) => {
    if (isOpen && vendedorId) {
      carregarDados();
    } else {
      loadToken++;
      loading.value = false;
      searchTerm.value = "";
      error.value = null;
    }
  },
  { immediate: true },
);

function toggleSupplier(supplierId: string) {
  const next = new Set(selectedIds.value);
  if (next.has(supplierId)) {
    next.delete(supplierId);
  } else {
    next.add(supplierId);
  }
  selectedIds.value = next;
}

function selectAllFiltered() {
  const next = new Set(selectedIds.value);
  for (const s of filteredSuppliers.value) {
    next.add(s.id);
  }
  selectedIds.value = next;
}

function deselectAllFiltered() {
  const next = new Set(selectedIds.value);
  for (const s of filteredSuppliers.value) {
    next.delete(s.id);
  }
  selectedIds.value = next;
}

function handleClose() {
  if (saving.value) return;
  emit("close");
}

async function handleSave() {
  if (!props.vendedor?.id || saving.value) return;

  if (!hasChanges.value) {
    toast.info("Nenhuma alteração nos vínculos para salvar.");
    handleClose();
    return;
  }

  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (const id of selectedIds.value) {
    if (!initialSelectedIds.value.has(id)) {
      toAdd.push(id);
    }
  }

  for (const id of initialSelectedIds.value) {
    if (!selectedIds.value.has(id)) {
      toRemove.push(id);
    }
  }

  saving.value = true;
  const vendedorId = props.vendedor.id;

  try {
    const operations = [
      ...toAdd.map((supplierId) =>
        usuariosApi.vincularFornecedor(vendedorId, supplierId),
      ),
      ...toRemove.map((supplierId) =>
        usuariosApi.desvincularFornecedor(vendedorId, supplierId),
      ),
    ];

    const results = await Promise.allSettled(operations);
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    if (failures.length === 0) {
      toast.success("Vínculos de fornecedores atualizados com sucesso!");
      emit("saved");
      handleClose();
      return;
    }

    // Falha parcial: avisa o pai do que já foi persistido e recarrega o estado real.
    if (failures.length < results.length) emit("saved");

    const first = failures[0].reason as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const detail =
      first?.response?.data?.message || first?.message || "erro desconhecido";
    toast.error(
      `${failures.length} de ${results.length} alterações falharam: ${detail}`,
    );
    await carregarDados();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UiModal
    :open="open"
    title="Fornecedores e Marcas Autorizadas"
    variant="primary"
    max-width="xl"
    :loading="saving"
    confirm-text="Salvar Alterações"
    cancel-text="Cancelar"
    @close="handleClose"
    @cancel="handleClose"
    @confirm="handleSave"
  >
    <div class="space-y-4">
      <!-- Resumo do Vendedor -->
      <div
        v-if="vendedor"
        class="p-3 rounded-lg bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
      >
        <div class="min-w-0">
          <div class="font-semibold text-neutral-dark truncate">
            {{ vendedor.fullName }}
          </div>
          <div class="text-stone-400 truncate mt-0.5">
            {{ vendedor.email || "Vendedor" }}
          </div>
        </div>
        <div class="shrink-0 text-right">
          <span
            class="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
            :class="
              totalSelected > 0
                ? 'bg-sky-50 text-secondary-hover'
                : 'bg-amber-50 text-amber-700'
            "
          >
            <Icon
              :icon="
                totalSelected > 0
                  ? 'mdi:checkbox-marked-circle-outline'
                  : 'mdi:alert-circle-outline'
              "
              class="w-3.5 h-3.5"
            />
            {{ totalSelected }}
            {{ totalSelected === 1 ? "marca vinculada" : "marcas vinculadas" }}
          </span>
        </div>
      </div>

      <!-- Barra de Filtro / Busca Rápida -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400"
          >
            <Icon icon="mdi:magnify" class="w-4 h-4" />
          </span>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Filtrar fornecedor por nome ou contato..."
            class="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
          />
        </div>

        <div class="flex items-center gap-1 shrink-0 text-xs">
          <UiButton
            variant="ghost"
            size="xs"
            class="text-stone-500 hover:text-secondary text-[11px]"
            @click="selectAllFiltered"
            title="Marcar todos os fornecedores visíveis"
          >
            Marcar todos
          </UiButton>
          <span class="text-stone-300">|</span>
          <UiButton
            variant="ghost"
            size="xs"
            class="text-stone-500 hover:text-rose-600 text-[11px]"
            @click="deselectAllFiltered"
            title="Desmarcar todos os fornecedores visíveis"
          >
            Desmarcar todos
          </UiButton>
        </div>
      </div>

      <!-- Carregamento -->
      <div
        v-if="loading"
        class="py-12 flex flex-col items-center justify-center text-stone-500 gap-2"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando marcas e fornecedores...</span>
      </div>

      <!-- Erro -->
      <div
        v-else-if="error"
        class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          <Icon
            icon="mdi:alert-circle-outline"
            class="w-4 h-4 text-rose-500 shrink-0"
          />
          <span>{{ error }}</span>
        </div>
        <UiButton variant="danger" size="xs" @click="carregarDados">
          Recarregar
        </UiButton>
      </div>

      <!-- Lista Vazia de Fornecedores Cadastrados -->
      <div
        v-else-if="allSuppliers.length === 0"
        class="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-stone-100"
      >
        Nenhum fornecedor ativo encontrado no catálogo. Cadastre fornecedores em
        <RouterLink
          to="/admin/fornecedores"
          class="text-secondary hover:underline font-medium"
        >
          Fornecedores
        </RouterLink>
        primeiro.
      </div>

      <!-- Lista Filtrada Vazia -->
      <div
        v-else-if="filteredSuppliers.length === 0"
        class="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-stone-100"
      >
        Nenhum fornecedor corresponde ao filtro "{{ searchTerm }}".
      </div>

      <!-- Lista com Checkbox Rolável -->
      <div
        v-else
        class="max-h-[60vh] overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-lg bg-white"
      >
        <label
          v-for="supplier in filteredSuppliers"
          :key="supplier.id"
          :for="`supplier-${supplier.id}`"
          class="flex items-center justify-between p-2.5 sm:px-3 hover:bg-stone-50/70 transition-colors cursor-pointer select-none"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              :id="`supplier-${supplier.id}`"
              :checked="selectedIds.has(supplier.id)"
              class="w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary/20 cursor-pointer"
              @change="toggleSupplier(supplier.id)"
            />
            <div class="min-w-0">
              <span
                class="text-xs font-medium text-neutral-dark block truncate"
              >
                {{ supplier.name }}
                <span
                  v-if="supplier.inactiveLinked"
                  class="ml-1 text-[10px] font-normal text-amber-700"
                >
                  (inativo)
                </span>
              </span>
              <span
                v-if="supplier.contact"
                class="text-[11px] text-stone-400 block truncate"
              >
                {{ supplier.contact }}
              </span>
            </div>
          </div>

          <div class="shrink-0 flex items-center gap-1.5 ml-2">
            <span
              v-if="selectedIds.has(supplier.id)"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-secondary-hover bg-sky-50 px-2 py-0.5 rounded-full"
            >
              <Icon icon="mdi:check" class="w-3 h-3" />
              <span>Autorizado</span>
            </span>
            <span v-else class="text-[11px] text-stone-400 px-2 py-0.5">
              Não vinculado
            </span>
          </div>
        </label>
      </div>
    </div>
  </UiModal>
</template>
