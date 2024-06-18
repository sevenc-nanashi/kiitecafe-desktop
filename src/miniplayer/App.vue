<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import VolumeMuteIcon from "vue-material-design-icons/VolumeMute.vue"
import VolumeHighIcon from "vue-material-design-icons/VolumeHigh.vue"
import HeartIcon from "vue-material-design-icons/Heart.vue"
import HeartOutlineIcon from "vue-material-design-icons/HeartOutline.vue"
import AutoFixIcon from "vue-material-design-icons/AutoFix.vue"
import InformationIcon from "vue-material-design-icons/Information.vue"
import MinusIcon from "vue-material-design-icons/Minus.vue"
import ReloadIcon from "vue-material-design-icons/Reload.vue"
import MessageIcon from "vue-material-design-icons/Message.vue"
import PlaylistMusicIcon from "vue-material-design-icons/PlaylistMusic.vue"
import PlaylistPlusIcon from "vue-material-design-icons/PlaylistPlus.vue"
import PlaylistCheckIcon from "vue-material-design-icons/PlaylistCheck.vue"
import PlaylistRemoveIcon from "vue-material-design-icons/PlaylistRemove.vue"
import { watch, ref, computed, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { NowPlayingInfo, Playlist } from "^/type/common"

const router = useRouter()
const info = ref<NowPlayingInfo>()
window.electron.receive("now-playing-info", (npinfo: NowPlayingInfo) => {
  info.value = npinfo
})
const favoriteCount = computed(() => {
  if (info.value == null) {
    return "-"
  } else if (info.value.favoriteCount > 999) {
    return "999"
  } else {
    return info.value.favoriteCount
  }
})
const isFavoriteOverflowing = computed(() => {
  return (info.value?.favoriteCount || 0) > 999
})

const mainEl = ref<HTMLDivElement>()
const titleEl = ref<HTMLDivElement>()
const titleContentEl = ref<HTMLDivElement>()
let animation: { width: number; animation: Animation } | null = null

const isHovering = ref(false)
const isMuted = ref(router.currentRoute.value.query.muted === "true")

let interval: ReturnType<typeof setInterval> | null = null

document.documentElement.addEventListener("mouseleave", () => {
  isHovering.value = false
})

watch(isHovering, (value) => {
  window.electron.send("set-ignore-mouse-events", !value)
})

interval = setInterval(() => {
  const titlEl = titleEl.value
  const conEl = titleContentEl.value
  if (!conEl || !titlEl) {
    return
  }
  const moveWidth = conEl.scrollWidth - titlEl.clientWidth
  if (animation && animation.width === moveWidth) {
    return
  }
  animation?.animation.cancel()
  if (moveWidth <= 0) {
    animation = null
    return
  }
  animation = {
    width: moveWidth,
    animation: conEl.animate(
      [
        { left: 0, offset: 0.2 },
        {
          left: `-${moveWidth}px`,
          offset: 0.7,
        },
      ],
      { duration: 10000, iterations: Infinity }
    ),
  }
}, 10)

window.electron.receive("set-muted", (value: boolean) => {
  isMuted.value = value
})

const toggleMute = () => {
  window.electron.send("set-muted", !isMuted.value)
}

const toggleFavorite = () => {
  window.electron.send("set-favorite", !info.value?.favorited)
}

const openNico = () => {
  window.open(`https://www.nicovideo.jp/watch/${info.value?.id}`)
}

const windowType = ref<"action" | "playlist" | "info">("info")

const toActionWindow = () => {
  windowType.value = "action"
}
const toPlaylistWindow = () => {
  windowType.value = "playlist"
  fetchPlaylists()
}
const toInfoWindow = () => {
  windowType.value = "info"
}
const minimizeWindow = () => {
  window.electron.send("minimize", [])
}

const tweet = () => {
  if (!info.value) return
  const text =
    `♪ ${info.value.title} #${info.value.id} #Kiite\n` +
    `Kiite Cafeできいてます https://cafe.kiite.jp https://nicovideo.jp/watch/${info.value.id}`
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  )
}

