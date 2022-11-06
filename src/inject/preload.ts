import { ipcRenderer } from "electron";
import style from "./style.css";

console.log("Preload: loaded");
setTimeout(() => {
  if (location.pathname.includes("intro")) {
    // document.querySelector(".goto_kiite_login_button")!.click();
    location.href = "https://kiite.jp/login?mode=cafe";
  }
}, 0);
document.addEventListener("DOMContentLoaded", () => {
  const styleElement = document.createElement("style");
  styleElement.textContent = style.toString();
  document.head.appendChild(styleElement);
});
