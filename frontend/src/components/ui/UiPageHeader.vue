<script setup lang="ts">
import { UiPageHeaderProps } from "@/types";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

// Cabeçalho de tela: trilha de navegação, título e descrição. Cada item da
// trilha recebe só `name` e `link`; o item sem link é a página atual. À direita,
// `newAction` desenha o botão padrão de cadastro ("Novo X", ícone de mais) e o
// slot `actions` recebe outras ações da tela.

defineProps<UiPageHeaderProps>();
const router = useRouter();
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <nav
        class="flex items-center gap-1.5 text-xs text-stone-500 mb-2"
        aria-label="Trilha de navegação"
      >
        <template
          v-for="(item, index) in breadcrumbs"
          :key="`${index}-${item.name}`"
        >
          <span v-if="index > 0" aria-hidden="true">/</span>
          <RouterLink
            v-if="item.link"
            :to="item.link"
            class="hover:text-neutral-dark transition-colors"
          >
            {{ item.name }}
          </RouterLink>
          <span
            v-else
            class="text-neutral-dark font-medium"
            aria-current="page"
          >
            {{ item.name }}
          </span>
        </template>
      </nav>

      <h1 class="truncate text-2xl font-bold text-neutral-dark tracking-tight">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm text-stone-500 mt-0.5">
        {{ description }}
      </p>
    </div>

    <div
      v-if="newAction || $slots.actions"
      class="flex shrink-0 items-center gap-2"
    >
      <slot name="actions" />
      <UiButton
        v-if="newAction"
        variant="secondary"
        size="md"
        @click="router.push(newAction.link)"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        <span>{{ newAction.name }}</span>
      </UiButton>
    </div>
  </div>
</template>
