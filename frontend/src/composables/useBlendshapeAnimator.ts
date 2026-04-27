import { onUnmounted, type Ref } from "vue";
import type * as THREE from "three";

import { useEmotionStore } from "@/stores/emotion.store";
import { useSettingsStore } from "@/stores/settings.store";
import { applyEMA } from "@/utils/ema";

/**
 * Animation loop that smoothly interpolates blendshape values using EMA.
 *
 * Runs outside Vue reactivity at 60fps via requestAnimationFrame.
 * Reads target values from emotion store, writes directly to
 * mesh.morphTargetInfluences for maximum performance.
 */
export function useBlendshapeAnimator(
  meshes: Ref<THREE.Mesh[]>,
  morphMap: Ref<Map<string, number>>,
  onFrame: () => void,
) {
  const emotionStore = useEmotionStore();
  const settingsStore = useSettingsStore();

  let currentBlendshapes: Record<string, number> = {};
  let animationFrameId = 0;
  let isRunning = false;

  function animate() {
    if (!isRunning) return;

    animationFrameId = requestAnimationFrame(animate);

    const meshList = meshes.value;
    if (meshList.length === 0) {
      onFrame();
      return;
    }

    const target = emotionStore.currentBlendshapes;
    if (!target) {
      onFrame();
      return;
    }

    currentBlendshapes = applyEMA(
      currentBlendshapes,
      target,
      settingsStore.smoothingAlpha,
    );

    for (const [name, index] of morphMap.value.entries()) {
      const value = currentBlendshapes[name] ?? 0;
      for (const m of meshList) {
        if (m.morphTargetInfluences) {
          m.morphTargetInfluences[index] = value;
        }
      }
    }

    onFrame();
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    animationFrameId = requestAnimationFrame(animate);
  }

  function stop() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
  }

  onUnmounted(stop);

  return { start, stop };
}
