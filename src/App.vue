<script setup lang="ts">
import { watch, ref } from "vue";

const webviewRef = ref<WebviewTag>();

const params = new URLSearchParams(location.search);
const dirname = params.get("dirname");
const preloadPath = dirname + "/injectPreload.js";
const preloadUrl = new URL(preloadPath, "file://").toString();

const isMuted = ref(false);

watch(webviewRef, async (webview) => {
  if (webview) {
    if (import.meta.env.DEV) {
      webview.addEventListener("dom-ready", (e) => {
        webview.openDevTools();
      });
    }
    webview.addEventListener("dom-ready", () => {
      window.electron.send("setup-webview", webview.getWebContentsId());
    });
  }
});

watch(isMuted, (value) => {
  if (webviewRef.value) {
    webviewRef.value.setAudioMuted(value);
  }
});

window.electron.receive("set-muted", (value: boolean) => {
  isMuted.value = value;
});

window.electron.receive("set-favorite", (value: boolean) => {
  if (webviewRef.value) {
    webviewRef.value.send("set-favorite", value);
  }
});

window.electron.send("set-muted", isMuted.value);
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
      allowpopups
    />
  </div>
</template>

<style scoped>
webview {
  position: absolute;
  inset: 0;
}
</style>
