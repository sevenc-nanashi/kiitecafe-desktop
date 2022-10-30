import * as electron from "electron"

const createWindow = () => {
  const win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  win.loadURL("http://localhost:5173")
}

electron.app.on("ready", createWindow)
