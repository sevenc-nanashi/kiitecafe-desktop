import { contextBridge, ipcRenderer } from "electron"
import style from "./style.scss"
import loginStyle from "./loginStyle.css"
import packageJson from "../../package.json?raw"

import about from "./about.html?raw"

import type { CafeMusicInfo } from "./window"

console.log("Preload: loaded")

let version = JSON.parse(packageJson).version
if (version === "0.0.0") {
  version = "開発版（0.0.0）"
}

type UpdateAvailable = { tag_name: string; html_url: string } | false
type CafeMusicGetter = () => CafeMusic
type CafeUsersGetter = () => CafeUsers
type SnsUserGetter = () => SnsUser
type WindowFuncs = {
  cafeMusic: CafeMusicGetter
  cafeUsers: CafeUsersGetter
  snsUser: SnsUserGetter
  getPlaylists: () => Promise<Playlist[]>
  addPlaylistSong: (listId: string, songId: string) => Promise<boolean>
}
let cafeMusic: CafeMusicGetter | null = null
let cafeUsers: CafeUsersGetter | null = null
let getPlaylists: WindowFuncs["getPlaylists"] | null = null
let addPlaylistSong: WindowFuncs["addPlaylistSong"] | null = null

contextBridge.exposeInMainWorld("preload", {
  setFuncs: (funcs: WindowFuncs) => {
    cafeMusic = funcs.cafeMusic
    cafeUsers = funcs.cafeUsers
    getPlaylists = funcs.getPlaylists
    addPlaylistSong = funcs.addPlaylistSong
  },
})

