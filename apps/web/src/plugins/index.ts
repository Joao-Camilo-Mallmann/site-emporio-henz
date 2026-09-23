import router from "@/router";
import { Icon } from "@iconify/vue";
import type { App } from "vue";
import pinia from "./pinia";

export function registerPlugins(app: App): void {
  app.use(pinia);
  app.use(router);
  // eslint-disable-next-line vue/multi-word-component-names
  app.component("Icon", Icon);
  app.component("UiIcon", Icon);
}

export * from "./axios";
export * from "./pinia";
