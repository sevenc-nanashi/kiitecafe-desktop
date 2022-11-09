<script setup lang="ts">
import { ref } from "vue";

const isAboutVisible = ref(false);

window.electron.receive("show-about", () => {
  isAboutVisible.value = true;
});
</script>

<template>
  <div id="about" v-if="isAboutVisible">
    <h1>Kiite Cafe Desktopについて</h1>
  </div>
</template>

<style scoped>
#about {
  background: #0008;
  position: absolute;
  inset: 20px;
  z-index: 100;
}
</style>
