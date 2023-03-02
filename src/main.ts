import { createApp } from "vue"
import { createRouter, createWebHashHistory } from "vue-router"
import "./style.scss"
import { library } from "@fortawesome/fontawesome-svg-core"

import {
  faHeart as faHeartSolid,
  faVolumeMute,
  faVolumeUp,
  faComment,
  faInfo,
  faRotateRight,
  faMessage,
} from "@fortawesome/free-solid-svg-icons"
import {
  faHeart as faHeartRegular,
  faSquareMinus,
} from "@fortawesome/free-regular-svg-icons"
import { faSquareTwitter } from "@fortawesome/free-brands-svg-icons"
import MiniPlayerApp from "./miniplayer/App.vue"
import App from "./App.vue"
import { UpdateAvailable } from "^/type/common"

for (const icon of [
  faHeartSolid,
  faHeartRegular,
  faVolumeMute,
  faVolumeUp,
  faSquareTwitter,
  faComment,
  faSquareMinus,
  faInfo,
  faRotateRight,
  faMessage,
]) {
  library.add(icon)
}
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: App },
    { path: "/mini-player", component: MiniPlayerApp },
    {
      path: "/inject/about",
      props: (route) => ({
        currentVersion: route.query.version as string,
        updateAvailable: JSON.parse(
          route.query.updateAvailable as string
        ) as UpdateAvailable,
      }),
      component: () => import("./inject/AboutDesktop.vue"),
    },
    {
      path: "/inject/history",
      component: () => import("./inject/SelectionHistory.vue"),
    },
    {
      path: "/inject/settings",
      component: () => import("./inject/CustomSettings.vue"),
    },
  ],
})

createApp({}).use(router).mount("#app")

if (typeof window.electron !== "undefined") {
  window.electron.receive("set-colors", (colors: [string, string][]) => {
    for (const [key, value] of colors) {
      document.body.style.setProperty(`--color-${key}`, value)
    }
  })
}

const onMessage = (event: MessageEvent) => {
  if (!Array.isArray(event.data)) {
    return
  }
  console.log("Received message", event.data)
  const [channel, ...args] = event.data
  switch (channel) {
    case "set-colors":
      const [colors] = args as [[string, string][]]
      for (const [name, color] of colors) {
        document.body.style.setProperty(`--color-${name}`, color)
      }

      break
    case "get-settings":
      if (typeof window.electron !== "undefined") {
        window.electron.send("get-settings")
      }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("message", onMessage)
  if (window.parent !== window) {
    window.parent.postMessage(["get-settings"], "*")
  }
})
