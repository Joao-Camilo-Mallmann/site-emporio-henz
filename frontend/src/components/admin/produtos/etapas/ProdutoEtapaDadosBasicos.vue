<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import type { Subtype, UiSelectOption } from "@/types";
import {
  FIELD_IDS,
  HINT_CLASS,
  TEXT_MAX_LENGTH,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, watch } from "vue";

// Etapa 1 do formulário de produto: nome, slug, categoria, subtipo,
// fornecedor, linha, material, descrição e status no catálogo. O slug acompanha o nome até ser
// editado, e trocar a categoria limpa o subtipo escolhido.

const store = useProdutoFormStore();
const { form, categories, suppliers, locked, supplierLocked, noSupplier } =
  storeToRefs(store);
const { fieldError, describedBy } = store;

const categoryOptions = computed<UiSelectOption[]>(() =>
  categories.value.map((category) => ({
    value: category.id,
    label: category.name,
  })),
);

// Subtipos da categoria escolhida.
const subtypeOptions = computed<Subtype[]>(
  () =>
    categories.value.find((category) => category.id === form.value.categoryId)
      ?.subtypes ?? [],
);

const subtypeSelectOptions = computed<UiSelectOption[]>(() =>
  subtypeOptions.value.map((subtype) => ({
    value: subtype.id,
    label: subtype.name,
  })),
);

const supplierOptions = computed<UiSelectOption[]>(() =>
  suppliers.value.map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
  })),
);

// Slug acompanha o nome até o usuário editá-lo.
watch(
  () => form.value.name,
  (name) => {
    if (!form.value.slugEdited) form.value.slug = slugify(name);
  },
);

function onSlugInput() {
  form.value.slugEdited = true;
}

function regenerateSlug() {
  form.value.slugEdited = false;
  form.value.slug = slugify(form.value.name);
}

// Trocar a categoria limpa o subtipo escolhido.
watch(
  () => form.value.categoryId,
  (current, previous) => {
    if (current !== previous) form.value.subtypeId = "";
  },
);
</script>

