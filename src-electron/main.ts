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

  const params = new URLSearchParams();
  params.append("dirname", __dirname);
  if (isDevelopment) {
    win.loadURL("http://localhost:5173?" + params.toString());
    win.webContents.openDevTools();
  }
};

electron.app.on("ready", createWindow);
