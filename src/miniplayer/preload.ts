import { ipcRenderer, contextBridge } from "electron"

console.log("Preload: loaded")

contextBridge.exposeInMainWorld("electron", {
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args)
  },
  receive: (channel: string, func: CallableFunction) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  },
})
