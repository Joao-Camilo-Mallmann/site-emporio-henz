<script setup lang="ts">
import type { ICategory, ISupplier, ProductListItemDto } from "@/types";
import {
  availabilityLabel,
  formatCurrencyBRL,
  formatDimensions,
} from "@/utils/produtos/produtoFormConstantes";
import { toApiAssetUrl } from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { computed } from "vue";

// Área de resultados da listagem de produtos: carregando, erro, vazio ou a
// tabela (miniatura, badges de status e ações). O slot é renderizado abaixo da
// tabela (paginação). Ações e navegação saem por emit; o modal fica na view.

const props = defineProps<{
  products: ProductListItemDto[];
  categories: ICategory[];
  suppliers: ISupplier[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
}>();

defineEmits<{
  (e: "edit", product: ProductListItemDto): void;
  (e: "deactivate", product: ProductListItemDto): void;
  (e: "retry"): void;
  (e: "clear"): void;
  (e: "create"): void;
}>();

const categoryNames = computed(
  () => new Map(props.categories.map((c) => [c.id, c.name])),
);
const supplierNames = computed(
  () => new Map(props.suppliers.map((s) => [s.id, s.name])),
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
</script>

<template>
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
      @click="$emit('retry')"
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
      @click="$emit('clear')"
    >
      Limpar filtros
    </UiButton>
    <UiButton
      v-else
      variant="secondary"
      size="sm"
      class="mt-3.5"
      @click="$emit('create')"
    >
      <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
      <span>Cadastrar Primeiro Produto</span>
    </UiButton>
  </div>

  <!-- Tabela e paginação (slot) -->
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
                    :class="product.active ? 'bg-emerald-500' : 'bg-stone-400'"
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
                    @click="$emit('edit', product)"
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
                    @click="$emit('deactivate', product)"
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

    <slot />
  </div>
</template>
