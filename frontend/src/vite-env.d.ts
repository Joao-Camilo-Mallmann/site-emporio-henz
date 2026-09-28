/// <reference types="vite/client" />

declare module "vue" {
  interface ComponentCustomProperties {
    $toast: typeof import("vue3-toastify").toast;
  }
}

export {};


