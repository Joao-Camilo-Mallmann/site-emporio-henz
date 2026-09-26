<script setup lang="ts">
import type { UiFloatingActionsProps } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(defineProps<UiFloatingActionsProps>(), {
  whatsappNumber: "5551998981063",
  whatsappMessage:
    "Olá, gostaria de informações sobre o catálogo de móveis da Empório Henz.",
  showScrollTop: true,
  showWhatsApp: true,
  scrollThreshold: 280,
});

const isVisibleScrollTop = ref(false);

function handleScroll() {
  isVisibleScrollTop.value = window.scrollY > props.scrollThreshold;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

const whatsappUrl = computed(() => {
  return `https://wa.me/${props.whatsappNumber}?text=${encodeURIComponent(props.whatsappMessage)}`;
});

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    class="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 select-none pointer-events-none"
  >
    <!-- Botão Voltar ao Topo (Scroll to Top) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-75"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-75"
    >
      <button
        v-if="props.showScrollTop && isVisibleScrollTop"
        type="button"
        @click="scrollToTop"
        class="pointer-events-auto w-10 h-10 rounded-full bg-primary hover:bg-secondary text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-90 transition-all duration-200 cursor-pointer group"
        aria-label="Voltar ao topo da página"
        title="Voltar ao topo"
      >
        <Icon
          icon="mdi:arrow-up"
          class="w-5 h-5 text-white transition-transform duration-200 group-hover:-translate-y-0.5"
        />
      </button>
    </Transition>

    <!-- Botão Oficial do WhatsApp (Zap) com estilo do AppFooter -->
    <UiFloatingButton
      v-if="props.showWhatsApp"
      :href="whatsappUrl"
      target="_blank"
      size="lg"
      variant="primary"
      aria-label="Falar pelo WhatsApp com a Empório Henz"
      title="Fale conosco no WhatsApp"
      class="pointer-events-auto"
      icon="mdi:whatsapp"
    />
  </div>
</template>
