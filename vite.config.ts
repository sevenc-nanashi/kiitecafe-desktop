import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      "Access-Control-Allow-Origin": "cafe.kiite.jp",
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes("-") || tag === "webview",
        },
      },
    }),
    electron({
      entry: {
        main: "./src-electron/main.ts",
        injectPreload: "./src/inject",
      },
      vite: {
        build: {
          outDir: "dist"
        }
      }
    }),
  ],
});
