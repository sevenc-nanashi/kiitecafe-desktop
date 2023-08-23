import { contextBridge, ipcRenderer } from "electron"
import style from "./style.scss?inline"
import colorsStyle from "./colors.scss?inline"
import loginStyle from "./loginStyle.scss?inline"

import type { CafeMusicInfo } from "./window"
import { NowPlayingInfo, Playlist, UpdateAvailable } from "^/type/common"

console.log("InjectPreload: loaded")

const isDevelopment = import.meta.env.DEV

if (location.pathname.includes("intro")) {
  // document.querySelector(".goto_kiite_login_button")!.click();
  location.href = "https://kiite.jp/login?mode=cafe"
}

type CafeMusicGetter = () => CafeMusic
type CafeUsersGetter = () => CafeUsers
type SnsUserGetter = () => SnsUser
type WindowFuncs = {
  cafeMusic: CafeMusicGetter
  cafeUsers: CafeUsersGetter
  snsUser: SnsUserGetter
  getPlaylists: () => Promise<Playlist[]>
  addPlaylistSong: (listId: string, songId: string) => Promise<boolean>
  toggleCyalume: () => void
}
let cafeMusic: CafeMusicGetter | null = null
let cafeUsers: CafeUsersGetter | null = null
let getPlaylists: WindowFuncs["getPlaylists"] | null = null
let addPlaylistSong: WindowFuncs["addPlaylistSong"] | null = null
let toggleCyalume: WindowFuncs["toggleCyalume"] | null = null

const topMenus = [
  {
    name: "about",
    label: "About",
    onClick: () => {
      ipcRenderer.send("open-about")
    },
  },
  {
    name: "reload",
    label: "Reload",
    onClick: () => {
      location.reload()
    },
  },
  {
    name: "settings",
    label: "Settings",
    onClick: () => {
      ipcRenderer.send("open-settings")
    },
  },
  {
    name: "logout",
    label: "Logout",
    onClick: () => {
      if (!confirm("ログアウトしますか？")) {
        return
      }
      location.href = "https://kiite.jp/my/logout"
    },
  },
]

contextBridge.exposeInMainWorld("preload", {
  setFuncs: (funcs: WindowFuncs) => {
    cafeMusic = funcs.cafeMusic
    cafeUsers = funcs.cafeUsers
    getPlaylists = funcs.getPlaylists
    addPlaylistSong = funcs.addPlaylistSong
    toggleCyalume = funcs.toggleCyalume
  },
})

declare global {
  interface Window {
    preload: {
      setFuncs: (funcs: WindowFuncs) => void
    }
  }
}
ipcRenderer.on("information", (_event, updateAvailable: UpdateAvailable) => {
  if (updateAvailable) {
    const aboutMenu = document.querySelector(
      "#top_menu .menu li[data-kcd-name='about']"
    ) as HTMLLIElement
    aboutMenu.classList.add("update-available")
  }
})

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
ipcRenderer.on("set-colors", (_event, colors: [string, string][]) => {
  for (const [name, color] of colors) {
    document.body.style.setProperty(`--color-${name}`, color)
    document.body.style.setProperty(
      `--color-${name}-rgb`,
      [...Array(3)]
        .map((_, i) => parseInt(color.slice(i * 2 + 1, i * 2 + 3), 16))
        .join(",")
    )
  }
  for (const iframe of Array.from(
    document.querySelectorAll(
      "iframe[kcd-iframe]"
    ) as NodeListOf<HTMLIFrameElement>
  )) {
    iframe.contentWindow?.postMessage(["set-colors", colors], "*")
  }
})
ipcRenderer.on("set-cyalume-settings", (_event, settings: CyalumeSettings) => {
  document.body.setAttribute("data-kcd-cyalume-grow", settings.grow.toString())
  document.body.setAttribute("data-kcd-cyalume-dim", settings.dim.toString())
})
window.addEventListener("message", (event) => {
  if (
    ![
      "http://localhost:5173", // Development mode
      "null", // Production mode, app:// origin is "null"
    ].includes(event.origin)
  ) {
    return
  }
  const [type] = event.data
  switch (type) {
    case "get-settings":
      ipcRenderer.send("get-settings")
  }
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
      toggleCyalume: () => {
        const commentForm = document.getElementById(
          "comment_form"
        ) as HTMLDivElement
        if (window.cafe_music.now_playing.rotate_action === "cyalume") {
          console.log("Preload: Toggled cyalume off")
          window.cafe_music.now_playing.rotate_action = null
          commentForm.classList.remove("with_penlight")
        } else {
          console.log("Preload: Toggled cyalume on")
          window.cafe_music.now_playing.rotate_action = "cyalume"
          commentForm.classList.add("with_penlight")
        }
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
  setInterval(() => {
    const users = parseInt(
      document.querySelector("#user_count .val")!.textContent!
    )
    const rotates = document.querySelectorAll(".user.gesture_rotate").length
    const newFavs = document.querySelectorAll(".user.new_fav").length
    ipcRenderer.send("update-stats", { users, rotates, newFavs })
  }, 5000)
  const styleElement = document.createElement("style")
  styleElement.textContent = style.toString() + colorsStyle.toString()
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

  let lastMusicId: string | null = null
  const sendUpdateIpc = (_mutations: MutationRecord[]) => {
    if (!cafeUsers || !cafeUsers().me || !cafeMusic) {
      return
    }
    if (lastMusicId !== cafeMusic().now_playing.video_id) {
      onMusicChange()
    }
    lastMusicId = cafeMusic().now_playing.video_id
    const nowPlaying = cafeMusic().now_playing
    const nowPlayingInfo: NowPlayingInfo = {
      title: nowPlaying.title,
      artist: nowPlaying.artist_name,
      thumbnail: nowPlaying.thumbnail,
      publishedAt: nowPlaying.published_at,
      startedAt: new Date(nowPlaying.start_time).getTime(),
      endsAt: new Date(
        new Date(nowPlaying.start_time).getTime() + nowPlaying.msec_duration
      ).getTime(),
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

  const topMenu = document.querySelector("#top_menu ul") as HTMLUListElement
  for (const { onClick, label, name } of topMenus) {
    const menuElement = document.createElement("li")
    menuElement.setAttribute("data-kcd", "")
    menuElement.setAttribute("data-kcd-name", name)
    menuElement.addEventListener("click", onClick)
    menuElement.textContent = label
    topMenu.appendChild(menuElement)
  }

  for (const link of Array.from(document.querySelectorAll("#cafe_info a"))) {
    link.setAttribute("target", "_blank")
  }

  ipcRenderer.send("cancel-force-reload")
  ipcRenderer.send("get-settings")

  const onMusicChange = () => {
    if (!cafeMusic) return
    const nowPlaying = cafeMusic().now_playing
    document.body.setAttribute(
      "data-kcd-is-cyalume",
      (nowPlaying.rotate_action === "cyalume").toString()
    )
  }

  if (isDevelopment) {
    document.body.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        toggleCyalume!()
      }
    })
  }
})
