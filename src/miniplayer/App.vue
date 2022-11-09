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

const windowType = ref<"normal" | "smaller">("smaller");

const toNormalWindow = () => {
  windowType.value = "normal";
};
const toSmallerWindow = () => {
  windowType.value = "smaller";
};
const minimizeWindow = () => {
  window.electron.send("minimize", []);
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
    :class="{ hover: isHovering, smaller: windowType === 'smaller' }"
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
            <div ref="titleContentEl">
              {{ info.title
              }}<span v-if="windowType === 'smaller'" id="smaller-artist">{{
                info.artist
              }}</span>
            </div>
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
        ></i>
        <br v-if="windowType !== 'smaller'" />
        <span>{{ info.favoriteCount }}</span>
      </div>
      <div class="control-button" @click="toggleMute">
        <i
          class="fa-solid"
          :class="{ 'fa-volume-mute': isMuted, 'fa-volume-up': !isMuted }"
        ></i>

        <br v-if="windowType !== 'smaller'" />
        <span
          :style="{
            textDecoration: isMuted ? 'line-through' : 'none',
            textDecorationThickness: '2px',
          }"
          >{{ info.volume }}</span
        >
      </div>
      <div class="control-button" @click="tweet">
        <i class="fa-brands fa-square-twitter"></i>
        <br v-if="windowType !== 'smaller'" />
        <span id="tweet-text" v-if="windowType !== 'smaller'">ツイート</span>
      </div>
      <div id="window-control">
        <i
          class="fa-regular fa-square-minus"
          @click="minimizeWindow"
          title="ミニプレイヤーを最小化"
        ></i>
        <i
          class="fa-solid fa-down-left-and-up-right-to-center"
          v-if="windowType === 'normal'"
          @click="toSmallerWindow"
          title="コンパクト表示"
        ></i>
        <i
          class="fa-solid fa-up-right-and-down-left-from-center"
          v-if="windowType === 'smaller'"
          @click="toNormalWindow"
          title="拡大表示"
        ></i>
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
  margin-left: 5px;
  transform: translateX(262px);
  margin-top: 5px;
  transition: transform 0.2s, background-size 0.2s;
  overflow: hidden;
  &.smaller {
    margin-top: 55px;
    height: 40px;
    margin-left: 100px;
    transform: translateX(265px);
  }
  &.hover {
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

  &:hover {
    background: rgba(0, 0, 0, 1);
  }
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
  &:hover {
    background: rgba(0, 0, 0, 1);
    color: white;
  }
  i {
    font-size: 35px;
  }
  span {
    font-size: 15px;
  }
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
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 2px;
  color: #bbb;
  i {
    font-size: 24px;
    display: block;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px;
    &:hover {
      background: rgba(0, 0, 0, 1);
      color: white;
    }
  }
}
.smaller {
  #thumbnail {
    border-radius: 5px;
  }
  .control-button {
    height: calc(100% - 1px);
    padding: 0;
    padding-top: 5px;
  }
  .control-button i {
    font-size: 20px;
    margin-right: 4px;
  }
  #title {
    font-size: 15px;
  }

  #smaller-artist {
    font-size: 12px;
    margin-left: 12px;
    color: #bbb;
  }
  #info-bottom {
    display: none;
  }

  #window-control {
    height: calc(100% - 1px);
    margin-top: 1px;
    flex-direction: row;
    i {
      padding: 5px;
      font-size: 20px;
      &:first-child {
        margin-right: 5px;
      }
    }
  }
}
</style>
