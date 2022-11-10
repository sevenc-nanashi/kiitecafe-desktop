import { ipcRenderer } from "electron"
import style from "./style.scss"
import loginStyle from "./loginStyle.css"
import { version } from "../../package.json"

import about from "./about.html?raw"

console.log("Preload: loaded")
setTimeout(() => {
  if (location.pathname.includes("intro")) {
    // document.querySelector(".goto_kiite_login_button")!.click();
    location.href = "https://kiite.jp/login?mode=cafe"
  }
}, 0)
ipcRenderer.on("set-favorite", (_event, favorite) => {
  const button = document.querySelector(".favorite .button") as HTMLDivElement
  if (!button) {
    return
  }
  const favorited = !!document.querySelector(".favorite.is_faved")
  if (favorite === favorited) {
    return
  }
  button.click()
})
document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes("login")) {
    return
  }
  const styleElement = document.createElement("style")
  styleElement.textContent = loginStyle.toString()
  document.head.appendChild(styleElement)

  document.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank")
  })

  if (!location.search.includes("mode=cafe")) {
    location.search = "?mode=cafe"
  }
})
document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes("pc")) {
    return
  }
  const patchPlay = () => {
    // @ts-expect-error: †黒魔術に制約は要らない†
    const patchedPlay = function (e) {
      console.log("Preload: Called patchedPlay")
      // @ts-expect-error: †黒魔術に制約は要らない†
      d3.select("#cafe_player")
        .classed("loading", true)
        .classed("show_hint_tab_active", false)
      // @ts-expect-error: †黒魔術に制約は要らない†
      const player = new CafePlayer(e.video_id, e.start_time)

      player.load({
        onFirstPlay: function () {
          // eslint-disable-next-line
          return (
            // @ts-expect-error: †黒魔術に制約は要らない†
            5 < player.seekTo(window.cafe_music.get_song_pos(e)),
            // @ts-expect-error: †黒魔術に制約は要らない†
            d3
              .select("#cafe_player")
              .classed("loading", false)
              .classed("playing", true)
          )
        },
        onPause: function () {
          return this.pause()
        },
      })

      // @ts-expect-error: †黒魔術に制約は要らない†
      this.now_playing_player = player

      // @ts-expect-error: †黒魔術に制約は要らない†
      this.play_history(e)
    }
    patchedPlay.isPatched = true

    const patchInterval = setInterval(() => {
      // @ts-expect-error: †黒魔術に制約は要らない†
      if (window.cafe_music.play.isPatched) clearInterval(patchInterval)

      // @ts-expect-error: †黒魔術に制約は要らない†
      window.cafe_music.play = patchedPlay
      // @ts-expect-error: †黒魔術に制約は要らない†
      window.CafeMusic.prototype.play = patchedPlay
    }, 100)
  }
  const script = document.createElement("script")
  script.textContent = `(${patchPlay.toString()})()`
  document.body.appendChild(script)
  console.log("Preload: Added script", script)
})

document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.includes("pc")) {
    return
  }
  const styleElement = document.createElement("style")
  styleElement.textContent = style.toString()
  document.head.appendChild(styleElement)

  const playButton = document.querySelector(
    "#cafe_player .front"
  ) as HTMLDivElement
  if (playButton) {
    const playInterval = setInterval(() => {
      playButton.click()
      if (document.querySelector("#cafe_player.loading")) {
        clearInterval(playInterval)
      }
    }, 100)
    // setInterval(() => {
    //   if (
    //     (document.querySelector(".hint_tab_active") as HTMLDivElement).style
    //       .display === "none"
    //   ) {
    //     return
    //   }
    //   playButton.click()
    // }, 100)
    // setInterval(() => {
    //   if (
    //     document.querySelector("#cafe_player.loading") ||
    //     document.querySelector("#cafe_player .videos iframe")
    //   ) {
    //     return
    //   }
    //   if (
    //     parseFloat(
    //       (
    //         document.querySelector(
    //           "#song_position .position"
    //         )! as HTMLDivElement
    //       ).style.width.replace("%", "")
    //     ) /
    //       100 >
    //     0.01
    //   ) {
    //     const front = document.querySelector(".front") as HTMLDivElement
    //     front.click()
    //     front.click()
    //   }
    // }, 100)
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
      id:
        document
          .querySelector("#cafe_player .videos div")
          ?.id.replace("video_", "") ?? "",
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
    }
    if (!nowPlayingInfo.id) {
      return
    }
    ipcRenderer.send("now-playing-info", nowPlayingInfo)
  }
  new MutationObserver(sendUpdateIpc).observe(
    document.querySelector("#now_playing_info")!,
    {
      childList: true,
      subtree: true,
      attributes: true,
    }
  )
  new MutationObserver(sendUpdateIpc).observe(
    document.querySelector("#cafe_player")!,
    {
      childList: true,
      subtree: true,
      attributes: true,
    }
  )

  const cafe = document.querySelector("#cafe") as HTMLDivElement
  const cafeMenu = document.querySelector("#cafe_menu ul") as HTMLUListElement
  const aboutMenu = document.createElement("li")
  aboutMenu.setAttribute("class", "kcd-about")
  aboutMenu.addEventListener("click", () => {
    cafe.classList.remove(
      [...Object.values(cafe.classList)].find((c) => c.startsWith("view_"))!
    )
    cafe.classList.add("view_about")
  })
  aboutMenu.textContent = "Desktopについて"
  cafeMenu.appendChild(aboutMenu)

  new MutationObserver((_mutations) => {
    if (
      !(
        [...Object.values(cafe.classList)].find(
          (c) => c.startsWith("view_") && c !== "view_about"
        ) && cafe.classList.contains("view_about")
      )
    ) {
      return
    }
    cafe.classList.remove("view_about")
  }).observe(cafe, {
    subtree: false,
    attributes: true,
  })
  const tempTemplate = document.createElement("template")
  tempTemplate.innerHTML = about.replace("{{version}}", version)
  const aboutElement = tempTemplate.content.firstElementChild as HTMLDivElement
  cafe.appendChild(aboutElement)
  const logout = () => {
    if (!confirm("ログアウトしますか？")) {
      return
    }
    location.href = "https://kiite.jp/my/logout"
  }
  tempTemplate.innerHTML = `<div class="sub_menu border_right" id="logout" onclick='(${logout.toString()})()'>ログアウト</div>`
  const logoutElement = tempTemplate.content.firstElementChild as HTMLDivElement
  cafeMenu.parentElement!.appendChild(logoutElement)
})
