/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: "com.sevenc-nanashi.kiitecafe-desktop",
  productName: "Kiite Cafe Desktop",
  copyright: "2022 © Nanashi. <@sevenc-nanashi>",
  directories: {
    output: "dist-electron",
  },
  files: ["dist/**/*"],
  mac: {
    category: "public.app-category.social-networking",
    target: "dmg",
    icon: "build/icon.png",
  },
  win: {
    target: "nsis",
    icon: "build/icon.png",
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  linux: {
    target: "AppImage",
    icon: "build/icon.png",
  },
};
