/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: "com.sevenc-nanashi.kiitecafe-desktop",
  productName: "Kiitecafe Desktop",
  copyright: "2022 © Nanashi. <@sevenc-nanashi>",
  directories: {
    output: "dist-electron",
  },
  files: ["dist/**/*"],
  mac: {
    category: "public.app-category.social-networking",
    target: "dmg",
  },
  win: {
    target: "nsis",
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  linux: {
    target: "AppImage",
  },
};
