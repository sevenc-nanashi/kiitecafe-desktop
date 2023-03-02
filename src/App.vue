<script setup lang="ts">
import { watch, ref, onUnmounted, onMounted } from "vue"
import { useRouter } from "vue-router"
import CustomSettings from "./inject/CustomSettings.vue"

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
for (const channel of [
  "set-favorite",
  "set-rotating",
  "set-popup-message",
  "get-playlists",
  "add-playlist-song",
  "set-colors",
]) {
  window.electron.receive(channel, (...args: unknown[]) => {
    if (webviewRef.value) {
      webviewRef.value.send(channel, ...args)
    }
  })
}

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

const isSettingOpen = ref(false)
const closeSettings = () => {
  isSettingOpen.value = false
}

window.electron.receive("open-settings", () => {
  isSettingOpen.value = true
})
</script>

<template>
  <div class="root">
    <webview
      ref="webviewRef"
      src="https://kiite.jp/login?mode=cafe"
      :preload="preloadUrl"
      webpreferences="autoplayPolicy=no-user-gesture-required"
      allowpopups
    />

    <div v-if="isSettingOpen" id="settings-popup" @click="closeSettings">
      <div id="settings-popup-content" @click.stop>
        <CustomSettings />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
webview {
  position: absolute;
  inset: 0;
}
.root {
  position: relative;
  width: 100%;
  height: 100%;
}
#settings-popup {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  #settings-popup-content {
    position: relative;
    width: 50%;
    min-width: 300px;
    height: 50%;
    min-height: 400px;
    background: rgba(0, 0, 0, 0.8);
  }
}
</style>
