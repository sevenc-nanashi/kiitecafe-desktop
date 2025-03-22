import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import checker from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig((options) => {
  return {
    build: {
      sourcemap: options.mode === "development" ? "inline" : false,
      rollupOptions: { input: { index: "./index.html" } },
    },
    resolve: {
      alias: {
        vue: "vue/dist/vue.esm-bundler.js",
        "~": import.meta.dirname,
        "package.json": import.meta.dirname + "/package.json",
      },
    },
    plugins: [
      tsconfigPaths(),
      checker({ vueTsc: true }),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.includes("-") || tag === "webview",
          },
        },
      }),
      electron([
        {
          entry: {
            main: "./src-electron/main.ts",
          },
          vite: {
            build: { outDir: "dist" },
            plugins: [vue(), tsconfigPaths()],
          },
        },
        {
          vite: {
            build: {
              outDir: "dist",
              rollupOptions: {
                input: {
                  preload: "./src/preload.ts",
                  injectPreload: "./src/inject",
                  miniPlayerPreload: "./src/miniplayer/preload.ts",
                },
                output: { format: "cjs", entryFileNames: "[name].js" },
                external: ["electron"],
              },
            },
            plugins: [vue(), tsconfigPaths()],
          },
        },
      ]),
    ],
  };
});
