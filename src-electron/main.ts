import path from "path";
import fs from "fs/promises";
import * as electron from "electron";
import Store from "electron-store";
import * as semver from "semver";
import colorsJs from "@colors/colors";
import discordRpc from "discord-rpc";
import mime from "mime";

import colors from "~app/colors";
import { version } from "^/package.json";
import { CyalumeSettings, NowPlayingInfo } from "^/type/common";

const isDevelopment = import.meta.env.DEV;
if (isDevelopment) {
  colorsJs.enable();
}

electron.app.setPath(
  "userData",
  path.join(
    electron.app.getPath("appData"),
    `kiitecafe-desktop${isDevelopment ? "-dev" : ""}`
  )
);
const store = new Store({
  accessPropertiesByDotNotation: false,
});
const discord = new discordRpc.Client({ transport: "ipc" });

const getColors = () => {
  const mergedColors = new Map([
    ...(colors.map((color) => [color.name, color.default]) as [
      string,
      string,
    ][]),
    ...(store.get("colors", []) as [string, string][]),
  ]);
  return Array.from(mergedColors.entries());
};

let win: electron.BrowserWindow | null = null;
let miniPlayerWin: electron.BrowserWindow | null = null;
let tray: electron.Tray | null = null;

if (process.platform === "win32") {
  electron.app.setAppUserModelId("com.sevenc-nanashi.kiitecafe-desktop");
}

let iconPath: string;
const publicDir = isDevelopment
  ? path.join(import.meta.dirname, "../public")
  : __dirname;
const url = isDevelopment ? "http://localhost:5173#" : "app://./index.html#";

const log = (namespace: string, text: string) => {
  console.log(`[${namespace.padStart(8)} ]`.cyan + ` ${text}`);
};
const logIpc = (
  dest: "renderer" | "miniPlayer" | "main",
  channel: string,
  ...args: unknown[]
) => {
  let text = "";
  if (dest === "renderer") {
    text += `-> ${channel}: `.green;
  } else if (dest === "miniPlayer") {
    text += `-> ${channel}: `.yellow;
  } else {
    text += `<- ${channel}: `.red;
  }

  text += JSON.stringify(args);
  log("ipc", text);
};
const sendToRenderer = (channel: string, ...args: unknown[]) => {
  logIpc("renderer", channel, ...args);
  win?.webContents.send(channel, ...args);
};
const sendToMiniPlayerRenderer = (channel: string, ...args: unknown[]) => {
  logIpc("miniPlayer", channel, ...args);
  miniPlayerWin?.webContents.send(channel, ...args);
};

discord.on("ready", () => {
  log("discord", "Ready!");
});

if (process.platform === "darwin") {
  iconPath = path.join(publicDir, "mac-icon.png");
} else if (process.platform === "win32") {
  iconPath = path.join(publicDir, "icon.ico");
} else {
  iconPath = path.join(publicDir, "icon-256.png");
}

const createTray = () => {
  if (tray) {
    return;
  }
  let trayIconPath: string;
  if (process.platform === "darwin") {
    trayIconPath = path.join(publicDir, "mac-tray-icon.png");
  } else if (process.platform === "win32") {
    trayIconPath = path.join(publicDir, "icon.ico");
  } else {
    trayIconPath = path.join(publicDir, "icon-16.png");
  }
  tray = new electron.Tray(trayIconPath);
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
        win?.show();
      },
    },
    {
      label: "ミニプレイヤーを表示する",
      click: () => {
        miniPlayerWin?.show();
      },
    },
    {
      type: "separator",
    },
    {
      label: "GitHub",
      click: () => {
        void electron.shell.openExternal(
          "https://github.com/sevenc-nanashi/kiitecafe-desktop"
        );
      },
    },
    {
      label: "終了",
      click: () => {
        win?.close();
      },
      role: "quit",
    },
  ]);
  tray.setContextMenu(contextMenu);
  if (process.platform === "darwin") {
    tray.setPressedImage(path.join(publicDir, "mac-tray-icon-pressed.png"));
  }
  tray.on("click", () => {
    if (miniPlayerWin) {
      if (miniPlayerWin.isVisible()) {
        win?.show();
      } else {
        miniPlayerWin.show();
      }
    }
  });
};

