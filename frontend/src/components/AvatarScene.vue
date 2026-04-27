<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useResizeObserver } from "@vueuse/core";

import { useThreeScene } from "@/composables/useThreeScene";
import { useAvatarLoader } from "@/composables/useAvatarLoader";
import { useBlendshapeAnimator } from "@/composables/useBlendshapeAnimator";

const props = defineProps<{
  modelUrl: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const { scene, init, resize, render } = useThreeScene(canvasRef);
const { meshes, morphMap, isLoaded, error, loadAvatar } =
  useAvatarLoader(scene);
const { start } = useBlendshapeAnimator(meshes, morphMap, render);

useResizeObserver(containerRef, () => {
  resize();
});

onMounted(async () => {
  init();
  await loadAvatar(props.modelUrl);

  if (isLoaded.value) {
    start();
  }
});
</script>

<template>
  <div ref="containerRef" class="relative h-full w-full">
    <canvas ref="canvasRef" class="h-full w-full" />

    <!-- Error state -->
    <div
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-destructive/10"
    >
      <p class="text-sm text-destructive">{{ error }}</p>
    </div>
  </div>
</template>
