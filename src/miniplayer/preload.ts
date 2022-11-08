import { ipcRenderer, contextBridge } from "electron";

console.log("Preload: loaded");

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: any) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
