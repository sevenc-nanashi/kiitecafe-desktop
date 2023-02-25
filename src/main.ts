import { createApp } from "vue"
import {
  createWebHistory,
  createRouter,
  createWebHashHistory,
} from "vue-router"
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
  history: import.meta.env.PROD ? createWebHashHistory() : createWebHistory(),
  routes: [
    { path: "/", component: () => App },
    { path: "/mini-player", component: () => MiniPlayerApp },
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
  ],
})

createApp({}).use(router).mount("#app")
