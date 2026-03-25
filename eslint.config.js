import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".mcp-build-cache"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message: "Use @/hooks/use-app-toast instead of importing Sonner directly.",
            },
            {
              name: "@/components/ui/sonner",
              message: "Use @/hooks/use-app-toast instead of importing the Sonner toast API directly.",
            },
            {
              name: "@/hooks/use-toast",
              message: "Use @/hooks/use-app-toast instead of the raw toast hook.",
            },
            {
              name: "@/components/ui/use-toast",
              message: "Use @/hooks/use-app-toast instead of the raw toast hook.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/App.tsx",
      "src/components/ui/sonner.tsx",
      "src/components/ui/toaster.tsx",
      "src/components/ui/use-toast.ts",
      "src/hooks/use-app-toast.ts",
      "src/hooks/use-toast.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
