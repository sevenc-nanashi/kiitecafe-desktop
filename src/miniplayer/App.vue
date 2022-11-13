<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
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
const popupMessage = () => {
  if (messageTextBoxContent.value === prevMessage) {
    messageTextBoxContent.value = ""
    isPopupMessageActive.value = false
    window.electron.send("set-popup-message", "")
  } else {
    isPopupMessageActive.value = true
    window.electron.send("set-popup-message", messageTextBoxContent.value)
  }
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
        <div id="info" @click="openNico">
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
          <FontAwesomeIcon
            :icon="info.favorited ? ['fas', 'fa-heart'] : ['far', 'fa-heart']"
            :class="{ favorited: info.favorited }"
          />
          <br v-if="windowType !== 'info'" />
          <span>{{ info.favoriteCount }}</span>
        </div>
        <div class="control-button" @click="toggleMute">
          <FontAwesomeIcon
            :icon="isMuted ? ['fas', 'volume-mute'] : ['fas', 'volume-up']"
          />

          <br v-if="windowType !== 'info'" />
          <span
            :style="{
              textDecoration: isMuted ? 'line-through' : 'none',
              textDecorationThickness: '2px',
            }"
            >{{ info.volume }}</span
          >
        </div>
        <div class="control-button" @click="tweet">
          <FontAwesomeIcon icon="fab fa-square-twitter" />
          <br v-if="windowType !== 'info'" />
          <span v-if="windowType !== 'info'" id="tweet-text">ツイート</span>
        </div>
      </template>
      <template v-else>
        <div
          id="rotate-button"
          class="icon-button-wrapper"
          :class="{ active: isRotating }"
          @click="rotate"
        >
          <FontAwesomeIcon icon="fas fa-rotate-right" title="回る" />
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
          <FontAwesomeIcon icon="fas fa-message" title="吹き出し" />
        </div>
      </template>
      <div id="window-control">
        <FontAwesomeIcon
          v-if="windowType === 'info'"
          icon="fas fa-comment"
          class="icon-button"
          @click="toActionWindow"
        />
        <FontAwesomeIcon
          v-if="windowType === 'action'"
          icon="fas fa-info"
          class="icon-button"
          @click="toInfoWindow"
        />
        <FontAwesomeIcon
          icon="far fa-square-minus"
          class="icon-button"
          @click="minimizeWindow"
        />
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
  transform: translateX(268px);
  &.hover, &[data-window-type="action"] {
    transform: translateX(0);
    background-size: calc(100% + 6px);
  }
}
#bg-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  padding: 5px;

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
  height: calc(100% + 1px);
  width: 100%;
  max-width: calc(100% - 100vh);
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  color: white;
  margin: 10px;
  margin-top: 11px;
  margin-right: 5px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 1);
  }
}
.control-button {
  width: 110px;
  height: calc(100% - 1px);
  padding: 0;
  padding-top: 5px;
  background: rgba(0, 0, 0, 0.5);
  margin-top: 3px;
  margin-right: 5px;
  margin-bottom: 5px;
  box-sizing: border-box;
  text-align: center;
  color: #bbb;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
  svg {
    font-size: 20px;
    margin-right: 4px;
  }
  span {
    font-size: 15px;
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
  height: calc(100% - 2px);
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 2px;
  color: #bbb;
}
.icon-button {
  font-size: 19px;
  display: block;
  cursor: pointer;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  margin-right: 5px;
  color: #bbb;
  &:last-child {
    margin-right: 0;
  }
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
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
  font-size: 19px;
  height: calc(100% - 1px);
  display: flex;
  cursor: pointer;
  position: relative;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.5);
  margin: 5px;
  margin-top: 3px;
  aspect-ratio: 1;
  color: #bbb;
  svg {
    margin: auto;
  }
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
  &.active {
    background: #fffe00;
    color: #000;
  }
}
#rotate-button {
  margin-left: 10px;
  &.active {
    svg {
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
</style>
