import type { App } from "vue";
import pinia from "./pinia";
import router from "@/router";

export function registerPlugins(app: App): void {
  app.use(pinia);
  app.use(router);
}

export * from "./axios";
export * from "./pinia";
