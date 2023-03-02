import path from "path"
import * as electron from "electron"
import Store from "electron-store"
import fetch from "node-fetch"
import * as semver from "semver"
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer"
import colorsJs from "@colors/colors"

import colors from "~/colors"
import { version } from "^/package.json"

const isDevelopment = import.meta.env.DEV
if (isDevelopment) {
  colorsJs.enable()
}

const store = new Store()

const getColors = () => {
  const mergedColors = new Map([
    ...(colors.map((color) => [color.name, color.default]) as [
      string,
      string
    ][]),
    ...(store.get("colors", []) as [string, string][]),
  ])
  return Array.from(mergedColors.entries())
}

let win: electron.BrowserWindow | null = null
let miniPlayerWin: electron.BrowserWindow | null = null
let tray: electron.Tray | null = null

if (process.platform === "win32") {
  electron.app.setAppUserModelId("com.sevenc-nanashi.kiitecafe-desktop")
}

let iconPath: string
const publicDir = isDevelopment ? path.join(__dirname, "../public") : __dirname
const url = isDevelopment ? "http://localhost:5173#" : "app://./index.html#"

const logIpc = (
  dest: "renderer" | "miniPlayer" | "main",
  channel: string,
  ...args: unknown[]
) => {
  let text = `[IPC] `.cyan
  if (dest === "renderer") {
    text += `-> ${channel}: `.green
  } else if (dest === "miniPlayer") {
    text += `-> ${channel}: `.yellow
  } else {
    text += `<- ${channel}: `.red
  }

  text += JSON.stringify(args)
  console.log(text)
}
const sendToRenderer = (channel: string, ...args: unknown[]) => {
  logIpc("renderer", channel, ...args)
  win?.webContents.send(channel, ...args)
}
const sendToMiniPlayerRenderer = (channel: string, ...args: unknown[]) => {
  logIpc("miniPlayer", channel, ...args)
  miniPlayerWin?.webContents.send(channel, ...args)
}

if (process.platform === "darwin") {
  iconPath = path.join(publicDir, "mac-icon.png")
} else if (process.platform === "win32") {
  iconPath = path.join(publicDir, "icon.ico")
} else {
  iconPath = path.join(publicDir, "icon-256.png")
}

