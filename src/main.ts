import { createApp } from "vue";
import { createWebHistory, createRouter } from "vue-router";
import "./style.css";
import App from "./App.vue";
import MiniPlayerApp from "./miniplayer/App.vue";
const routes = [
  { path: "/", component: App },
  { path: "/miniplayer", component: MiniPlayerApp },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp({}).use(router).mount("#app");
