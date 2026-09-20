import router from "@/router";
import type { App } from "vue";
import pinia from "./pinia";
import { Icon } from "@iconify/vue";

export function registerPlugins(app: App): void {
  app.use(pinia);
  app.use(router);
  // eslint-disable-next-line vue/multi-word-component-names
  app.component("Icon", Icon);
  app.component("UiIcon", Icon);
}

export * from "./axios";
export * from "./pinia";