const createTray = async () => {
  if (tray) {
    return
  }
  let trayIconPath: string
  if (process.platform === "darwin") {
    trayIconPath = path.join(publicDir, "mac-tray-icon.png")
  } else if (process.platform === "win32") {
    trayIconPath = path.join(publicDir, "icon.ico")
  } else {
    trayIconPath = path.join(publicDir, "icon-16.png")
  }
  tray = new electron.Tray(trayIconPath)
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: `Kiite Cafe Desktop: v${version}`,
      enabled: false,
    },
    {
      type: "separator",
    },
    {
      label: "メインウィンドウを表示する",
      click: () => {
        win?.show()
      },
    },
    {
      label: "ミニプレイヤーを表示する",
      click: () => {
        miniPlayerWin?.show()
      },
    },
    {
      type: "separator",
    },
    {
      label: "GitHub",
      click: () => {
        electron.shell.openExternal(
          "https://github.com/sevenc-nanashi/kiitecafe-desktop"
        )
      },
    },
    {
      label: "終了",
      click: () => {
        win?.close()
      },
      role: "quit",
    },
  ])
  tray.setContextMenu(contextMenu)
  if (process.platform === "darwin") {
    tray.setPressedImage(path.join(publicDir, "mac-tray-icon-pressed.png"))
  }
  tray.on("click", () => {
    if (miniPlayerWin) {
      if (miniPlayerWin.isVisible()) {
        win?.show()
      } else {
        miniPlayerWin.show()
      }
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

const createMainWindow = async () => {
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
  params.append("muted", (store.get("muted", false) as boolean).toString())
  params.append("url", url)
  if (isDevelopment) {
    win.webContents.openDevTools({ mode: "detach" })
  }
  win.loadURL(`${url}?${params.toString()}`)

  registerWindowOpenHandler(win)
  win.on("close", (_event) => {
    win = null
    miniPlayerWin?.close()
  })

  win.setMenu(null)
}

const createMiniPlayerWindow = async () => {
  const width = 810
  const height = 95
  miniPlayerWin = new electron.BrowserWindow({
    width,
    height,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
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
  const params = new URLSearchParams()
  params.set("muted", (store.get("muted", false) as boolean).toString())
  miniPlayerWin.loadURL(`${url}/mini-player?${params.toString()}`)
  if (isDevelopment) {
    miniPlayerWin.webContents.openDevTools({ mode: "detach" })
  }
  registerWindowOpenHandler(miniPlayerWin)
  miniPlayerWin.on("close", (_event) => {
    miniPlayerWin = null
    win?.close()
  })
}

let forceReload: NodeJS.Timeout | null = null
electron.ipcMain.addListener("now-playing-info", (_event, info) => {
  miniPlayerWin?.webContents.send("now-playing-info", info)
  tray?.setToolTip(
    `${info.title} - ${info.artist} | Kiite Cafe Desktop: v${version}`
  )
  win?.setTitle(
    `${info.title} - ${info.artist} | Kiite Cafe Desktop: v${version}`
  )
  if (forceReload) {
    clearTimeout(forceReload)
  }
  forceReload = setTimeout(() => {
    win?.reload()
    console.log("Did not receive now-playing-info for 20 seconds, reloading")
  }, 20000)
})
electron.ipcMain.addListener("cancel-force-reload", () => {
  logIpc("main", "cancel-force-reload")
  if (forceReload) {
    clearTimeout(forceReload)
  }
})
for (const channel of ["get-playlists", "add-playlist-song"]) {
  electron.ipcMain.addListener(channel, (_event, ...args) => {
    logIpc("main", channel, ...args)
    sendToRenderer(channel, ...args)
  })
  electron.ipcMain.addListener(channel + "-result", (_event, playlists) => {
    logIpc("main", channel + "-result", playlists)
    sendToMiniPlayerRenderer(channel + "-result", playlists)
  })
}

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
  webview.session.webRequest.onHeadersReceived(
    { urls: ["*://cafe.kiite.jp/*", "*://embed.nicovideo.jp/*"] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Access-Control-Allow-Origin": "*",
        },
      })
    }
  )
})
electron.ipcMain.addListener("get-update-available", async () => {
  if (version === "0.0.0") {
    sendToRenderer("update-available", false)
    return
  }
  const latestVersion = (await fetch(
    "https://api.github.com/repos/sevenc-nanashi/kiitecafe-desktop/releases/latest"
  ).then((resp) => resp.json())) as { tag_name: string }

  sendToRenderer(
    "update-available",
    semver.gt(latestVersion.tag_name.replace(/^v/, ""), version)
      ? latestVersion
      : false
  )
})
electron.ipcMain.addListener("minimize", () => {
  miniPlayerWin?.hide()
  if (store.get("minimize-info-displayed", false)) {
    return
  }
  const notification = new electron.Notification({
    title: "トレーに最小化されました",
    body: "タスクトレイのアイコンをクリックすると再表示できます。",
    icon: iconPath,
  })
  notification.show()
  store.set("minimize-info-displayed", true)
})
for (const channel of ["set-muted", "set-popup-message", "set-rotating"]) {
  electron.ipcMain.addListener(channel, (_event, value) => {
    logIpc("main", channel, value)
    sendToRenderer(channel, value)
    sendToMiniPlayerRenderer(channel, value)
    store.set("muted", value)
  })
}

electron.ipcMain.addListener("set-favorite", (_event, value) => {
  logIpc("main", "set-favorite", value)
  sendToRenderer("set-favorite", value)
  sendToMiniPlayerRenderer("set-favorite", value)
})

electron.ipcMain.addListener("get-settings", (_event) => {
  logIpc("main", "get-settings")
  sendToRenderer("set-colors", getColors())
  sendToMiniPlayerRenderer("set-colors", getColors())

  const growEnabled = store.get("grow-effect", true)
  sendToRenderer("set-grow-effect", growEnabled)
})

electron.ipcMain.addListener("set-colors", (_event, value) => {
  logIpc("main", "set-colors", value)
  sendToRenderer("set-colors", value)
  sendToMiniPlayerRenderer("set-colors", value)
  store.set("colors", value)
})

electron.ipcMain.addListener("set-grow-effect", (_event, value) => {
  logIpc("main", "set-grow-effect", value)
  sendToRenderer("set-grow-effect", value)
  store.set("grow-effect", value)
})

electron.ipcMain.addListener("open-settings", (_event) => {
  logIpc("main", "open-settings")
  sendToRenderer("open-settings")
})

electron.app.on("ready", async () => {
  await installExtension(VUEJS_DEVTOOLS)
  electron.protocol.registerFileProtocol("app", (request, callback) => {
    const url = new URL(request.url)
    console.log(path.normalize(`${__dirname}/${url.pathname}`))
    callback({ path: path.normalize(`${__dirname}/${url.pathname}`) })
  })
  createTray()
  createMainWindow()
  createMiniPlayerWindow()
})
