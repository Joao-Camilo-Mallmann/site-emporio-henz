<script setup lang="ts">
import type {
  FieldErrors,
  ICategory,
  ISubtype,
  ISupplier,
  ProductFormState,
  UiSelectOption,
} from "@/types";
import {
  ERROR_TEXT_CLASS,
  FIELD_IDS,
  fieldClass,
  FORM_SECTIONS,
  HINT_CLASS,
  LABEL_CLASS,
  TEXT_MAX_LENGTH,
} from "@/utils/produtos/produtoFormConstantes";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { computed, watch } from "vue";

// Etapa 1 do formulário de produto: nome, slug, categoria, subtipo,
// fornecedor, linha, material e descrição. O slug acompanha o nome até ser
// editado, e trocar a categoria limpa o subtipo escolhido.

const form = defineModel<ProductFormState>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Etapa visível (a seção fica no DOM e é escondida com `v-show`). */
    visible?: boolean;
    categories: ICategory[];
    suppliers: ISupplier[];
    /** Subtipos da categoria escolhida. */
    subtypeOptions?: ISubtype[];
    errors?: FieldErrors;
    locked?: boolean;
    /** Vendedor com um único vínculo: fornecedor pré-selecionado e travado. */
    supplierLocked?: boolean;
    /** Vendedor sem vínculo: aviso e seletor de fornecedor desabilitado. */
    noSupplier?: boolean;
  }>(),
  {
    visible: true,
    subtypeOptions: () => [],
    errors: () => ({}),
    locked: false,
    supplierLocked: false,
    noSupplier: false,
  },
);

const secao = FORM_SECTIONS[0];

const categoryOptions = computed<UiSelectOption[]>(() =>
  props.categories.map((category) => ({ value: category.id, label: category.name })),
);

const subtypeSelectOptions = computed<UiSelectOption[]>(() =>
  props.subtypeOptions.map((subtype) => ({ value: subtype.id, label: subtype.name })),
);

const supplierOptions = computed<UiSelectOption[]>(() =>
  props.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
);

function fieldError(id: string): string {
  return props.errors[id] ?? "";
}

