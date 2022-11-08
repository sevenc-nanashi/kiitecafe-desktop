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
    },
  });

  const params = new URLSearchParams();
  params.append("dirname", __dirname);
  if (isDevelopment) {
    win.loadURL("http://localhost:5173?" + params.toString());
    // win.webContents.openDevTools();
  } else {
    win.loadURL("app://./index.html?" + params.toString());
  }

  electron.ipcMain.addListener("now-playing-info", (event, info) => {
    miniPlayerWin?.webContents.send("now-playing-info", info);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
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

electron.app.on("ready", () => {
  electron.protocol.registerFileProtocol("app", (request, callback) => {
    const url = new URL(request.url);
    callback({ path: path.normalize(`${__dirname}/${url.pathname}`) });
  });
  createMainWindow();
  createMiniPlayerWindow();
});
