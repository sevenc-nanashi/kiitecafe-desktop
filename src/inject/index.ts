import { ipcRenderer } from "electron";
import style from "./style.css";
import loginStyle from "./loginStyle.css";

console.log("Preload: loaded");
setTimeout(() => {
  if (location.pathname.includes("intro")) {
    // document.querySelector(".goto_kiite_login_button")!.click();
    location.href = "https://kiite.jp/login?mode=cafe";
  }
}, 0);
ipcRenderer.on("set-favorite", (_event, favorite) => {
  const button = document.querySelector(".favorite .button") as HTMLDivElement;
  if (!button) {
    return;
  }
  const favorited = !!document.querySelector(".favorite.is_faved");
  if (favorite === favorited) {
    return;
  }
  button.click();
});
document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes("login")) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.textContent = loginStyle.toString();
  document.head.appendChild(styleElement);

  document.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
  });
});
document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes("pc")) {
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
    setInterval(() => {
      if (
        document.querySelector("#cafe_player.loading") ||
        document.querySelector("#cafe_player .videos iframe")
      ) {
        return;
      }
      if (
        parseFloat(
          (
            document.querySelector(
              "#song_position .position"
            )! as HTMLDivElement
          ).style.width.replace("%", "")
        ) /
          100 >
        0.01
      ) {
        const front = document.querySelector(".front") as HTMLDivElement;
        front.click();
        front.click();
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
      favorited: !!document.querySelector(".favorite.is_faved"),
      favoriteCount: parseInt(
        document.querySelector(".favorite .value")!.textContent!.trim()
      ),
      volume: parseInt(
        document.querySelector(".volume .value")!.textContent!.trim()
      ),
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

  const cafeMenu = document.querySelector("#cafe_menu ul") as HTMLUListElement;
  const aboutMenu = document.createElement("li");
  aboutMenu.setAttribute("class", "kcd-about");
  aboutMenu.addEventListener("click", () => {
    const cafe = document.querySelector("#cafe") as HTMLDivElement;
    cafe.classList.remove(
      [...Object.values(cafe.classList)].find((c) => c.startsWith("view_"))!
    );
    cafe.classList.add("view_about");
  });
  aboutMenu.textContent = "Desktopについて";
  cafeMenu.appendChild(aboutMenu);
});
