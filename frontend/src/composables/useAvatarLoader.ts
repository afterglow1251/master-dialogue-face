import { ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MIN_MORPH_TARGETS_COUNT = 50;

export function useAvatarLoader(scene: THREE.Scene) {
  const meshes = ref<THREE.Mesh[]>([]);
  const morphMap = ref<Map<string, number>>(new Map());
  const isLoaded = ref(false);
  const error = ref<string | null>(null);

  async function loadAvatar(url: string) {
    const loader = new GLTFLoader();

    try {
      const gltf = await loader.loadAsync(url);
      scene.add(gltf.scene);

      const found: THREE.Mesh[] = [];

      gltf.scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (!child.morphTargetDictionary) return;
        if (!child.morphTargetInfluences) return;

        const targetCount = Object.keys(child.morphTargetDictionary).length;
        if (targetCount < MIN_MORPH_TARGETS_COUNT) return;

        found.push(child);

        if (morphMap.value.size === 0) {
          const newMorphMap = new Map<string, number>();
          for (const [name, index] of Object.entries(
            child.morphTargetDictionary,
          )) {
            newMorphMap.set(name, index);
          }
          morphMap.value = newMorphMap;
        }
      });

      if (found.length === 0) {
        error.value = "No mesh with morph targets found in model";
        console.error(error.value);
        return;
      }

      meshes.value = found;
      isLoaded.value = true;
      console.log(
        `Avatar loaded: ${found.length} mesh(es), ${morphMap.value.size} morph targets`,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to load avatar";
      console.error("Avatar loading error:", error.value);
    }
  }

  return { meshes, morphMap, isLoaded, error, loadAvatar };
}
