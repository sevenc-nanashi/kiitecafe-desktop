<script setup lang="ts">
import { watch, ref } from "vue";

const webviewRef = ref<WebviewTag>();

const params = new URLSearchParams(location.search);
const dirname = params.get("dirname");
const preloadPath = dirname + "/injectPreload.js";
const preloadUrl = new URL(preloadPath, "file://").toString();

watch(webviewRef, async (webview) => {
  if (webview) {
    if (import.meta.env.DEV) {
      webview.addEventListener("dom-ready", (e) => {
        /* webview.openDevTools(); */
      });
    }
    webview.addEventListener("ipc-message", (e) => {
      console.log(e.channel, e.args);
    });
    webview.addEventListener("dom-ready", () => {
      webview.send("sendDocument")
    });
  }
});
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  unmounted() {
    webviewRef.value?.closeDevTools();
  },
});
</script>

<template>
  <div>
    <webview
      src="https://cafe.kiite.jp/"
      ref="webviewRef"
      :preload="preloadUrl"
    />
  </div>
</template>

<style scoped>
webview {
  position: absolute;
  inset: 0;
}
</style>
