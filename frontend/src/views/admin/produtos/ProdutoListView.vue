<script setup lang="ts">
import { categoriasApi, fornecedoresApi, produtosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type {
  AvailabilityType,
  ICategory,
  ISupplier,
  ProductAdminFilterParams,
  ProductListItemDto,
} from "@/types";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiErrorMessage } from "@/utils/admin/produtos/produtoFormConstantes";

type StatusFilter = "" | "active" | "inactive";

const router = useRouter();
const toast = useToast();

// Estado da listagem
const products = ref<ProductListItemDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Opções dos filtros (a falha na carga não bloqueia a listagem)
const categories = ref<ICategory[]>([]);
const suppliers = ref<ISupplier[]>([]);

// Paginação
const currentPage = ref(1);
const totalPages = ref(1);
const totalProducts = ref(0);
const pageSize = ref(10);

// Filtros
const searchTerm = ref("");
const selectedCategory = ref("");
const selectedSupplier = ref("");
const selectedAvailability = ref<AvailabilityType | "">("");
const selectedStatus = ref<StatusFilter>("");

// Modal de exclusão lógica (soft delete)
const isDeleteModalOpen = ref(false);
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

async function carregarOpcoesDeFiltro() {
  const [categoriasResult, fornecedoresResult] = await Promise.allSettled([
    categoriasApi.listar({ limit: 100, active: true }),
    fornecedoresApi.listar({ limit: 100, active: true }),
  ]);
  if (categoriasResult.status === "fulfilled") {
    categories.value = categoriasResult.value.data;
  }
  if (fornecedoresResult.status === "fulfilled") {
    suppliers.value = fornecedoresResult.value.data;
  }
}

async function carregarProdutos(page = 1) {
  loading.value = true;
  error.value = null;
  currentPage.value = page;

  try {
    const params: ProductAdminFilterParams = {
      page,
      limit: pageSize.value,
      search: searchTerm.value.trim() || undefined,
      categoryId: selectedCategory.value || undefined,
      supplierId: selectedSupplier.value || undefined,
      availabilityType: selectedAvailability.value || undefined,
      active:
        selectedStatus.value === ""
          ? undefined
          : selectedStatus.value === "active",
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

function handleSearch() {
  carregarProdutos(1);
}

function limparFiltros() {
  searchTerm.value = "";
  selectedCategory.value = "";
  selectedSupplier.value = "";
  selectedAvailability.value = "";
  selectedStatus.value = "";
  carregarProdutos(1);
}

function abrirModalExclusao(product: ProductListItemDto) {
  productToDelete.value = product;
  isDeleteModalOpen.value = true;
}

function fecharModalExclusao() {
  isDeleteModalOpen.value = false;
  productToDelete.value = null;
}

async function confirmarExclusao() {
  const target = productToDelete.value;
  if (!target) return;

  actionLoading.value = true;
  try {
    await produtosApi.deletar(target.id);
    const index = products.value.findIndex((p) => p.id === target.id);
    if (index !== -1) {
      products.value[index].active = false;
    }
    toast.info("Produto desativado com sucesso.");
    fecharModalExclusao();
  } catch (err: unknown) {
    toast.error(apiErrorMessage(err, "Erro ao desativar produto."));
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  carregarOpcoesDeFiltro();
  carregarProdutos();
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Cabeçalho, filtros e total -->
      <ProdutoListCabecalho
        v-model:search="searchTerm"
        v-model:category="selectedCategory"
        v-model:supplier="selectedSupplier"
        v-model:availability="selectedAvailability"
        v-model:status="selectedStatus"
        :categories="categories"
        :suppliers="suppliers"
        :total="totalProducts"
        :has-active-filters="hasActiveFilters"
        @back="router.push('/admin')"
        @create="router.push('/admin/produtos/novo')"
        @search="handleSearch"
        @clear="limparFiltros"
      />

      <!-- Carregando, erro, vazio ou tabela com paginação -->
      <ProdutoListTabela
        :products="products"
        :categories="categories"
        :suppliers="suppliers"
        :loading="loading"
        :error="error"
        :has-active-filters="hasActiveFilters"
        @edit="router.push(`/admin/produtos/${$event.id}/editar`)"
        @deactivate="abrirModalExclusao"
        @retry="carregarProdutos(currentPage)"
        @clear="limparFiltros"
        @create="router.push('/admin/produtos/novo')"
      >
        <UiPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="totalProducts"
          item-label="produtos"
          :disabled="loading"
          @update:page="carregarProdutos"
        />
      </ProdutoListTabela>
    </div>

    <!-- Modal de confirmação de exclusão lógica -->
    <UiModal
      :open="isDeleteModalOpen"
      title="Desativar Produto"
      variant="danger"
      :loading="actionLoading"
      @close="fecharModalExclusao"
      @confirm="confirmarExclusao"
    >
      Deseja desativar
      <strong class="text-neutral-dark">{{ productToDelete?.name }}</strong
      >? As variações e fotos também serão desativadas, mas o histórico é
      mantido.
    </UiModal>
  </div>
</template>
