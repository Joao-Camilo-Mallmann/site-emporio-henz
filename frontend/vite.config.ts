import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import Components from "unplugin-vue-components/vite";
import { defineConfig, type Plugin } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import { invalidateTypeCache } from "vue/compiler-sfc";

const typesDir = fileURLToPath(new URL("./src/types", import.meta.url));

/**
 * O compilador de SFC guarda em cache os tipos usados em `defineProps<...>()`.
 * Num barrel com `export * from "./x"` (como `src/types/index.ts`), ele copia
 * os tipos de `x` para o cache do barrel; quando só `x` muda, o barrel fica com
 * a cópia velha e um tipo novo dá "Unresolvable type reference" até reiniciar
 * o dev server. Este plugin limpa o cache de todos os arquivos de
 * `src/types/` sempre que um deles muda.
 */
function invalidarCacheDeTipos(): Plugin {
  const prefixo = typesDir.replaceAll("\\", "/");
  return {
    name: "emporio:invalidar-cache-de-tipos",
    apply: "serve",
    watchChange(id) {
      if (!id.replaceAll("\\", "/").startsWith(prefixo)) return;
      for (const file of readdirSync(typesDir)) {
        invalidateTypeCache(resolve(typesDir, file));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  envDir: "../",
  plugins: [
    invalidarCacheDeTipos(),
    vue(),
    Components({
      dirs: ["src/components"],
      extensions: ["vue"],
      deep: true,
      dts: "src/components.d.ts",
      resolvers: [
        (componentName) => {
          if (componentName === "Icon" || componentName === "UiIcon") {
            return { name: "Icon", from: "@iconify/vue" };
          }
        },
      ],
    }),
    tailwindcss(),
    vueDevTools({ launchEditor: "code" }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
