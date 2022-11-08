import { ipcRenderer } from "electron";
import style from "./style.css";

console.log("Preload: loaded");
setTimeout(() => {
  if (location.pathname.includes("intro")) {
    // document.querySelector(".goto_kiite_login_button")!.click();
    location.href = "https://kiite.jp/login?mode=cafe";
  }
}, 0);
document.addEventListener("DOMContentLoaded", () => {
  if (
    location.pathname.includes("intro") ||
    location.pathname.includes("login")
  ) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.textContent = style.toString();
  document.head.appendChild(styleElement);

  const playButton = document.querySelector(
    "#cafe_player .front"
  ) as HTMLDivElement;
  if (playButton) {
    let playInterval = setInterval(() => {
      playButton.click();
      if (document.querySelector("#cafe_player.loading")) {
        clearInterval(playInterval);
      }
    }, 1000);
  }

  const sendUpdateIpc = (_mutations: MutationRecord[]) => {
    const nowPlayingInfo: NowPlayingInfo = {
      title: document
        .querySelector("#now_playing_info .title")!
        .textContent!.trim(),
      artist: document
        .querySelector("#now_playing_info .artist")!
        .textContent!.trim(),
      thumbnail: (
        document.querySelector(
          "#now_playing_info .thumbnail .icon"
        ) as HTMLDivElement
      ).style.backgroundImage!.replace(/url\((.+)\)/, "$1"),
      publishedAt: document
        .querySelector("#now_playing_info .published_at")!
        .textContent!.trim(),
      id: document
        .querySelector("#cafe_player .videos div")!
        ?.id.replace("video_", ""),
      progress:
        parseFloat(
          (
            document.querySelector(
              "#song_position .position"
            )! as HTMLDivElement
          ).style.width.replace("%", "")
        ) / 100,
    };
    if (!nowPlayingInfo.id) {
      return;
    }
    ipcRenderer.send("now-playing-info", nowPlayingInfo);
  };
  new MutationObserver(sendUpdateIpc).observe(
    document.querySelector("#now_playing_info")!,
    {
      childList: true,
      subtree: true,
      attributes: true,
    }
  );
  new MutationObserver(sendUpdateIpc).observe(
    document.querySelector("#cafe_player")!,
    {
      childList: true,
      subtree: true,
      attributes: true,
    }
  );
});
