import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.includes('-') || tag === 'webview'
        }
      }
    }),
    electron({
      entry: "./src-electron/main.ts",
    }),
  ],
});
