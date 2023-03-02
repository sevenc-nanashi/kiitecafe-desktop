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

const growEffect = ref<HTMLInputElement>()
const setGlowEffect = () => {
  window.electron.send("set-glow-effect", growEffect.value!.checked)
}

onMounted(() => {
  window.electron.send("get-settings")
  window.electron.receive("set-colors", setColors)
  window.electron.receive("set-glow-effect", (value: boolean) => {
    growEffect.value!.checked = value
  })
})
</script>

<template>
  <div class="root">
    <h2>設定</h2>
    <div class="exp">
      この画面の外をクリックして設定を閉じます。

      <h4>外観</h4>
      <ul id="appearance">
        <li v-for="color in colors" :key="color.name" class="setting-item">
          <label>
            <input
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
        <li class="setting-item">
          <label>
            <input
              id="grow-effect"
              ref="growEffect"
              type="checkbox"
              @change="setGlowEffect"
            />
            <span>輝きを強化</span>
          </label>
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

#appearance {
  list-style: none;
  padding-left: 0;
  .setting-item {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
    cursor: pointer;

    input {
      margin-right: 0.5rem;
      cursor: pointer;
    }
    label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .reset {
      margin-left: 0.5rem;
      color: #aaa;
      text-decoration: underline;
    }
  }
}
</style>