<template>
  <ProdutoEtapaCartao
    id="secao-dados-basicos"
    :numero="1"
    titulo="Dados básicos"
    descricao="Identificação do móvel, onde ele aparece no catálogo e quem o fabrica."
  >
    <fieldset
      :disabled="locked"
      class="min-w-0 grid grid-cols-1 sm:grid-cols-6 gap-x-4 gap-y-3"
    >
      <!-- Nome -->
      <div class="sm:col-span-3">
        <UiInput
          :id="FIELD_IDS.name"
          v-model="form.name"
          type="text"
          label="Nome do produto *"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: Roupeiro Roma 6 Portas"
          aria-required="true"
          :error="fieldError(FIELD_IDS.name)"
        />
      </div>

      <!-- Slug -->
      <div class="sm:col-span-3">
        <UiInput
          :id="FIELD_IDS.slug"
          v-model="form.slug"
          type="text"
          label="Slug (identificador na URL) *"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: roupeiro-roma-6-portas"
          spellcheck="false"
          autocomplete="off"
          aria-required="true"
          class="font-mono text-xs!"
          :error="fieldError(FIELD_IDS.slug)"
          @input="onSlugInput"
        >
          <template #hint>
            <span class="flex flex-wrap items-center gap-x-2">
              <span v-if="form.slugEdited">Slug editado manualmente.</span>
              <span v-else
                >Gerado a partir do nome. Edite se quiser outro endereço.</span
              >
              <UiButton
                v-if="form.slugEdited && !locked"
                variant="link"
                size="none"
                class="text-xs"
                @click="regenerateSlug"
              >
                Gerar do nome novamente
              </UiButton>
            </span>
          </template>
        </UiInput>
      </div>

      <!-- Categoria -->
      <div class="sm:col-span-2">
        <UiSelect
          :id="FIELD_IDS.categoryId"
          v-model="form.categoryId"
          label="Categoria"
          required
          placeholder="Selecione a categoria"
          placeholder-disabled
          :options="categoryOptions"
          :error="fieldError(FIELD_IDS.categoryId)"
          :hint="
            categories.length === 0
              ? 'Nenhuma categoria ativa cadastrada.'
              : undefined
          "
        />
      </div>

      <!-- Subtipo -->
      <div class="sm:col-span-2">
        <UiSelect
          :id="FIELD_IDS.subtypeId"
          v-model="form.subtypeId"
          label="Subtipo"
          placeholder="Sem subtipo"
          :options="subtypeSelectOptions"
          :disabled="!form.categoryId"
          :error="fieldError(FIELD_IDS.subtypeId)"
          :hint="form.categoryId ? undefined : 'Escolha a categoria primeiro.'"
        />
      </div>

      <!-- Fornecedor -->
      <div class="sm:col-span-2">
        <UiSelect
          :id="FIELD_IDS.supplierId"
          v-model="form.supplierId"
          label="Fornecedor / fabricante"
          required
          placeholder="Selecione o fornecedor"
          placeholder-disabled
          :options="supplierOptions"
          :disabled="supplierLocked || noSupplier"
          :error="fieldError(FIELD_IDS.supplierId)"
          :aria-describedby="
            describedBy(FIELD_IDS.supplierId, `${FIELD_IDS.supplierId}-hint`)
          "
        />
        <div :id="`${FIELD_IDS.supplierId}-hint`">
          <p
            v-if="noSupplier"
            role="alert"
            class="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <Icon icon="mdi:alert-outline" class="w-4 h-4 shrink-0" />
            <span>
              Seu usuário não tem empresa vinculada. Peça a um administrador
              para vincular você a um fornecedor antes de cadastrar produtos.
            </span>
          </p>
          <p
            v-else-if="supplierLocked"
            :class="[HINT_CLASS, 'flex items-center gap-1.5']"
          >
            <Icon icon="mdi:lock-outline" class="w-3.5 h-3.5" />
            Empresa vinculada ao seu usuário.
          </p>
          <p v-else-if="suppliers.length === 0" :class="HINT_CLASS">
            Nenhum fornecedor ativo cadastrado.
          </p>
        </div>
      </div>

      <!-- Linha / coleção -->
      <div class="sm:col-span-3">
        <UiInput
          :id="FIELD_IDS.collectionLine"
          v-model="form.collectionLine"
          type="text"
          label="Linha / coleção"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: Linha Itália"
          :error="fieldError(FIELD_IDS.collectionLine)"
        />
      </div>

      <!-- Material principal -->
      <div class="sm:col-span-3">
        <UiInput
          :id="FIELD_IDS.mainMaterial"
          v-model="form.mainMaterial"
          type="text"
          label="Material principal"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: MDF 18mm"
          :error="fieldError(FIELD_IDS.mainMaterial)"
        />
      </div>

      <!-- Descrição -->
      <div class="sm:col-span-6">
        <UiTextarea
          :id="FIELD_IDS.description"
          v-model="form.description"
          rows="3"
          label="Descrição"
          placeholder="Conte o que torna o móvel especial: materiais, uso e diferenciais."
        />
      </div>

      <!-- Status no catálogo -->
      <label
        :for="FIELD_IDS.active"
        class="sm:col-span-6 flex items-start gap-3 cursor-pointer select-none border-t border-stone-100 pt-5"
      >
        <input
          :id="FIELD_IDS.active"
          v-model="form.active"
          type="checkbox"
          class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
        />
        <span>
          <span class="text-sm font-medium text-neutral-dark block"
            >Produto ativo no catálogo</span
          >
          <span class="text-xs text-stone-500 block mt-0.5">
            Produtos inativos ficam guardados no painel e não aparecem para os
            clientes.
          </span>
        </span>
      </label>
    </fieldset>
  </ProdutoEtapaCartao>
</template>
