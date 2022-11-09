import { ipcRenderer, contextBridge } from "electron"

console.log("Preload: loaded")

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  receive: (channel: string, func: CallableFunction) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  },
})