const isRotating = ref(false)
const rotate = () => {
  window.electron.send("set-rotating", !isRotating.value)
}

let prevMessage: string | null = null
const messageTextBoxContent = ref("")
const isPopupMessageActive = ref(false)
let clearPopupMessageTimeout: NodeJS.Timeout | null = null
const popupMessage = () => {
  if (clearPopupMessageTimeout) {
    clearTimeout(clearPopupMessageTimeout)
  }
  if (messageTextBoxContent.value === prevMessage) {
    messageTextBoxContent.value = ""
    isPopupMessageActive.value = false
    window.electron.send("set-popup-message", "")
  } else {
    isPopupMessageActive.value = true
    window.electron.send("set-popup-message", messageTextBoxContent.value)
    clearPopupMessageTimeout = setTimeout(() => {
      isPopupMessageActive.value = false
    }, 60000)
  }
}

const isAddingPlaylist = ref(false)
const addPlaylistResult = ref<boolean | null>(null)
const selectedPlaylist = ref<string | null>(null)
const playlists = ref<Playlist[]>([])
const fetchPlaylists = async () => {
  window.electron.send("get-playlists", [])
}
let resolveAddPlaylistSong: ((value: boolean) => void) | null = null
const addPlaylist = async () => {
  if (!info.value) return
  if (isAddingPlaylist.value) return
  if (selectedPlaylist.value) {
    isAddingPlaylist.value = true
    window.electron.send(
      "add-playlist-song",
      selectedPlaylist.value,
      info.value.id
    )
    addPlaylistResult.value = await new Promise<boolean>((resolve) => {
      resolveAddPlaylistSong = resolve
    })
    setTimeout(() => {
      addPlaylistResult.value = null

      isAddingPlaylist.value = false
    }, 3000)
  }
}

