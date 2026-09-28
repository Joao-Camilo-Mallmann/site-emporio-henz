<script setup lang="ts">
import type { ModalMaxWidth, ModalVariant, UiModalProps } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, watch } from "vue";

const props = withDefaults(defineProps<UiModalProps>(), {
  open: undefined,
  modelValue: undefined,
  title: "",
  description: "",
  variant: "danger",
  icon: undefined,
  showIcon: true,
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  confirmVariant: undefined,
  loading: false,
  maxWidth: "sm",
  showClose: false,
  showFooter: true,
  showCancel: true,
  closeOnBackdrop: true,
  closeOnEsc: true,
});

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "cancel"): void;
  (e: "confirm"): void;
}>();

const isOpen = computed(() => {
  if (props.open !== undefined) return props.open;
  if (props.modelValue !== undefined) return props.modelValue;
  return false;
});

const effectiveConfirmVariant = computed<ModalVariant>(() => {
  return props.confirmVariant || props.variant;
});

const defaultIcon = computed(() => {
  if (props.icon !== undefined) return props.icon;
  switch (props.variant) {
    case "warning":
      return "mdi:alert-circle-outline";
    case "info":
    case "primary":
      return "mdi:information-outline";
    case "success":
      return "mdi:check-circle-outline";
    case "danger":
    default:
      return "mdi:alert-outline";
  }
});

const iconStyleClasses = computed(() => {
  switch (props.variant) {
    case "warning":
      return "bg-amber-50 text-amber-600";
    case "info":
      return "bg-sky-50 text-secondary";
    case "primary":
      return "bg-primary/10 text-primary";
    case "success":
      return "bg-emerald-50 text-emerald-600";
    case "danger":
    default:
      return "bg-rose-50 text-rose-600";
  }
});

const confirmBtnClasses = computed(() => {
  switch (effectiveConfirmVariant.value) {
    case "warning":
      return "bg-amber-600 hover:bg-amber-700 text-white";
    case "info":
      return "bg-secondary hover:bg-secondary-hover text-white";
    case "primary":
      return "bg-primary hover:bg-primary-dark text-white";
    case "success":
      return "bg-emerald-600 hover:bg-emerald-700 text-white";
    case "danger":
    default:
      return "bg-rose-600 hover:bg-rose-700 text-white";
  }
});

const maxWidthClasses = computed(() => {
  const map: Record<ModalMaxWidth, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };
  return map[props.maxWidth] || "max-w-sm";
});

function handleClose() {
  if (props.loading) return;
  emit("update:open", false);
  emit("update:modelValue", false);
  emit("close");
}

function handleCancel() {
  if (props.loading) return;
  emit("cancel");
  handleClose();
}

function handleConfirm() {
  if (props.loading) return;
  emit("confirm");
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    handleCancel();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && isOpen.value && props.closeOnEsc) {
    handleCancel();
  }
}

let originalOverflow = "";

watch(
  isOpen,
  (val) => {
    if (typeof document === "undefined") return;
    if (val) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeyDown);
  }
  if (typeof document !== "undefined" && isOpen.value) {
    document.body.style.overflow = originalOverflow;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        @click.self="handleBackdropClick"
      >
        <div
          class="bg-white rounded-xl w-full border border-stone-200 shadow-xl space-y-4 p-6 relative transition-all transform"
          :class="maxWidthClasses"
          @click.stop
        >
          <!-- Botão fechar (X) opcional -->
          <button
            v-if="showClose"
            type="button"
            :disabled="loading"
            class="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fechar"
            @click="handleCancel"
          >
            <Icon icon="mdi:close" class="w-4 h-4" />
          </button>

          <!-- Conteúdo com ícone lateral ou formato modal -->
          <div class="flex items-start gap-3">
            <slot name="icon">
              <div
                v-if="showIcon && defaultIcon"
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                :class="iconStyleClasses"
              >
                <Icon :icon="defaultIcon" class="w-5 h-5" />
              </div>
            </slot>

            <div class="flex-1 min-w-0">
              <slot name="header">
                <h3
                  v-if="title"
                  class="text-sm font-semibold text-neutral-dark"
                >
                  {{ title }}
                </h3>
              </slot>

              <div class="mt-1 text-xs text-stone-500 leading-relaxed">
                <slot>
                  <p v-if="description">{{ description }}</p>
                </slot>
              </div>
            </div>
          </div>

          <!-- Rodapé de Ações -->
          <div
            v-if="showFooter"
            class="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100"
          >
            <slot
              name="footer"
              :confirm="handleConfirm"
              :cancel="handleCancel"
              :loading="loading"
            >
              <button
                v-if="showCancel"
                type="button"
                :disabled="loading"
                class="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
                :class="confirmBtnClasses"
                @click="handleConfirm"
              >
                <span
                  v-if="loading"
                  class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                ></span>
                <span>{{ confirmText }}</span>
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
