import * as electron from "electron"
import Store from "electron-store"
import path from "path"

const isDevelopment = import.meta.env.DEV

const store = new Store()
let win: electron.BrowserWindow | null = null
let miniPlayerWin: electron.BrowserWindow | null = null
let tray: electron.Tray | null = null

electron.app.setAppUserModelId("com.sevenc-nanashi.kiitecafe-desktop")

let iconPath: string
const publicDir = isDevelopment ? path.join(__dirname, "../public") : __dirname

if (process.platform === "darwin") {
  iconPath = path.join(publicDir, "mac-icon.png")
} else if (process.platform === "win32") {
  iconPath = path.join(publicDir, "icon.ico")
} else {
  iconPath = path.join(publicDir, "icon.png")
}

const createTray = () => {
  if (tray) {
    return
  }
  let trayIconPath: string
  if (process.platform === "darwin") {
    trayIconPath = path.join(publicDir, "mac-tray-icon.png")
  } else if (process.platform === "win32") {
    trayIconPath = path.join(publicDir, "win-tray-icon.png")
  } else {
    trayIconPath = path.join(publicDir, "icon.png")
  }
  tray = new electron.Tray(trayIconPath)
  if (process.platform === "darwin") {
    tray.setPressedImage(path.join(publicDir, "mac-tray-icon-pressed.png"))
  }
  tray.on("click", () => {
    if (miniPlayerWin) {
      miniPlayerWin.show()
    }
  })
}

const registerWindowOpenHandler = (win: electron.BrowserWindow) => {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" }
    }
    electron.shell.openExternal(url)
    return { action: "deny" }
  })
}

const createMainWindow = () => {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      webviewTag: true,
      preload: `${__dirname}/preload.js`,
    },
  })

  const params = new URLSearchParams()
  params.append("dirname", __dirname)
  if (isDevelopment) {
    win.loadURL("http://localhost:5173?" + params.toString())
    win.webContents.openDevTools({ mode: "detach" })
  } else {
    win.loadURL("app://./index.html?" + params.toString())
  }
  registerWindowOpenHandler(win)
  win.on("close", (_event) => {
    win = null
    miniPlayerWin?.close()
  })

  win.setMenu(null)
}

const createMiniPlayerWindow = () => {
  const width = 810
  const height = 95
  miniPlayerWin = new electron.BrowserWindow({
    width,
    height,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    focusable: false,
    transparent: true,
    icon: iconPath,
    x: electron.screen.getPrimaryDisplay().workAreaSize.width - width,
    y: electron.screen.getPrimaryDisplay().workAreaSize.height - height,
    webPreferences: {
      preload: `${__dirname}/miniPlayerPreload.js`,
    },
  })
  miniPlayerWin.setIgnoreMouseEvents(true, { forward: true })
  miniPlayerWin.setBackgroundColor("#00000000")
  electron.ipcMain.addListener("set-ignore-mouse-events", (_event, ignore) => {
    if (ignore) {
      miniPlayerWin?.setIgnoreMouseEvents(true, { forward: true })
    } else {
      miniPlayerWin?.setIgnoreMouseEvents(false)
    }
  })
  if (isDevelopment) {
    miniPlayerWin.loadURL("http://localhost:5173/miniplayer")
    miniPlayerWin.webContents.openDevTools({ mode: "detach" })
  } else {
    miniPlayerWin.loadURL("app://./index.html#/miniplayer")
  }
  registerWindowOpenHandler(miniPlayerWin)
  miniPlayerWin.on("close", (_event) => {
    miniPlayerWin = null
    win?.close()
  })
}

electron.ipcMain.addListener("now-playing-info", (_event, info) => {
  miniPlayerWin?.webContents.send("now-playing-info", info)
  tray?.setToolTip(`${info.title} - ${info.artist} | Kiite Cafe Desktop`)
  win?.setTitle(`${info.title} - ${info.artist} | Kiite Cafe Desktop`)
})

electron.ipcMain.addListener("setup-webview", (_event, id) => {
  const webview = electron.webContents.fromId(id)
  if (!webview) {
    return
  }
  webview.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" }
    }
    electron.shell.openExternal(url)
    return { action: "deny" }
  })
})
electron.ipcMain.addListener("minimize", () => {
  miniPlayerWin?.hide()
  if (store.get("minimize-info-displayed", false)) {
    return
  }
  const notification = new electron.Notification({
    title: "トレーに最小化されました",
    body: "タスクトレイのアイコンをクリックすると再表示できます。",
    icon: path.join(__dirname, "../public/icon.png"),
  })
  notification.show()
  store.set("minimize-info-displayed", true)
})
;["set-muted", "set-favorite"].forEach((channel) => {
  electron.ipcMain.addListener(channel, (_event, value) => {
    win?.webContents.send(channel, value)
    miniPlayerWin?.webContents.send(channel, value)
  })
})

electron.app.on("ready", () => {
  electron.protocol.registerFileProtocol("app", (request, callback) => {
    const url = new URL(request.url)
    console.log(path.normalize(`${__dirname}/${url.pathname}`))
    callback({ path: path.normalize(`${__dirname}/${url.pathname}`) })
  })
  createTray()
  createMainWindow()
  createMiniPlayerWindow()
})
