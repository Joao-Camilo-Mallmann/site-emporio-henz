import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    // Só o controller chama a validação (backend/agents.md, seção 6).
    files: ["src/modules/**/*.service.ts", "src/modules/**/*.repository.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/*.schema", "*.schema"],
              message:
                "Service e repository não importam schema: a validação é chamada pelo controller.",
            },
          ],
        },
      ],
    },
  },
];
