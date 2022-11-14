import { createApp } from "vue"
import {
  createWebHistory,
  createRouter,
  createWebHashHistory,
} from "vue-router"
import "./style.scss"
import App from "./App.vue"
import MiniPlayerApp from "./miniplayer/App.vue"
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
;[
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
].forEach((icon) => library.add(icon))
const routes = [
  { path: "/", component: App },
  { path: "/miniplayer", component: MiniPlayerApp },
]
const router = createRouter({
  history: import.meta.env.PROD ? createWebHashHistory() : createWebHistory(),
  routes,
})

createApp({}).use(router).mount("#app")
