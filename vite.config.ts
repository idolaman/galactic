import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = process.env.VITE_HOST || env.VITE_HOST || "::";
  const port = parseInt(process.env.VITE_PORT || env.VITE_PORT || "8080", 10);

  return {
    base: mode === "development" ? "/" : "./",
    server: {
      host,
      port,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