declare global {
  interface Window {
    preload: {
      setFuncs: (funcs: WindowFuncs) => void
    }
  }
}
ipcRenderer.on(
  "update-available",
  (_event, updateAvailable: UpdateAvailable) => {
    const cafe = document.querySelector("#cafe") as HTMLDivElement
    const tempTemplate = document.createElement("template")
    let aboutHTML = about
    aboutHTML = aboutHTML.replace("{{version}}", version)
    if (updateAvailable) {
      aboutHTML = aboutHTML.replace(/\{\[\/?new-version\]\}/gm, "")
      aboutHTML = aboutHTML.replaceAll(
        "{{new-version-name}}",
        updateAvailable.tag_name
      )
      aboutHTML = aboutHTML.replaceAll(
        "{{new-version-url}}",
        updateAvailable.html_url
      )
      document.querySelector(".kcd-about")?.setAttribute("update-available", "")
    } else {
      aboutHTML = aboutHTML.replace(
        /\{\[new-version\]\}([\s\S]+)\{\[\/new-version\]\}/gm,
        ""
      )
    }

    tempTemplate.innerHTML = aboutHTML

    const aboutElement = tempTemplate.content
      .firstElementChild as HTMLDivElement
    cafe.appendChild(aboutElement)
  }
)

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
let isRotating = false
ipcRenderer.on("set-rotating", (_event, rotating) => {
  const button = document.querySelector(
    '.btn[data-gesture="rotate"]'
  ) as HTMLDivElement
  if (button.classList.contains("on") === rotating) {
    return
  }
  isRotating = rotating
  button.click()
})
ipcRenderer.on("set-popup-message", (_event, popupMessage: string | null) => {
  const input = document.querySelector(
    "#comment_form input"
  ) as HTMLInputElement
  const submitButton = document.querySelector(
    "#comment_form .btn.submit"
  ) as HTMLButtonElement
  const cleanButton = document.querySelector(
    "#comment_form .btn.clean"
  ) as HTMLButtonElement
  if (popupMessage) {
    input.value = popupMessage
    submitButton.click()
  } else {
    cleanButton.click()
  }
})
ipcRenderer.on("get-playlists", async () => {
  ipcRenderer.send("get-playlists-result", await getPlaylists!())
})
ipcRenderer.on("add-playlist-song", async (_event, listId, songId) => {
  ipcRenderer.send(
    "add-playlist-song-result",
    await addPlaylistSong!(listId, songId)
  )
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
  const injectScript = () => {
    const patchedPlay = function (
      this: CafeMusic,
      musicInfo: CafeMusicInfo & { start_time: number }
    ) {
      console.log("Preload: Called patchedPlay")
      window.d3
        .select("#cafe_player")
        .classed("loading", true)
        .classed("show_hint_tab_active", false)
      const player = new window.CafePlayer(
        musicInfo.video_id,
        musicInfo.start_time
      )

      player.load({
        onFirstPlay: function () {
          return (
            5 < player.seekTo(window.cafe_music.get_song_pos(musicInfo)),
            window.d3
              .select("#cafe_player")
              .classed("loading", false)
              .classed("playing", true)
          )
        },
        onPause: function () {
          return this.pause!()
        },
      })

      this.now_playing_player = player

      this.play_history(musicInfo)
    }
    patchedPlay.isPatched = true

    const patchInterval = setInterval(() => {
      // @ts-expect-error: 改造されたかどうか判断する黒魔術
      if (window.cafe_music.play.isPatched) clearInterval(patchInterval)

      window.cafe_music.play = patchedPlay
      window.CafeMusic.prototype.play = patchedPlay
    }, 100)

    window.preload.setFuncs({
      cafeMusic: () => window.cafe_music,
      cafeUsers: () => window.cafe_users,
      snsUser: () => window.sns_user,
      getPlaylists: () =>
        new Promise<Playlist[]>((resolve) => {
          window.sns_user.get_api_playlists(resolve)
        }),
      addPlaylistSong: async (playlistId, songId) => {
        const playlist = await new Promise<{ songs: string[] }>((resolve) =>
          window.sns_user.get_api_playlist_songs(playlistId, resolve)
        )

        if (playlist.songs.includes(songId)) {
          return false
        }
        await new Promise((resolve) =>
          window.sns_user.post_song_to_playlist(songId, playlistId, {
            onSuccess: resolve,
          })
        )
        return true
      },
    })
  }
  const script = document.createElement("script")
  script.textContent = `(${injectScript.toString()})()`
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
    setInterval(() => {
      if (
        document.querySelector("#cafe_player.loading") ||
        document.querySelector("#cafe_player .videos iframe")
      ) {
        return
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
        const front = document.querySelector(".front") as HTMLDivElement
        front.click()
        front.click()
      }
    }, 100)
  }

  const sendUpdateIpc = (_mutations: MutationRecord[]) => {
    if (!cafeUsers || !cafeUsers().me || !cafeMusic) {
      return
    }
    const nowPlaying = cafeMusic().now_playing
    const nowPlayingInfo: NowPlayingInfo = {
      title: nowPlaying.title,
      artist: nowPlaying.artist_name,
      thumbnail: nowPlaying.thumbnail,
      publishedAt: nowPlaying.published_at,
      id: nowPlaying.video_id,
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
      reason:
        cafeMusic!().reason.reasons.find(
          (r) => r.user_id === cafeUsers!().me.user_id
        )?.type ?? "none",
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
  const rotateButton = document.querySelector(
    '.btn[data-gesture="rotate"]'
  ) as HTMLDivElement
  new MutationObserver(() => {
    if (isRotating === rotateButton.classList.contains("on")) {
      return
    }
    ipcRenderer.send("set-rotating", rotateButton.classList.contains("on"))
  }).observe(rotateButton, {
    attributes: true,
  })

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

  const topMenu = document.querySelector("#top_menu ul") as HTMLUListElement
  const tempTemplate = document.createElement("template")
  const logout = () => {
    if (!confirm("ログアウトしますか？")) {
      return
    }
    location.href = "https://kiite.jp/my/logout"
  }
  const reload = () => {
    location.reload()
  }

  tempTemplate.innerHTML = `<li kcd onclick='(${reload.toString()})()'>Reload</li>`
  const reloadElement = tempTemplate.content.firstElementChild as HTMLLIElement
  topMenu.appendChild(reloadElement)

  tempTemplate.innerHTML = `<li kcd onclick='(${logout.toString()})()'>Logout</li>`
  const logoutElement = tempTemplate.content.firstElementChild as HTMLLIElement
  topMenu.appendChild(logoutElement)

  ipcRenderer.send("cancel-force-reload")
})
