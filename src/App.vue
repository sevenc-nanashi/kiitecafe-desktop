<script setup lang="ts">
import { watch, ref } from "vue";
import inject from "./inject?url";

const webviewRef = ref<WebviewTag>();

const injectScript = fetch(inject).then((res) => res.text());

watch(webviewRef, async (webview) => {
  const script = await injectScript;
  if (webview) {
    if (import.meta.env.DEV) {
      webview.openDevTools();
    }
    webview.addEventListener("dom-ready", () => {
      webview.executeJavaScript(script);
    });
  }
});
</script>

<template>
  <div>
    <webview src="https://cafe.kiite.jp/" ref="webviewRef" />
  </div>
</template>

<style scoped>
webview {
  position: absolute;
  inset: 0;
}
</style>
