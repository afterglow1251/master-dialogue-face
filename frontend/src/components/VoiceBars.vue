<script setup lang="ts">
const ICON_SIZE = 16;

const BARS = [
  { x: 6, delayMs: 0 },
  { x: 10, delayMs: 240 },
  { x: 14, delayMs: 480 },
  { x: 18, delayMs: 120 },
] as const;
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="ICON_SIZE"
    :height="ICON_SIZE"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <line
      v-for="bar in BARS"
      :key="bar.x"
      :x1="bar.x"
      :x2="bar.x"
      y1="6"
      y2="18"
      class="origin-center animate-voice-bar [transform-box:fill-box] motion-reduce:animate-none"
      :style="{ animationDelay: `${bar.delayMs}ms` }"
    />
  </svg>
</template>
