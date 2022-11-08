import { createApp } from "vue";
import { createWebHistory, createRouter, createWebHashHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";
import MiniPlayerApp from "./miniplayer/App.vue";
const routes = [
  { path: "/", component: App },
  { path: "/miniplayer", component: MiniPlayerApp },
];
const router = createRouter({
  history: import.meta.env.PROD ? createWebHashHistory() : createWebHistory(),
  routes,
});

createApp({}).use(router).mount("#app");
