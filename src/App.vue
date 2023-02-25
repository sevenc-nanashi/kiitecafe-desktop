<script setup lang="ts">
import { watch, ref, onUnmounted } from "vue"
import { useRouter } from "vue-router"

const webviewRef = ref<WebviewTag>()

const router = useRouter()
const query = router.currentRoute.value.query
const dirname = query.dirname as string
const preloadPath = dirname + "/injectPreload.js"
const preloadUrl = new URL(preloadPath, "file://").toString()

const isMuted = ref(query.muted === "true")
const updateAvailable = ref<
  { tag_name: string; html_url: string } | boolean | null
>(null)

watch(webviewRef, async (webview) => {
  if (webview) {
    if (import.meta.env.DEV) {
      webview.addEventListener("dom-ready", () => {
        webview.openDevTools()
        webviewWithDevTools = webview
      })
    }
    webview.addEventListener("dom-ready", () => {
      window.electron.send("setup-webview", webview.getWebContentsId())
      window.electron.send("get-update-available", null)
      webview.setAudioMuted(isMuted.value)
    })
  }
})

watch(isMuted, (value) => {
  if (webviewRef.value) {
    webviewRef.value.setAudioMuted(value)
  }
})

window.electron.receive("set-muted", (value: boolean) => {
  isMuted.value = value
})
;[
  "set-favorite",
  "set-rotating",
  "set-popup-message",
  "get-playlists",
  "add-playlist-song",
].forEach((name) => {
  window.electron.receive(name, (...args: unknown[]) => {
    if (webviewRef.value) {
      webviewRef.value.send(name, ...args)
    }
  })
})

window.electron.receive("update-available", (value: boolean) => {
  updateAvailable.value = value
  webviewRef.value?.send("information", value, query.url)
})

window.electron.send("set-muted", isMuted.value)

let webviewWithDevTools: WebviewTag | null = null
onUnmounted(() => {
  try {
    webviewWithDevTools?.closeDevTools()
  } catch {}
})
</script>

<template>
  <div>
    <webview
      ref="webviewRef"
      src="https://kiite.jp/login?mode=cafe"
      :preload="preloadUrl"
      webpreferences="autoplayPolicy=no-user-gesture-required"
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
