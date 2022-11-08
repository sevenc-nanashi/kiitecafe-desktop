<script setup lang="ts">
import { watch, ref } from "vue";
const info = ref<NowPlayingInfo>();
window.electron.receive("now-playing-info", (npinfo: NowPlayingInfo) => {
  info.value = npinfo;
});

const mainEl = ref<HTMLDivElement>();
const titleEl = ref<HTMLDivElement>();
const titleContentEl = ref<HTMLDivElement>();
const titleToAnimation = new Map<string, Animation>();

const isHovering = ref(false);
const isMuted = ref(false);

document.documentElement.addEventListener("mouseleave", (e) => {
  isHovering.value = false;
});

watch(isHovering, (value) => {
  window.electron.send("set-ignore-mouse-events", !value);
});

watch([info, titleEl, titleContentEl], ([inf, el, conEl]) => {
  if (!inf || !el || !conEl) {
    return;
  }
  titleToAnimation.set(
    inf.id ?? "",
    conEl.animate(
      [
        { left: "0", offset: 0.2 },
        { left: (el.scrollWidth - el.clientWidth) * -1 + "px", offset: 0.8 },
      ],
      { duration: 10000, iterations: Infinity }
    )
  );
});
watch(info, (newInfo, oldInfo) => {
  if (newInfo?.id === oldInfo?.id) {
    return;
  }
  titleToAnimation.get(oldInfo?.id || "")?.cancel();
});

window.electron.receive("set-muted", (value: boolean) => {
  isMuted.value = value;
});

const toggleMute = () => {
  window.electron.send("set-muted", !isMuted.value);
};

const toggleFavorite = () => {
  window.electron.send("set-favorite", !info.value?.favorited);
};

const openNico = () => {
  window.open(`https://www.nicovideo.jp/watch/${info.value?.id}`);
};

const tweet = () => {
  if (!info.value) return;
  const text =
    `♪ ${info.value.title} #${info.value.id} #Kiite\n` +
    `Kiite Cafe DesktopをつかってKiite Cafeできいてます https://github.com/sevenc-nanashi/kiitecafe-desktop https://cafe.kiite.jp https://nico.ms/${info.value.id}`;
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  );
};
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  unmounted() {},
});
</script>

<template>
  <div
    id="main"
    v-if="info"
    ref="mainEl"
    :style="{
      backgroundImage: 'url(' + info.thumbnail + ')',
    }"
    :class="{ hover: isHovering }"
    v-on:mouseenter="() => (isHovering = true)"
    v-on:mouseleave="() => (isHovering = false)"
  >
    <div id="bg-overlay">
      <div
        id="thumbnail"
        :style="{
          backgroundImage: `url(${info.thumbnail})`,
        }"
      />
      <div id="info" @click="openNico">
        <div id="info-top">
          <div id="title" ref="titleEl">
            <div ref="titleContentEl">{{ info.title }}</div>
          </div>
        </div>
        <div id="info-bottom">
          <div id="artist">{{ info.artist }}</div>
          <div id="publishedAt">{{ info.publishedAt }}</div>
        </div>
        <div
          id="progress"
          :style="{
            width: info.progress * 100 + '%',
          }"
        />
      </div>
      <div class="control-button" @click="toggleFavorite">
        <i
          class="fa-heart"
          :class="{
            'fa-solid': info.favorited,
            'fa-regular': !info.favorited,
          }"
        ></i
        ><br />
        <span>{{ info.favoriteCount }}</span>
      </div>
      <div class="control-button" @click="toggleMute">
        <i
          class="fa-solid"
          :class="{ 'fa-volume-mute': isMuted, 'fa-volume-up': !isMuted }"
        ></i
        ><br />
        <span>{{ info.volume }}</span>
      </div>
      <div class="control-button" @click="tweet">
        <i class="fa-brands fa-square-twitter"></i>
        <br />
        <span id="tweet-text">ツイート</span>
      </div>
    </div>
  </div>
</template>

<style>
body {
  overflow: hidden;
}
</style>

<style scoped>
#main {
  position: absolute;
  inset: 0;
  background-size: 570px;
  background-position: left;
  background-repeat: no-repeat;
  margin-left: 5px;
  transform: translateX(236px);
  margin-top: 5px;
  transition: transform 0.2s, background-size 0.2s;
  overflow: hidden;
}
#main.hover {
  transform: translateX(0);
  background-size: calc(100% + 6px);
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
  border-radius: 10px;
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
  margin: 10px;
  margin-right: 5px;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
}
#info:hover {
  background: rgba(0, 0, 0, 1);
}
.control-button {
  width: 110px;
  height: calc(100vh - 17px);
  background: rgba(0, 0, 0, 0.5);
  margin-top: 3px;
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
  color: #bbb;
  cursor: pointer;
}
.control-button i {
  font-size: 35px;
}
.control-button span {
  font-size: 15px;
}
.control-button:hover {
  background: rgba(0, 0, 0, 1);
  color: white;
}
.fa-solid.fa-heart {
  color: #ff33aa;
}
#tweet-text {
  font-size: 12px;
}
#title {
  font-size: 20px;
  font-weight: bold;
  overflow: hidden;
  flex-grow: 1;
  position: relative;
}
#title div {
  white-space: nowrap;
  position: relative;
}
#info-top {
  position: relative;
  margin-top: 4px;
}
#info-bottom {
  display: flex;
  margin-top: auto;
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
</style>