window.electron.receive("set-popup-message", (message: string) => {
  prevMessage = message
  messageTextBoxContent.value = message
  isPopupMessageActive.value = message !== ""
})
window.electron.receive("get-playlists-result", (value: Playlist[]) => {
  playlists.value = value
})
window.electron.receive("add-playlist-song-result", (value: boolean) => {
  if (resolveAddPlaylistSong) {
    resolveAddPlaylistSong(value)
    resolveAddPlaylistSong = null
  }
})
window.electron.receive("set-rotating", (value: boolean) => {
  isRotating.value = value
})
onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>
<template>
  <div
    v-if="info"
    id="main"
    ref="mainEl"
    :style="{
      backgroundImage: 'url(' + info.thumbnail + ')',
    }"
    :class="{ hover: isHovering }"
    :data-window-type="windowType"
    @mouseenter="() => (isHovering = true)"
    @mouseleave="() => (isHovering = false)"
  >
    <div id="bg-overlay">
      <div
        id="thumbnail"
        :style="{
          backgroundImage: `url(${info.thumbnail})`,
        }"
      />
      <template v-if="windowType === 'info'">
        <div
          id="info"
          :data-reason="info.reason"
          title="ニコニコで開く"
          @click="openNico"
        >
          <div id="info-top">
            <div id="title" ref="titleEl">
              <div ref="titleContentEl">
                {{ info.title
                }}<span id="smaller-artist">{{ info.artist }}</span>
              </div>
            </div>
          </div>
          <div
            id="progress"
            :style="{
              width: info.progress * 100 + '%',
            }"
          />
        </div>
        <div
          class="control-button"
          :title="`お気に入り：${info.favoriteCount}`"
          @click="toggleFavorite"
        >
          <HeartIcon v-if="info.favorited" />
          <HeartOutlineIcon v-else />
          <span id="favorite-count" :data-overflowing="isFavoriteOverflowing">{{
            favoriteCount
          }}</span>
        </div>
        <div
          class="control-button"
          title="ミュートを切り換え"
          @click="toggleMute"
        >
          <VolumeMuteIcon v-if="isMuted" />
          <VolumeHighIcon v-else />

          <span
            :style="{
              textDecoration: isMuted ? 'line-through' : 'none',
              textDecorationThickness: '2px',
            }"
            >{{ info.volume }}</span
          >
        </div>
        <div
          class="icon-button-wrapper"
          title="プレイリストに追加"
          @click="toPlaylistWindow"
        >
          <PlaylistMusicIcon />
        </div>
        <div
          id="tweet-button"
          class="icon-button-wrapper"
          title="今聴いている曲をツイート"
          @click="tweet"
        >
          <FontAwesomeIcon icon="fab fa-square-twitter" />
        </div>
      </template>
      <template v-else-if="windowType === 'playlist'">
        <select
          id="playlist-selector"
          v-model="selectedPlaylist"
          :disabled="!playlists.length || isAddingPlaylist"
          :data-result="addPlaylistResult"
        >
          <option
            v-for="item in playlists"
            :key="item.list_id"
            :value="item.list_id"
          >
            {{ item.list_title }} ({{ item.quantity }})<template
              v-if="addPlaylistResult !== null"
              >:
              {{
                addPlaylistResult ? "追加しました。" : "既に追加されています。"
              }}</template
            >
          </option>
        </select>
        <div
          class="icon-button-wrapper"
          title="プレイリストに追加"
          @click="addPlaylist"
        >
          <PlaylistPlusIcon v-if="addPlaylistResult === null" />
          <PlaylistCheckIcon
            v-else-if="addPlaylistResult"
            id="playlist-button-check"
          />
          <PlaylistRemoveIcon v-else id="playlist-button-failed" />
        </div>
        <div
          class="icon-button-wrapper"
          title="情報表示に戻る"
          @click="toInfoWindow"
        >
          <InformationIcon />
        </div>
      </template>
      <template v-else>
        <div
          id="rotate-button"
          class="icon-button-wrapper"
          :class="{ active: isRotating }"
          title="回る"
          @click="rotate"
        >
          <ReloadIcon />
        </div>
        <input
          id="message-textbox"
          v-model="messageTextBoxContent"
          type="text"
        />
        <div
          id="popup-message-button"
          class="icon-button-wrapper"
          :class="{ active: isPopupMessageActive }"
          title="吹き出し"
          @click="popupMessage"
        >
          <MessageIcon />
        </div>
      </template>
      <div
        v-if="windowType === 'info'"
        class="icon-button-wrapper"
        title="アクション"
        @click="toActionWindow"
      >
        <AutoFixIcon />
      </div>

      <div
        v-if="windowType === 'action'"
        class="icon-button-wrapper"
        title="情報表示に戻る"
        @click="toInfoWindow"
      >
        <InformationIcon />
      </div>

      <div
        id="minimize-button"
        class="icon-button-wrapper"
        title="最小化"
        @click="minimizeWindow"
      >
        <MinusIcon />
      </div>
    </div>
  </div>
</template>

<style>
body {
  overflow: hidden;
}
</style>

<style scoped lang="scss">
@use "~/src/utils.scss";

