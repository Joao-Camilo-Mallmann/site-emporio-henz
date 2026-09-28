import UiButton from "@/components/ui/UiButton.vue";
import UiFloatingActions from "@/components/ui/UiFloatingActions.vue";
import UiFloatingButton from "@/components/ui/UiFloatingButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import router from "@/router";
import { Icon } from "@iconify/vue";
import type { App } from "vue";
import Vue3Toastify, { type ToastContainerOptions, toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import pinia from "./pinia";

export function registerPlugins(app: App): void {
  app.use(pinia);
  app.use(router);
  app.use(Vue3Toastify, {
    position: "bottom-right",
    theme: "light",
    autoClose: 3500,
    clearOnUrlChange: false,
  } as ToastContainerOptions);
  app.config.globalProperties.$toast = toast;
  // eslint-disable-next-line vue/multi-word-component-names
  app.component("Icon", Icon);
  app.component("UiIcon", Icon);
  app.component("UiButton", UiButton);
  app.component("UiModal", UiModal);
  app.component("UiFloatingButton", UiFloatingButton);
  app.component("UiFloatingActions", UiFloatingActions);
}

export * from "./axios";
export * from "./pinia";

