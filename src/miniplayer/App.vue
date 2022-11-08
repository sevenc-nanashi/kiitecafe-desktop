<script setup lang="ts">
import { watch, ref } from "vue";
const info = ref<NowPlayingInfo>();
window.electron.receive("now-playing-info", (npinfo: NowPlayingInfo) => {
  info.value = npinfo;
});

const titleEl = ref<HTMLDivElement>();
const titleContentEl = ref<HTMLDivElement>();

watch([titleEl, titleContentEl], ([el, conEl]) => {
  console.log(el, conEl);
  if (!el || !conEl) {
    return;
  }
  conEl.animate(
    [
      { left: "0", offset: 0.2 },
      { left: (el.scrollWidth - el.clientWidth) * -1 + "px", offset: 0.8 },
    ],
    { duration: 10000, iterations: Infinity }
  );
});
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
    :style="{
      backgroundImage: 'url(' + info.thumbnail + ')',
    }"
  >
    <div id="bg-overlay">
      <div
        id="thumbnail"
        :style="{
          backgroundImage: `url(${info.thumbnail})`,
        }"
      />
      <div id="info">
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
    </div>
  </div>
</template>

<style scoped>
#main {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
#bg-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  padding: 5px;

  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
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
  max-width: calc(100% - 100vh);
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  color: white;
  margin: 10px;
  padding: 10px;
  box-sizing: border-box;
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