#main {
  position: absolute;
  inset: 0;
  background-size: 570px;
  background-position: left;
  background-repeat: no-repeat;
  transform: translateX(262px);
  transition:
    transform 0.2s,
    background-size 0.2s;
  overflow: hidden;
  margin-top: 55px;
  height: 40px;
  margin-left: 100px;
  user-select: none;
  transform: translateX(284px);
  &.hover,
  &:not([data-window-type="info"]) {
    transform: translateX(0);
    background-size: calc(100% + 6px);
  }
}
#bg-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  padding: 4px;
  padding-top: 3px;

  display: flex;
  flex-direction: row;
  align-items: center;
  inset: 0;
}
#thumbnail {
  height: 100%;
  aspect-ratio: 1;
  background-size: 180%;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 5px;
}
#info {
  @include utils.margin-x(5px);
  position: relative;
  height: 100%;
  width: 100%;
  max-width: calc(100% - 100vh);
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  color: white;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 1);
  }
  &[data-reason="priority_playlist"] {
    color: var(--color-priority_playlist);
  }
  &[data-reason="favorite"] {
    color: var(--color-favorite);
  }
  &[data-reason="add_playlist"] {
    color: var(--color-playlist);
  }
  &[data-reason="none"] {
    color: #ffffff;
  }
}
span.material-design-icon {
  height: 24px;
}
.control-button {
  width: 110px;
  margin-right: 5px;
  padding-left: 5px;
  height: 100%;
  display: flex;
  background: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  text-align: center;
  align-items: center;
  color: #bbb;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
  span.material-design-icon {
    margin-right: 2px;
    &.heart-icon {
      color: var(--color-favorite);
    }
    svg {
      width: 16px;
      aspect-ratio: 1;
      margin-right: 2px;
    }
  }
  span:not(.material-design-icon) {
    font-size: 12px;
    text-overflow: ellipsis;
  }
}
svg.favorited {
  color: var(--color-favorite);
}
svg[data-icon="heart"] {
  transition: color 0.2s;
}
#tweet-text {
  font-size: 12px;
}
#title {
  font-size: 15px;
  font-weight: bold;
  overflow: hidden;
  flex-grow: 1;
  position: relative;
}
#title div {
  white-space: nowrap;
  position: relative;
  width: fit-content;
  padding: 0 8px;
}
#info-top {
  position: relative;
  margin-top: 4px;
}
#artist {
  font-size: 15px;
  color: #bbb;
}
#publishedAt {
  margin-left: auto;
  font-size: 15px;
  color: #bbb;
}
#progress {
  position: absolute;
  bottom: 0;
  right: 0;
  height: 2px;
  background: #fff;
}
#window-control {
  display: flex;
  height: 100%;
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
  color: #bbb;
}
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.icon-button-wrapper {
  height: 100%;
  aspect-ratio: 1;
  display: flex;
  background: rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  text-align: center;
  align-items: center;
  justify-content: center;
  color: #bbb;
  cursor: pointer;
  margin-right: 5px;
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
  span.material-design-icon {
    &.heart-icon {
      color: var(--color-favorite);
    }
    svg {
      width: 16px;
      aspect-ratio: 1;
    }
  }
  &:last-child {
    margin-right: 0;
  }
  &.active {
    background: var(--color-primary);
    color: #000;
  }
}

#rotate-button {
  margin-left: 5px;
  &.active {
    span {
      animation: rotate 10s infinite linear;
    }
  }
}
#favorite-count {
  &[data-overflowing="true"] {
    font-size: 12px;
    &::after {
      content: "+";
      font-size: 8px;
    }
  }
}
#popup-message-button {
  margin-bottom: 1px;
}
#message-textbox {
  height: calc(100% - 4px);
  margin: 5px;
  margin-left: 0;
  flex-grow: 1;
}
#popup-message-button {
  margin-top: 0;
  margin-left: 0;
}

#smaller-artist {
  font-size: 12px;
  margin-left: 12px;
  color: #bbb;
}
#tweet-button {
  font-size: 24px;
}

#playlist-selector {
  @include utils.margin-x(5px);
  height: 100%;
  flex-grow: 1;

  transition:
    background 0.2s,
    color 0.2s;
  &[data-result="true"] {
    background: var(--color-priority_playlist);
    color: #fff;
  }
  &[data-result="false"] {
    background: var(--color-accent);
    color: #fff;
  }
}

#playlist-button-check {
  color: var(--color-priority_playlist);
}

#playlist-button-failed {
  color: var(--color-accent);
}

#minimize-button {
  margin-left: auto;
}
</style>
