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
import { toApiAssetUrl } from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  AVAILABILITY_OPTIONS,
  availabilityLabel,
  formatCurrencyBRL,
  formatDimensions,
} from "./formulario/produtoDraft";

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

const categoryNames = computed(
  () => new Map(categories.value.map((c) => [c.id, c.name])),
);
const supplierNames = computed(
  () => new Map(suppliers.value.map((s) => [s.id, s.name])),
);

const hasActiveFilters = computed(
  () =>
    searchTerm.value.trim() !== "" ||
    selectedCategory.value !== "" ||
    selectedSupplier.value !== "" ||
    selectedAvailability.value !== "" ||
    selectedStatus.value !== "",
);

function truncarId(id: string): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}

/** Nome da categoria; se a carga das opções falhou, usa o id truncado. */
function categoriaNome(id: string): string {
  return categoryNames.value.get(id) ?? truncarId(id);
}

/** Nome do fornecedor; se a carga das opções falhou, usa o id truncado. */
function fornecedorNome(id: string | null): string {
  if (!id) return "—";
  return supplierNames.value.get(id) ?? truncarId(id);
}

function mensagemDeErro(err: unknown, fallback: string): string {
  const errorObj = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return errorObj.response?.data?.message || errorObj.message || fallback;
}

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
    error.value = mensagemDeErro(err, "Falha ao carregar lista de produtos.");
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
    toast.error(mensagemDeErro(err, "Erro ao desativar produto."));
  } finally {
    actionLoading.value = false;
  }
}

