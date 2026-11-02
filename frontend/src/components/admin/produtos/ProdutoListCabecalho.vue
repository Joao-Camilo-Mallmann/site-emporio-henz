<script setup lang="ts">
import type {
  AvailabilityType,
  ICategory,
  ISupplier,
  UiSelectOption,
} from "@/types";
import { AVAILABILITY_OPTIONS } from "@/utils/admin/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed } from "vue";

// Topo da listagem de produtos: navegação, título, "Novo Produto", barra de
// filtros (busca, selects, ações) e total. Os valores sobem por v-model; a view
// decide quando recarregar a lista e para onde navegar.

type StatusFilter = "" | "active" | "inactive";

const searchTerm = defineModel<string>("search", { required: true });
const selectedCategory = defineModel<string>("category", { required: true });
const selectedSupplier = defineModel<string>("supplier", { required: true });
const selectedAvailability = defineModel<AvailabilityType | "">("availability", {
  required: true,
});
const selectedStatus = defineModel<StatusFilter>("status", { required: true });

const props = defineProps<{
  categories: ICategory[];
  suppliers: ISupplier[];
  total: number;
  hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "create"): void;
  /** Busca por texto ou mudança de filtro: recarrega a partir da página 1. */
  (e: "search"): void;
  (e: "clear"): void;
}>();

const categoryOptions = computed<UiSelectOption[]>(() =>
  props.categories.map((category) => ({ value: category.id, label: category.name })),
);

const supplierOptions = computed<UiSelectOption[]>(() =>
  props.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
);

const availabilityOptions: UiSelectOption[] = AVAILABILITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const statusOptions: UiSelectOption[] = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Navegação superior e cabeçalho -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <UiButton
          variant="custom"
          size="none"
          class="inline-flex items-center gap-1.5 text-xs font-normal text-stone-500 hover:text-neutral-dark transition-colors mb-2"
          @click="emit('back')"
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
        @click="emit('create')"
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
            @keyup.enter="emit('search')"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiSelect
            v-model="selectedCategory"
            size="sm"
            :block="false"
            aria-label="Filtrar por categoria"
            placeholder="Todas as Categorias"
            :options="categoryOptions"
            @change="emit('search')"
          />
          <UiSelect
            v-model="selectedSupplier"
            size="sm"
            :block="false"
            aria-label="Filtrar por fornecedor"
            placeholder="Todos os Fornecedores"
            :options="supplierOptions"
            @change="emit('search')"
          />
          <UiSelect
            v-model="selectedAvailability"
            size="sm"
            :block="false"
            aria-label="Filtrar por disponibilidade"
            placeholder="Toda Disponibilidade"
            :options="availabilityOptions"
            @change="emit('search')"
          />
          <UiSelect
            v-model="selectedStatus"
            size="sm"
            :block="false"
            aria-label="Filtrar por status"
            placeholder="Todos os Status"
            :options="statusOptions"
            @change="emit('search')"
          />

          <UiButton
            variant="outline"
            size="sm"
            class="shrink-0 text-xs"
            @click="emit('search')"
          >
            Buscar
          </UiButton>
          <UiButton
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            class="shrink-0 text-xs"
            @click="emit('clear')"
          >
            <Icon icon="mdi:filter-off-outline" class="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </UiButton>
        </div>
      </div>

      <div class="text-xs text-stone-500">
        <span>{{ total }} produtos encontrados</span>
      </div>
    </div>
  </div>
</template>
