<script setup lang="ts">
import { categoriasApi, fornecedoresApi, produtosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type {
  AvailabilityType,
  ICategory,
  ISupplier,
  ProductAdminFilterParams,
  ProductListItemDto,
  UiSelectOption,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  apiErrorMessage,
  AVAILABILITY_OPTIONS,
  availabilityLabel,
  formatCurrencyBRL,
  formatDimensions,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { toApiAssetUrl } from "@/utils/uploads";

// Tela `/admin/produtos`: cabeçalho, filtros, tabela paginada e desativação
// com confirmação. Busca e mudança de filtro recarregam a partir da página 1.

type StatusFilter = "" | "active" | "inactive";

const router = useRouter();
const toast = useToast();

const products = ref<ProductListItemDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Opções dos filtros (a falha na carga não bloqueia a listagem)
const categories = ref<ICategory[]>([]);
const suppliers = ref<ISupplier[]>([]);

const currentPage = ref(1);
const totalPages = ref(1);
const totalProducts = ref(0);
const PAGE_SIZE = 10;

const searchTerm = ref("");
const selectedCategory = ref("");
const selectedSupplier = ref("");
const selectedAvailability = ref<AvailabilityType | "">("");
const selectedStatus = ref<StatusFilter>("");

// Desativação (soft delete)
const productToDelete = ref<ProductListItemDto | null>(null);
const actionLoading = ref(false);

const hasActiveFilters = computed(
  () =>
    searchTerm.value.trim() !== "" ||
    selectedCategory.value !== "" ||
    selectedSupplier.value !== "" ||
    selectedAvailability.value !== "" ||
    selectedStatus.value !== "",
);

const toOptions = (items: { id: string; name: string }[]): UiSelectOption[] =>
  items.map((item) => ({ value: item.id, label: item.name }));

const filtros = computed(() => [
  { model: selectedCategory, label: "categoria", placeholder: "Todas as Categorias", options: toOptions(categories.value) },
  { model: selectedSupplier, label: "fornecedor", placeholder: "Todos os Fornecedores", options: toOptions(suppliers.value) },
  {
    model: selectedAvailability,
    label: "disponibilidade",
    placeholder: "Toda Disponibilidade",
    options: AVAILABILITY_OPTIONS.map(({ value, label }) => ({ value, label })),
  },
  {
    model: selectedStatus,
    label: "status",
    placeholder: "Todos os Status",
    options: [
      { value: "active", label: "Ativos" },
      { value: "inactive", label: "Inativos" },
    ],
  },
]);

const categoryNames = computed(() => new Map(categories.value.map((c) => [c.id, c.name])));
const supplierNames = computed(() => new Map(suppliers.value.map((s) => [s.id, s.name])));

/** Nome pelo id; se a carga das opções falhou, usa o id truncado. */
function nomePorId(names: Map<string, string>, id: string | null): string {
  if (!id) return "—";
  return names.get(id) ?? `${id.slice(0, 8)}…`;
}

async function carregarOpcoesDeFiltro() {
  const [categoriasResult, fornecedoresResult] = await Promise.allSettled([
    categoriasApi.listar({ limit: 100, active: true }),
    fornecedoresApi.listar({ limit: 100, active: true }),
  ]);
  if (categoriasResult.status === "fulfilled") categories.value = categoriasResult.value.data;
  if (fornecedoresResult.status === "fulfilled") suppliers.value = fornecedoresResult.value.data;
}

async function carregarProdutos(page = 1) {
  loading.value = true;
  error.value = null;
  currentPage.value = page;
  try {
    const params: ProductAdminFilterParams = {
      page,
      limit: PAGE_SIZE,
      search: searchTerm.value.trim() || undefined,
      categoryId: selectedCategory.value || undefined,
      supplierId: selectedSupplier.value || undefined,
      availabilityType: selectedAvailability.value || undefined,
      active: selectedStatus.value === "" ? undefined : selectedStatus.value === "active",
    };
    const response = await produtosApi.listarAdmin(params);
    products.value = response.data;
    currentPage.value = response.pagination.page;
    totalPages.value = response.pagination.totalPages || 1;
    totalProducts.value = response.pagination.total;
  } catch (err: unknown) {
    error.value = apiErrorMessage(err, "Falha ao carregar lista de produtos.");
  } finally {
    loading.value = false;
  }
}

function limparFiltros() {
  searchTerm.value = "";
  selectedCategory.value = "";
  selectedSupplier.value = "";
  selectedAvailability.value = "";
  selectedStatus.value = "";
  carregarProdutos(1);
}

async function confirmarExclusao() {
  const target = productToDelete.value;
  if (!target) return;
  actionLoading.value = true;
  try {
    await produtosApi.deletar(target.id);
    const product = products.value.find((p) => p.id === target.id);
    if (product) product.active = false;
    toast.info("Produto desativado com sucesso.");
    productToDelete.value = null;
  } catch (err: unknown) {
    toast.error(apiErrorMessage(err, "Erro ao desativar produto."));
  } finally {
    actionLoading.value = false;
  }
}

const novoProduto = () => router.push("/admin/produtos/novo");

onMounted(() => {
  carregarOpcoesDeFiltro();
  carregarProdutos();
});
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-4">
      <!-- Cabeçalho -->
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <RouterLink
            to="/admin"
            class="mb-1 inline-flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-neutral-dark"
          >
            <Icon icon="mdi:arrow-left" class="h-3.5 w-3.5" />
            Painel Administrativo
          </RouterLink>
          <h1 class="text-xl font-bold tracking-tight text-neutral-dark">Produtos</h1>
          <p class="mt-0.5 text-sm text-stone-500">Catálogo de móveis e decoração, com preços e disponibilidade</p>
        </div>
        <UiButton variant="secondary" size="md" class="shrink-0" @click="novoProduto">
          <Icon icon="mdi:plus" class="h-4 w-4" />
          Novo Produto
        </UiButton>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div class="relative flex-1 lg:max-w-md">
          <Icon icon="mdi:magnify" class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            v-model="searchTerm"
            type="text"
            aria-label="Buscar produtos"
            placeholder="Buscar por nome, linha ou material..."
            class="w-full rounded-lg border border-stone-200 bg-white py-2 pr-3.5 pl-9 text-sm text-neutral-dark transition-colors placeholder:text-stone-400 focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
            @keyup.enter="carregarProdutos(1)"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiSelect
            v-for="filtro in filtros"
            :key="filtro.label"
            v-model="filtro.model.value"
            size="sm"
            :block="false"
            :aria-label="`Filtrar por ${filtro.label}`"
            :placeholder="filtro.placeholder"
            :options="filtro.options"
            @change="carregarProdutos(1)"
          />
          <UiButton variant="outline" size="sm" class="shrink-0 text-xs" @click="carregarProdutos(1)">Buscar</UiButton>
          <UiButton v-if="hasActiveFilters" variant="ghost" size="sm" class="shrink-0 text-xs" @click="limparFiltros">
            <Icon icon="mdi:filter-off-outline" class="h-3.5 w-3.5" />
            Limpar filtros
          </UiButton>
        </div>
      </div>
      <p class="text-xs text-stone-500">{{ totalProducts }} produtos encontrados</p>

      <!-- Carregando, erro, vazio ou tabela -->
      <div v-if="loading" class="flex flex-col items-center gap-2.5 rounded-xl border border-stone-200 bg-white py-16 text-stone-500">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary"></div>
        <span class="text-xs">Carregando produtos...</span>
      </div>

      <div
        v-else-if="error"
        role="alert"
        class="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      >
        <span class="flex items-center gap-2.5">
          <Icon icon="mdi:alert-circle-outline" class="h-5 w-5 shrink-0 text-rose-500" />
          {{ error }}
        </span>
        <UiButton variant="danger" size="sm" class="shrink-0" @click="carregarProdutos(currentPage)">Tentar Novamente</UiButton>
      </div>

      <div v-else-if="products.length === 0" class="rounded-xl border border-stone-200 bg-white px-4 py-14 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
          <Icon icon="mdi:package-variant-closed-remove" class="h-6 w-6" />
        </div>
        <h3 class="text-sm font-semibold text-neutral-dark">Nenhum produto encontrado</h3>
        <p class="mx-auto mt-1 max-w-sm text-xs text-stone-500">
          {{ hasActiveFilters ? "Nenhum resultado corresponde aos filtros aplicados." : "Ainda não há produtos cadastrados." }}
        </p>
        <UiButton v-if="hasActiveFilters" variant="outline" size="sm" class="mt-3.5" @click="limparFiltros">Limpar filtros</UiButton>
        <UiButton v-else variant="secondary" size="sm" class="mt-3.5" @click="novoProduto">
          <Icon icon="mdi:plus" class="h-3.5 w-3.5" />
          Cadastrar Primeiro Produto
        </UiButton>
      </div>

      <template v-else>
        <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="border-b border-stone-200 bg-stone-50 text-xs font-semibold tracking-wider text-stone-600 uppercase">
                  <th
                    v-for="coluna in ['Produto', 'Categoria', 'Fornecedor', 'Preço', 'Disponibilidade', 'Status']"
                    :key="coluna"
                    class="px-4 py-3"
                  >
                    {{ coluna }}
                  </th>
                  <th class="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-sm">
                <tr v-for="product in products" :key="product.id" class="transition-colors hover:bg-stone-50/60">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="product.thumbnailUrl"
                        :src="toApiAssetUrl(product.thumbnailUrl)"
                        :alt="`Miniatura de ${product.name}`"
                        loading="lazy"
                        class="h-12 w-12 shrink-0 rounded-md border border-stone-200 bg-stone-100 object-cover"
                      />
                      <span v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-400" title="Sem foto">
                        <Icon icon="mdi:image-off-outline" class="h-5 w-5" />
                      </span>
                      <div class="min-w-0">
                        <p class="truncate font-medium text-neutral-dark">{{ product.name }}</p>
                        <p class="truncate text-xs text-stone-500">{{ product.collectionLine || product.slug }}</p>
                        <p class="truncate text-xs text-stone-400">{{ formatDimensions(product) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-xs text-stone-600">{{ nomePorId(categoryNames, product.categoryId) }}</td>
                  <td class="px-4 py-3 text-xs text-stone-600">{{ nomePorId(supplierNames, product.supplierId) }}</td>
                  <td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-neutral-dark">{{ formatCurrencyBRL(product.referencePrice) }}</td>
                  <td class="px-4 py-3 text-xs text-stone-600">{{ availabilityLabel(product) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="product.active ? 'bg-emerald-500' : 'bg-stone-400'"></span>
                      {{ product.active ? "Ativo" : "Inativo" }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="inline-flex items-center gap-1">
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:bg-sky-50 hover:text-secondary"
                        title="Editar Produto"
                        aria-label="Editar Produto"
                        @click="router.push(`/admin/produtos/${product.id}/editar`)"
                      >
                        <Icon icon="mdi:pencil-outline" class="h-4 w-4" />
                      </UiButton>
                      <UiButton
                        v-if="product.active"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Desativar Produto"
                        aria-label="Desativar Produto"
                        @click="productToDelete = product"
                      >
                        <Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
                      </UiButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <UiPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="totalProducts"
          item-label="produtos"
          :disabled="loading"
          @update:page="carregarProdutos"
        />
      </template>
    </div>

    <!-- Confirmação da desativação -->
    <UiModal
      :open="productToDelete !== null"
      title="Desativar Produto"
      variant="danger"
      :loading="actionLoading"
      @close="productToDelete = null"
      @confirm="confirmarExclusao"
    >
      Deseja desativar
      <strong class="text-neutral-dark">{{ productToDelete?.name }}</strong
      >? As variações e fotos também serão desativadas, mas o histórico é
      mantido.
    </UiModal>
  </div>
</template>
