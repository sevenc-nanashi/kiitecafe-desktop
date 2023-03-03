<script setup lang="ts">
import { onMounted } from "vue"
import { UpdateAvailable } from "^/type/common"

import "./kiiteLike.scss"
const props = defineProps<{
  updateAvailable: UpdateAvailable
  currentVersion: string
}>()
</script>

<template>
  <div>
    <h2>Kiite Cafe Desktopについて</h2>
    <div class="exp">
      Kiite Cafeのデスクトップ版です。

      <h4>機能</h4>

      <ul id="features">
        <li><b>バックグラウンド再生</b></li>
        <li>いいねができる<b>ミニプレイヤー</b></li>
        <li>
          動画フリーズ（動画が消えてそれ以外は動いている状態）時の<b
            >自動復帰</b
          >
        </li>
      </ul>

      <ul id="app-info">
        <li>
          <b>開発者：</b
          ><a href="https://kiite.jp/user/sevenc_nanashi" target="_blank"
            >名無し｡</a
          >
        </li>
        <li><b>バージョン：</b>{{ props.currentVersion }}</li>
        <li>
          <b>ソースコード：</b
          ><a
            href="https://github.com/sevenc-nanashi/kiitecafe-desktop"
            target="_blank"
            >sevenc-nanashi/kiitecafe-desktop</a
          >
        </li>
      </ul>
      <div v-if="props.updateAvailable" id="new-version">
        <h4>新しいバージョンがリリースされました！</h4>
        <p>
          バージョン<b>{{ props.updateAvailable.tag_name }}</b>
          がリリースされました。
          <a :href="props.updateAvailable.html_url" target="_blank">
            ダウンロードする</a
          >
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.exp {
  margin: 20px 10px 0px 40px;
  line-height: 1.5em;

  b {
    font-weight: bold;
    color: var(--color-primary);
  }
  #features {
    margin-top: 0.5rem;
    list-style: disc;
    padding-left: 1.5rem;
  }

  #app-info {
    margin-top: 1.5rem;
    list-style: none;
    padding-left: 0;
  }

  #new-version {
    h4 {
      margin-bottom: 0.5rem;
      color: var(--color-primary);
    }
  }
}
</style>
