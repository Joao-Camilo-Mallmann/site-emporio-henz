<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, onUnmounted, ref } from "vue";

interface Props {
  name: string;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const popoverRef = ref<HTMLElement | null>(null);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("cancel");
  }
}

function handleClickOutside(event: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    emit("cancel");
  }
}

onMounted(() => {
  // Pequeno timeout para não capturar o próprio clique de abertura
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
  }, 10);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    ref="popoverRef"
    class="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-64 p-3 bg-white rounded-xl border border-stone-200 shadow-lg text-left animate-in fade-in zoom-in-95 duration-150"
    role="dialog"
    aria-label="Confirmar desativação do subtipo"
  >
    <!-- Seta do popover -->
    <div
      class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-stone-200 rotate-45"
    ></div>

    <div class="relative z-10 space-y-2.5">
      <div class="flex items-start gap-2">
        <div class="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon icon="mdi:alert-circle-outline" class="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <h4 class="text-xs font-semibold text-neutral-dark">
            Desativar subtipo?
          </h4>
          <p class="text-[11px] text-stone-500 mt-0.5 leading-snug">
            <strong class="font-medium text-neutral-dark">{{ name }}</strong> ficará inativo e oculto no catálogo público.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
        <UiButton
          type="button"
          variant="outline"
          size="xs"
          :disabled="loading"
          @click="emit('cancel')"
        >
          Cancelar
        </UiButton>
        <UiButton
          type="button"
          variant="danger"
          size="xs"
          :loading="loading"
          @click="emit('confirm')"
        >
          Desativar
        </UiButton>
      </div>
    </div>
  </div>
</template>
