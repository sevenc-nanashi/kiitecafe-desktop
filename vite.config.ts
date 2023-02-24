import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import checker from "vite-plugin-checker"
import tsconfigPaths from "vite-tsconfig-paths"

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
      "~": __dirname,
      "package.json": __dirname + "/package.json",
    },
  },
  plugins: [
    tsconfigPaths(),
    checker({
      eslint: {
        lintCommand: "eslint --ext .js,.ts,.vue",
      },
      typescript: true,
      vueTsc: true,
    }),
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
        preload: "./src/preload.ts",
        injectPreload: "./src/inject",
        miniPlayerPreload: "./src/miniplayer/preload.ts",
      },

      vite: {
        build: {
          outDir: "dist",
        },
        plugins: [vue(), tsconfigPaths()],
      },
    }),
  ],
})