const selectClass =
  "px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-neutral-dark focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors cursor-pointer";

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
      <!-- Navegação superior e cabeçalho -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <UiButton
            variant="custom"
            size="none"
            class="inline-flex items-center gap-1.5 text-xs font-normal text-stone-500 hover:text-neutral-dark transition-colors mb-2"
            @click="router.push('/admin')"
          >
            <Icon icon="mdi:arrow-left" class="w-3.5 h-3.5" />
            <span>Painel Administrativo</span>
          </UiButton>
          <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
            Produtos
          </h1>
          <p class="text-sm text-stone-500 mt-0.5">
            Catálogo de móveis e decoração, com preços e disponibilidade
          </p>
        </div>

        <UiButton
          variant="secondary"
          size="md"
          class="shrink-0"
          @click="router.push('/admin/produtos/novo')"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          <span>Novo Produto</span>
        </UiButton>
      </div>

      <!-- Barra de filtros e totais -->
      <div class="space-y-3">
        <div class="flex flex-col lg:flex-row lg:items-center gap-2">
          <div class="relative flex-1 lg:max-w-md">
            <span
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400"
            >
              <Icon icon="mdi:magnify" class="w-4 h-4" />
            </span>
            <input
              v-model="searchTerm"
              type="text"
              aria-label="Buscar produtos"
              placeholder="Buscar por nome, linha ou material..."
              class="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
              @keyup.enter="handleSearch"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="selectedCategory"
              aria-label="Filtrar por categoria"
              :class="selectClass"
              @change="handleSearch"
            >
              <option value="">Todas as Categorias</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>

            <select
              v-model="selectedSupplier"
              aria-label="Filtrar por fornecedor"
              :class="selectClass"
              @change="handleSearch"
            >
              <option value="">Todos os Fornecedores</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>

            <select
              v-model="selectedAvailability"
              aria-label="Filtrar por disponibilidade"
              :class="selectClass"
              @change="handleSearch"
            >
              <option value="">Toda Disponibilidade</option>
              <option
                v-for="opt in AVAILABILITY_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <select
              v-model="selectedStatus"
              aria-label="Filtrar por status"
              :class="selectClass"
              @change="handleSearch"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <UiButton
              variant="outline"
              size="sm"
              class="shrink-0 text-xs"
              @click="handleSearch"
            >
              Buscar
            </UiButton>
            <UiButton
              v-if="hasActiveFilters"
              variant="ghost"
              size="sm"
              class="shrink-0 text-xs"
              @click="limparFiltros"
            >
              <Icon icon="mdi:filter-off-outline" class="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </UiButton>
          </div>
        </div>

        <div class="text-xs text-stone-500">
          <span>{{ totalProducts }} produtos encontrados</span>
        </div>
      </div>

      <!-- Estado de carregamento -->
      <div
        v-if="loading"
        class="py-16 bg-white rounded-xl border border-stone-200 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando produtos...</span>
      </div>

      <!-- Estado de erro -->
      <div
        v-else-if="error"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon
            icon="mdi:alert-circle-outline"
            class="w-5 h-5 text-rose-500 shrink-0"
          />
          <span>{{ error }}</span>
        </div>
        <UiButton
          variant="danger"
          size="sm"
          class="shrink-0"
          @click="carregarProdutos(currentPage)"
        >
          Tentar Novamente
        </UiButton>
      </div>

      <!-- Estado vazio -->
      <div
        v-else-if="products.length === 0"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:package-variant-closed-remove" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-neutral-dark">
          Nenhum produto encontrado
        </h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {{
            hasActiveFilters
              ? "Nenhum resultado corresponde aos filtros aplicados."
              : "Ainda não há produtos cadastrados."
          }}
        </p>
        <UiButton
          v-if="hasActiveFilters"
          variant="outline"
          size="sm"
          class="mt-3.5"
          @click="limparFiltros"
        >
          Limpar filtros
        </UiButton>
        <UiButton
          v-else
          variant="secondary"
          size="sm"
          class="mt-3.5"
          @click="router.push('/admin/produtos/novo')"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Cadastrar Primeiro Produto</span>
        </UiButton>
      </div>

      <!-- Tabela e paginação -->
      <div v-else class="space-y-4">
        <div
          class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider"
                >
                  <th class="py-3 px-4">Produto</th>
                  <th class="py-3 px-4">Categoria</th>
                  <th class="py-3 px-4">Fornecedor</th>
                  <th class="py-3 px-4">Preço</th>
                  <th class="py-3 px-4">Disponibilidade</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-sm">
                <tr
                  v-for="product in products"
                  :key="product.id"
                  class="hover:bg-stone-50/60 transition-colors"
                >
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="product.thumbnailUrl"
                        :src="toApiAssetUrl(product.thumbnailUrl)"
                        :alt="`Miniatura de ${product.name}`"
                        loading="lazy"
                        class="w-12 h-12 rounded-md object-cover border border-stone-200 bg-stone-100 shrink-0"
                      />
                      <span
                        v-else
                        class="w-12 h-12 rounded-md bg-stone-100 text-stone-400 flex items-center justify-center shrink-0"
                        title="Sem foto"
                      >
                        <Icon icon="mdi:image-off-outline" class="w-5 h-5" />
                      </span>
                      <div class="min-w-0">
                        <p class="font-medium text-neutral-dark truncate">
                          {{ product.name }}
                        </p>
                        <p class="text-xs text-stone-500 truncate">
                          {{ product.collectionLine || product.slug }}
                        </p>
                        <p class="text-xs text-stone-400 truncate">
                          {{ formatDimensions(product) }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-stone-600 text-xs">
                    {{ categoriaNome(product.categoryId) }}
                  </td>
                  <td class="py-3 px-4 text-stone-600 text-xs">
                    {{ fornecedorNome(product.supplierId) }}
                  </td>
                  <td
                    class="py-3 px-4 text-neutral-dark text-sm font-medium whitespace-nowrap"
                  >
                    {{ formatCurrencyBRL(product.referencePrice) }}
                  </td>
                  <td class="py-3 px-4 text-stone-600 text-xs">
                    {{ availabilityLabel(product) }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="
                        product.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      "
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        :class="
                          product.active ? 'bg-emerald-500' : 'bg-stone-400'
                        "
                      ></span>
                      {{ product.active ? "Ativo" : "Inativo" }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="inline-flex items-center gap-1">
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:text-secondary hover:bg-sky-50"
                        title="Editar Produto"
                        aria-label="Editar Produto"
                        @click="
                          router.push(`/admin/produtos/${product.id}/editar`)
                        "
                      >
                        <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                      </UiButton>
                      <UiButton
                        v-if="product.active"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Desativar Produto"
                        aria-label="Desativar Produto"
                        @click="abrirModalExclusao(product)"
                      >
                        <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
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
      </div>
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