const registerWindowOpenHandler = (win: electron.BrowserWindow) => {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    void electron.shell.openExternal(url);
    return { action: "deny" };
  });
};

const createMainWindow = async () => {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      webviewTag: true,
      preload: `${import.meta.dirname}/preload.js`,
    },
  });

  const params = new URLSearchParams();
  params.append("dirname", import.meta.dirname);
  params.append("muted", (store.get("muted", false) as boolean).toString());
  params.append("url", url);
  if (isDevelopment || store.get("__open_devtools", false)) {
    win.webContents.openDevTools({ mode: "detach" });
  }
  await win.loadURL(`${url}?${params.toString()}`);

  registerWindowOpenHandler(win);
  win.on("close", (_event) => {
    win = null;
    miniPlayerWin?.close();
  });

  win.setMenu(null);
};

const createMiniPlayerWindow = async () => {
  const width = 810;
  const height = 95;
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
      preload: `${import.meta.dirname}/miniPlayerPreload.js`,
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
  const params = new URLSearchParams();
  params.set("muted", (store.get("muted", false) as boolean).toString());
  await miniPlayerWin.loadURL(`${url}/mini-player?${params.toString()}`);
  if (isDevelopment) {
    miniPlayerWin.webContents.openDevTools({ mode: "detach" });
  }
  registerWindowOpenHandler(miniPlayerWin);
  miniPlayerWin.on("close", (_event) => {
    miniPlayerWin = null;
    win?.close();
  });
};

electron.ipcMain.addListener(
  "update-stats",
  async (
    _event,
    stats: {
      users: number;
      newFavs: number;
      rotates: number;
    }
  ) => {
    if (!nowPlayingInfo) return;
    logIpc("main", "update-stats", stats);
    const details = "\u266a" + nowPlayingInfo.title;
    const state = `\u{1f464} ${stats.users} | 回 ${stats.rotates} | \u{2764} ${stats.newFavs}`;
    log("discord", `Updating activity`);
    await discord.setActivity({
      largeImageKey:
        "https://kiitecafe-thumbnail.deno.dev?videoId=" + nowPlayingInfo.id,
      largeImageText: `${nowPlayingInfo.title} - ${nowPlayingInfo.artist}`,
      smallImageKey: "icon",
      smallImageText: `Kiite Cafe Desktop: v${version}`,
      startTimestamp: new Date(nowPlayingInfo.startedAt),
      endTimestamp: new Date(nowPlayingInfo.endsAt),

      details,
      state,
      buttons: [
        {
          label: "Kiite Cafe",
          url: "https://cafe.kiite.jp",
        },
        {
          label: "ニコニコ動画",
          url: `https://www.nicovideo.jp/watch/${nowPlayingInfo.id}`,
        },
      ],
    });
  }
);

let forceReload: NodeJS.Timeout | null = null;
let nowPlayingInfo: NowPlayingInfo | null = null;
electron.ipcMain.addListener(
  "now-playing-info",
  (_event, info: NowPlayingInfo) => {
    miniPlayerWin?.webContents.send("now-playing-info", info);
    if (nowPlayingInfo?.id === info.id) {
      tray?.setToolTip(
        `${info.title} - ${info.artist} | Kiite Cafe Desktop: v${version}`
      );
      win?.setTitle(
        `${info.title} - ${info.artist} | Kiite Cafe Desktop: v${version}`
      );
    }
    nowPlayingInfo = info;
    if (forceReload) {
      clearTimeout(forceReload);
    }
    forceReload = setTimeout(() => {
      win?.reload();
      console.log("Did not receive now-playing-info for 20 seconds, reloading");
    }, 20000);
  }
);
electron.ipcMain.addListener("cancel-force-reload", () => {
  logIpc("main", "cancel-force-reload");
  if (forceReload) {
    clearTimeout(forceReload);
  }
});
for (const channel of ["get-playlists", "add-playlist-song"]) {
  electron.ipcMain.addListener(channel, (_event, ...args) => {
    logIpc("main", channel, ...args);
    sendToRenderer(channel, ...args);
  });
  electron.ipcMain.addListener(channel + "-result", (_event, playlists) => {
    logIpc("main", channel + "-result", playlists);
    sendToMiniPlayerRenderer(channel + "-result", playlists);
  });
}

