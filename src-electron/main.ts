import * as electron from "electron";

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
    win.webContents.openDevTools();
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
  const width = 500;
  const height = 85;
  miniPlayerWin = new electron.BrowserWindow({
    width,
    height,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    x: electron.screen.getPrimaryDisplay().workAreaSize.width - width,
    y: electron.screen.getPrimaryDisplay().workAreaSize.height - height,
    webPreferences: {
      preload: `${__dirname}/miniPlayerPreload.js`,
    },
  });
  if (isDevelopment) {
    miniPlayerWin.loadURL("http://localhost:5173/miniplayer");
    miniPlayerWin.webContents.openDevTools();
  }
};

electron.app.on("ready", createMainWindow);
electron.app.on("ready", createMiniPlayerWindow);
