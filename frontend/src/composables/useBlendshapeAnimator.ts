import { onUnmounted, type Ref } from "vue";
import type * as THREE from "three";

import { useConversationStore } from "@/stores/conversation.store";
import { useEmotionStore } from "@/stores/emotion.store";
import { useSettingsStore } from "@/stores/settings.store";
import { SPEECH_SMOOTHING_ALPHA } from "@/utils/constants";
import { alphaToTau, applyEMA, frameAlpha } from "@/utils/ema";
import { composeSpeechTarget } from "@/utils/lipSync";
import { MOUTH_BLENDSHAPES } from "@/utils/visemes";

const MOUTH_KEYS: ReadonlySet<string> = MOUTH_BLENDSHAPES;
const SPEECH_TAU_SECONDS = alphaToTau(SPEECH_SMOOTHING_ALPHA);
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Animation loop that smoothly interpolates blendshape values using EMA.
 *
 * Runs outside Vue reactivity via requestAnimationFrame, with a frame-rate
 * independent EMA alpha derived from the real frame delta. Reads target values
 * from emotion store, writes directly to mesh.morphTargetInfluences for
 * maximum performance.
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
  let lastFrameTime = 0;

  function animate() {
    if (!isRunning) return;

    animationFrameId = requestAnimationFrame(animate);

    const now = performance.now();
    const deltaSeconds = (now - lastFrameTime) / MILLISECONDS_PER_SECOND;
    lastFrameTime = now;

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

    const emotionAlpha = frameAlpha(
      alphaToTau(settingsStore.smoothingAlpha),
      deltaSeconds,
    );
    const speechAlpha = frameAlpha(SPEECH_TAU_SECONDS, deltaSeconds);
    currentBlendshapes = applyEMA(currentBlendshapes, target, (key) =>
      mouth && MOUTH_KEYS.has(key) ? speechAlpha : emotionAlpha,
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
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  function stop() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
  }

  onUnmounted(stop);

  return { start, stop };
}
