<script setup lang="ts">
import { FORM_SECTIONS } from "@/utils/admin/produtos/produtoFormConstantes";
import { computed } from "vue";

// Cartão comum às etapas do formulário de produto: número, título e descrição.
// A etapa fica no DOM e é escondida com `v-show`, para o foco em campo com erro
// e o envio dos arquivos funcionarem com a etapa fechada.

const props = withDefaults(
  defineProps<{
    /** Índice da etapa em `FORM_SECTIONS`. */
    etapa: number;
    visible?: boolean;
    descricao: string;
  }>(),
  { visible: true },
);

const secao = computed(() => FORM_SECTIONS[props.etapa]);
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
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >{{ etapa + 1 }}</span
        >
        {{ secao.title }}
      </h2>
      <p class="mt-1 text-xs text-stone-500">{{ descricao }}</p>
    </header>

    <slot />
  </section>
</template>