electron.ipcMain.addListener("setup-webview", (_event, id) => {
  const webview = electron.webContents.fromId(id);
  if (!webview) {
    return;
  }
  webview.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("app://")) {
      return { action: "allow" };
    }
    void electron.shell.openExternal(url);
    return { action: "deny" };
  });
  webview.session.webRequest.onHeadersReceived(
    { urls: ["*://cafe.kiite.jp/*", "*://embed.nicovideo.jp/*"] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  );
});
electron.ipcMain.addListener("get-update-available", async () => {
  if (version === "0.0.0") {
    sendToRenderer("update-available", false);
    return;
  }
  const latestVersion = (await fetch(
    "https://api.github.com/repos/sevenc-nanashi/kiitecafe-desktop/releases/latest"
  ).then((resp) => resp.json())) as { tag_name: string };

  sendToRenderer(
    "update-available",
    semver.gt(latestVersion.tag_name.replace(/^v/, ""), version)
      ? latestVersion
      : false
  );
});
electron.ipcMain.addListener("minimize", () => {
  miniPlayerWin?.hide();
  if (store.get("minimize-info-displayed", false)) {
    return;
  }
  const notification = new electron.Notification({
    title: "トレーに最小化されました",
    body: "タスクトレイのアイコンをクリックすると再表示できます。",
    icon: iconPath,
  });
  notification.show();
  store.set("minimize-info-displayed", true);
});
for (const channel of ["set-muted", "set-popup-message", "set-rotating"]) {
  electron.ipcMain.addListener(channel, (_event, value) => {
    logIpc("main", channel, value);
    sendToRenderer(channel, value);
    sendToMiniPlayerRenderer(channel, value);
    if (channel === "set-muted") {
      store.set("muted", value);
    }
  });
}

electron.ipcMain.addListener("set-favorite", (_event, value) => {
  logIpc("main", "set-favorite", value);
  sendToRenderer("set-favorite", value);
  sendToMiniPlayerRenderer("set-favorite", value);
});

electron.ipcMain.addListener("get-settings", (_event) => {
  logIpc("main", "get-settings");
  sendToRenderer("set-colors", getColors());
  sendToMiniPlayerRenderer("set-colors", getColors());

  const cyalumeSettings = store.get("cyalume-settings", {
    grow: false,
    dim: false,
  }) as CyalumeSettings;
  sendToRenderer("set-cyalume-settings", cyalumeSettings);
});

electron.ipcMain.addListener("set-colors", (_event, value) => {
  logIpc("main", "set-colors", value);
  sendToRenderer("set-colors", value);
  sendToMiniPlayerRenderer("set-colors", value);
  store.set("colors", value);
});

electron.ipcMain.addListener("set-cyalume-settings", (_event, value) => {
  logIpc("main", "set-cyalume-settings", value);
  store.set("cyalume-settings", value);
  sendToRenderer("set-cyalume-settings", value);
});
for (const channel of ["open-settings", "open-about"]) {
  electron.ipcMain.addListener(channel, (_event) => {
    logIpc("main", channel);
    sendToRenderer(channel);
  });
}

electron.app.on("ready", () => {
  electron.protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    const filePath = path.normalize(`${import.meta.dirname}/${url.pathname}`);
    const mimeType = mime.getType(filePath) || "application/octet-stream";
    const buffer = await fs.readFile(filePath);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
      },
    });
  });
  log("discord", "Starting...");
  void discord.login({
    clientId: "1080769753506918463",
  });
  void createTray();
  void createMainWindow();
  void createMiniPlayerWindow();
});
