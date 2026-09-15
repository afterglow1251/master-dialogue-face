import { onUnmounted, type Ref } from "vue";
import type * as THREE from "three";

import { useConversationStore } from "@/stores/conversation.store";
import { useEmotionStore } from "@/stores/emotion.store";
import { useSettingsStore } from "@/stores/settings.store";
import { SPEECH_SMOOTHING_ALPHA } from "@/utils/constants";
import { applyEMA } from "@/utils/ema";
import { composeSpeechTarget } from "@/utils/lipSync";
import { MOUTH_BLENDSHAPES } from "@/utils/visemes";

const MOUTH_KEYS: ReadonlySet<string> = MOUTH_BLENDSHAPES;

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
  const conversationStore = useConversationStore();

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

    const mouth = conversationStore.currentMouthShape();
    const target = composeSpeechTarget(emotionStore.currentBlendshapes, mouth);
    if (!target) {
      onFrame();
      return;
    }

    const emotionAlpha = settingsStore.smoothingAlpha;
    currentBlendshapes = applyEMA(currentBlendshapes, target, (key) =>
      mouth && MOUTH_KEYS.has(key) ? SPEECH_SMOOTHING_ALPHA : emotionAlpha,
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