function describedBy(id: string, hintId?: string): string | undefined {
  const parts = [fieldError(id) ? `${id}-error` : "", hintId ?? ""].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

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
  <section
    v-show="visible"
    :id="secao.id"
    class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
    :aria-labelledby="`${secao.id}-title`"
  >
    <header class="mb-5">
      <h2
        :id="`${secao.id}-title`"
        class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
      >
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
        {{ secao.title }}
      </h2>
      <p class="mt-1 text-xs text-stone-500">
        Identificação do móvel, onde ele aparece no catálogo e quem o fabrica.
      </p>
    </header>

    <fieldset :disabled="locked" class="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Nome -->
      <div class="sm:col-span-2">
        <label :for="FIELD_IDS.name" :class="LABEL_CLASS">Nome do produto *</label>
        <input
          :id="FIELD_IDS.name"
          v-model="form.name"
          type="text"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: Roupeiro Roma 6 Portas"
          aria-required="true"
          :aria-invalid="fieldError(FIELD_IDS.name) ? 'true' : undefined"
          :aria-describedby="describedBy(FIELD_IDS.name)"
          :class="fieldClass(!!fieldError(FIELD_IDS.name))"
        />
        <p v-if="fieldError(FIELD_IDS.name)" :id="`${FIELD_IDS.name}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.name) }}
        </p>
      </div>

      <!-- Slug -->
      <div class="sm:col-span-2">
        <label :for="FIELD_IDS.slug" :class="LABEL_CLASS">Slug (identificador na URL) *</label>
        <input
          :id="FIELD_IDS.slug"
          v-model="form.slug"
          type="text"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: roupeiro-roma-6-portas"
          spellcheck="false"
          autocomplete="off"
          aria-required="true"
          :aria-invalid="fieldError(FIELD_IDS.slug) ? 'true' : undefined"
          :aria-describedby="describedBy(FIELD_IDS.slug, `${FIELD_IDS.slug}-hint`)"
          :class="[fieldClass(!!fieldError(FIELD_IDS.slug)), 'font-mono text-xs']"
          @input="onSlugInput"
        />
        <p v-if="fieldError(FIELD_IDS.slug)" :id="`${FIELD_IDS.slug}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.slug) }}
        </p>
        <p :id="`${FIELD_IDS.slug}-hint`" :class="[HINT_CLASS, 'flex flex-wrap items-center gap-x-2']">
          <span v-if="form.slugEdited">Slug editado manualmente.</span>
          <span v-else>Gerado a partir do nome. Edite se quiser outro endereço.</span>
          <UiButton
            v-if="form.slugEdited && !locked"
            variant="link"
            size="none"
            class="text-xs"
            @click="regenerateSlug"
          >
            Gerar do nome novamente
          </UiButton>
        </p>
      </div>

      <!-- Categoria -->
      <div>
        <UiSelect
          :id="FIELD_IDS.category"
          v-model="form.categoryId"
          label="Categoria"
          required
          placeholder="Selecione a categoria"
          placeholder-disabled
          :options="categoryOptions"
          :error="fieldError(FIELD_IDS.category)"
          :hint="categories.length === 0 ? 'Nenhuma categoria ativa cadastrada.' : undefined"
        />
      </div>

      <!-- Subtipo -->
      <div>
        <UiSelect
          :id="FIELD_IDS.subtype"
          v-model="form.subtypeId"
          label="Subtipo"
          placeholder="Sem subtipo"
          :options="subtypeSelectOptions"
          :disabled="!form.categoryId"
          :error="fieldError(FIELD_IDS.subtype)"
          :hint="form.categoryId ? undefined : 'Escolha a categoria primeiro.'"
        />
      </div>

      <!-- Fornecedor -->
      <div class="sm:col-span-2">
        <UiSelect
          :id="FIELD_IDS.supplier"
          v-model="form.supplierId"
          label="Fornecedor / fabricante"
          required
          placeholder="Selecione o fornecedor"
          placeholder-disabled
          :options="supplierOptions"
          :disabled="supplierLocked || noSupplier"
          :error="fieldError(FIELD_IDS.supplier)"
          :aria-describedby="describedBy(FIELD_IDS.supplier, `${FIELD_IDS.supplier}-hint`)"
        />
        <div :id="`${FIELD_IDS.supplier}-hint`">
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
          <p v-else-if="supplierLocked" :class="[HINT_CLASS, 'flex items-center gap-1.5']">
            <Icon icon="mdi:lock-outline" class="w-3.5 h-3.5" />
            Empresa vinculada ao seu usuário.
          </p>
          <p v-else-if="suppliers.length === 0" :class="HINT_CLASS">
            Nenhum fornecedor ativo cadastrado.
          </p>
        </div>
      </div>

      <!-- Linha / coleção -->
      <div>
        <label :for="FIELD_IDS.collectionLine" :class="LABEL_CLASS">Linha / coleção</label>
        <input
          :id="FIELD_IDS.collectionLine"
          v-model="form.collectionLine"
          type="text"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: Linha Itália"
          :aria-invalid="fieldError(FIELD_IDS.collectionLine) ? 'true' : undefined"
          :aria-describedby="describedBy(FIELD_IDS.collectionLine)"
          :class="fieldClass(!!fieldError(FIELD_IDS.collectionLine))"
        />
        <p v-if="fieldError(FIELD_IDS.collectionLine)" :id="`${FIELD_IDS.collectionLine}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.collectionLine) }}
        </p>
      </div>

      <!-- Material principal -->
      <div>
        <label :for="FIELD_IDS.mainMaterial" :class="LABEL_CLASS">Material principal</label>
        <input
          :id="FIELD_IDS.mainMaterial"
          v-model="form.mainMaterial"
          type="text"
          :maxlength="TEXT_MAX_LENGTH"
          placeholder="Ex.: MDF 18mm"
          :aria-invalid="fieldError(FIELD_IDS.mainMaterial) ? 'true' : undefined"
          :aria-describedby="describedBy(FIELD_IDS.mainMaterial)"
          :class="fieldClass(!!fieldError(FIELD_IDS.mainMaterial))"
        />
        <p v-if="fieldError(FIELD_IDS.mainMaterial)" :id="`${FIELD_IDS.mainMaterial}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.mainMaterial) }}
        </p>
      </div>

      <!-- Descrição -->
      <div class="sm:col-span-2">
        <label :for="FIELD_IDS.description" :class="LABEL_CLASS">Descrição</label>
        <textarea
          :id="FIELD_IDS.description"
          v-model="form.description"
          rows="4"
          placeholder="Conte o que torna o móvel especial: materiais, uso e diferenciais."
          :class="[fieldClass(false), 'resize-y']"
        />
      </div>
    </fieldset>
  </section>
</template>
