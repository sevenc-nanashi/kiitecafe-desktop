import { ipcRenderer } from "electron";
import style from "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const styleElement = document.createElement("style");
  styleElement.textContent = style.toString();
  document.head.appendChild(styleElement);
});
