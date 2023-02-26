<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import "./kiiteLike.scss"
import colors from "../colors"

const colorMap = ref(new Map<string, string>())

const setColor = (name: string) => {
  const colorInput = document.querySelector(
    `input[data-name="${name}"]`
  ) as HTMLInputElement
  colorMap.value.set(name, colorInput.value)
  updateColors()
  sendColors()
}
const resetColor = (name: string) => {
  colorMap.value.set(name, colors.find((c) => c.name === name)?.default || "")
  updateColors()
  sendColors()
}

const sendColors = () => {
  window.electron.send("set-colors", [...colorMap.value.entries()])
}

const updateColors = () => {
  for (const [name, color] of colorMap.value) {
    const colorInput = document.querySelector(
      `input[data-name="${name}"]`
    ) as HTMLInputElement
    colorInput.value = color
  }
}

const setColors = (value: [string, string][]) => {
  colorMap.value = new Map(value)
  updateColors()
}

onMounted(() => {
  window.electron.send("get-colors")
  window.electron.receive("set-colors", setColors)
})

onUnmounted(() => {
  window.electron.remove("set-colors", setColors)
})
</script>

<template>
  <div class="root">
    <h2>設定</h2>
    <div class="exp">
      この画面の外をクリックして設定を閉じます。

      <h4>カスタム色</h4>
      <ul id="colors">
        <li v-for="color in colors" :key="color.name" class="color">
          <label>
            <input
              id="color"
              type="color"
              :data-name="color.name"
              @change="setColor(color.name)"
            />
            <span>{{ color.label }}</span>
          </label>
          <span role="button" class="reset" @click="resetColor(color.name)"
            >リセット（{{ color.default }}）</span
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.exp {
  padding: 20px 10px 0px 40px;
  line-height: 1.5em;

  b {
    font-weight: bold;
    color: cyan;
  }
}

h4 {
  margin-top: 20px;
}

#colors {
  list-style: none;
  padding-left: 0;
  .color {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;

    input {
      margin-right: 0.5rem;
    }
    label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .reset {
      margin-left: 0.5rem;
      color: #aaa;
      cursor: pointer;
      text-decoration: underline;
    }
  }
}
</style>
