import * as electron from "electron";
import path from "path";

const isDevelopment = import.meta.env.DEV;

let win: electron.BrowserWindow | null = null;
let miniPlayerWin: electron.BrowserWindow | null = null;
const createMainWindow = () => {
  win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webviewTag: true,
      preload: `${__dirname}/preload.js`,
    },
  });

  const params = new URLSearchParams();
  params.append("dirname", __dirname);
  if (isDevelopment) {
    win.loadURL("http://localhost:5173?" + params.toString());
    win.webContents.openDevTools();
  } else {
    win.loadURL("app://./index.html?" + params.toString());
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
};

const createMiniPlayerWindow = () => {
  const width = 810;
  const height = 95;
  miniPlayerWin = new electron.BrowserWindow({
    width,
    height,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    focusable: false,
    transparent: true,
    x: electron.screen.getPrimaryDisplay().workAreaSize.width - width,
    y: electron.screen.getPrimaryDisplay().workAreaSize.height - height,
    webPreferences: {
      preload: `${__dirname}/miniPlayerPreload.js`,
    },
  });
  miniPlayerWin.setIgnoreMouseEvents(true, { forward: true });
  miniPlayerWin.setBackgroundColor("#00000000");
  miniPlayerWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  electron.ipcMain.addListener("set-ignore-mouse-events", (_event, ignore) => {
    if (ignore) {
      miniPlayerWin?.setIgnoreMouseEvents(true, { forward: true });
    } else {
      miniPlayerWin?.setIgnoreMouseEvents(false);
    }
  });
  if (isDevelopment) {
    miniPlayerWin.loadURL("http://localhost:5173/miniplayer");
    miniPlayerWin.webContents.openDevTools();
  } else {
    miniPlayerWin.loadURL("app://./index.html#/miniplayer");
  }
};

electron.ipcMain.addListener("now-playing-info", (_event, info) => {
  miniPlayerWin?.webContents.send("now-playing-info", info);
});

electron.ipcMain.addListener("setup-webview", (_event, id) => {
  console.log("setup-webview", id);
  const webview = electron.webContents.fromId(id);
  console.log("setup-webview", id, webview);
  if (!webview) {
    return;
  }
  webview.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
});
["set-muted", "set-favorite"].forEach((channel) => {
  electron.ipcMain.addListener(channel, (_event, value) => {
    win?.webContents.send(channel, value);
    miniPlayerWin?.webContents.send(channel, value);
  });
});

electron.app.on("ready", () => {
  electron.protocol.registerFileProtocol("app", (request, callback) => {
    const url = new URL(request.url);
    callback({ path: path.normalize(`${__dirname}/${url.pathname}`) });
  });
  createMainWindow();
  createMiniPlayerWindow();
});
