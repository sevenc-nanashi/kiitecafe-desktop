import * as electron from "electron";

const isDevelopment = import.meta.env.DEV;

const createWindow = () => {
  const win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  if (isDevelopment) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  }
};

electron.app.on("ready", createWindow);
