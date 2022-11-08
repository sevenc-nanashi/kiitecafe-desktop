import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "./index.html",
      },
    },
  },
  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
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
        miniPlayerPreload: "./src/miniplayer/preload.ts",
      },
      vite: {
        build: {
          outDir: "dist",
        },
      },
    }),
  ],
});
