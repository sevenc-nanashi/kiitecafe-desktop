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
import { watch, ref } from "vue"
const info = ref<NowPlayingInfo>()
window.electron.receive("now-playing-info", (npinfo: NowPlayingInfo) => {
  info.value = npinfo
})

const mainEl = ref<HTMLDivElement>()
const titleEl = ref<HTMLDivElement>()
const titleContentEl = ref<HTMLDivElement>()
const animations: Animation[] = []

const isHovering = ref(false)
const isMuted = ref(false)

document.documentElement.addEventListener("mouseleave", () => {
  isHovering.value = false
})

watch(isHovering, (value) => {
  window.electron.send("set-ignore-mouse-events", !value)
})

watch(
  info,
  (newInfo, oldInfo) => {
    if (newInfo?.id === oldInfo?.id && animations.length > 0) {
      return
    }
    animations.forEach((a) => a.cancel())
    const titlEl = titleEl.value
    const conEl = titleContentEl.value
    if (!conEl || !titlEl) {
      return
    }
    if (conEl.scrollWidth - titlEl.clientWidth < 0) {
      return
    }
    animations.push(
      conEl.animate(
        [
          { left: 0, offset: 0.2 },
          {
            left: `-${conEl.scrollWidth - titlEl.clientWidth}px`,
            offset: 0.7,
          },
        ],
        { duration: 10000, iterations: Infinity }
      )
    )
  },
  { immediate: true }
)

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

const windowType = ref<"action" | "info">("info")

const toActionWindow = () => {
  windowType.value = "action"
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
    `Kiite Cafe DesktopをつかってKiite Cafeできいてます https://github.com/sevenc-nanashi/kiitecafe-desktop https://cafe.kiite.jp https://nico.ms/${info.value.id}`
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

const addPlaylist = () => {
  window.electron.send("add-playlist", info.value?.id)
}

window.electron.receive("set-popup-message", (message: string) => {
  prevMessage = message
  messageTextBoxContent.value = message
  isPopupMessageActive.value = message !== ""
})
window.electron.receive("set-rotating", (value: boolean) => {
  isRotating.value = value
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
        <div id="info" :data-reason="info.reason" @click="openNico">
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
        <div class="control-button" @click="toggleFavorite">
          <HeartIcon v-if="info.favorited" />
          <HeartOutlineIcon v-else />
          <span>{{ info.favoriteCount }}</span>
        </div>
        <div class="control-button" @click="toggleMute">
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
        <div class="icon-button-wrapper" @click="addPlaylist">
          <PlaylistMusicIcon />
        </div>
        <div id="tweet-button" class="icon-button-wrapper" @click="tweet">
          <FontAwesomeIcon icon="fab fa-square-twitter" />
        </div>
      </template>
      <template v-else>
        <div
          id="rotate-button"
          class="icon-button-wrapper"
          :class="{ active: isRotating }"
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
          @click="popupMessage"
        >
          <MessageIcon />
        </div>
      </template>
      <div
        v-if="windowType === 'info'"
        class="icon-button-wrapper"
        @click="toActionWindow"
      >
        <AutoFixIcon />
      </div>

      <div
        v-if="windowType === 'action'"
        class="icon-button-wrapper"
        @click="toInfoWindow"
      >
        <InformationIcon />
      </div>

      <div class="icon-button-wrapper" @click="minimizeWindow">
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
#main {
  position: absolute;
  inset: 0;
  background-size: 570px;
  background-position: left;
  background-repeat: no-repeat;
  transform: translateX(262px);
  transition: transform 0.2s, background-size 0.2s;
  overflow: hidden;
  margin-top: 55px;
  height: 40px;
  margin-left: 100px;
  transform: translateX(284px);
  &.hover,
  &[data-window-type="action"] {
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
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 5px;
}
#info {
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
  margin-right: 5px;
  margin-left: 5px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 1);
  }
  &[data-reason="priority_playlist"] {
    color: #00feff;
  }
  &[data-reason="favorite"] {
    color: #ff33aa;
  }
  &[data-reason="add_playlist"] {
    color: #10d300;
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
      color: #ff33aa;
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
  color: #ff33aa;
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
      color: #ff33aa;
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
    background: #fffe00;
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
#popup-message-button {
  margin-bottom: 1px;
}
#message-textbox {
  margin: 6px 4px 8px 0;
  height: calc(100% - 5px);
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
</style>
