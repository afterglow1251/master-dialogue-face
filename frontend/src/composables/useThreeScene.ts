import { onUnmounted, ref, type Ref } from "vue";
import * as THREE from "three";

const CAMERA_FOV = 25;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
const CAMERA_POSITION = { x: 0, y: 1.55, z: 1.5 } as const;
const CAMERA_LOOK_AT = { x: 0, y: 1.55, z: 0 } as const;

const AMBIENT_LIGHT_INTENSITY = 0.6;
const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
const DIRECTIONAL_LIGHT_POSITION = { x: 1, y: 2, z: 2 } as const;

const BACKGROUND_COLOR = 0xf0f0f0;

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_COLOR);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    1,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
  camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);

  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    AMBIENT_LIGHT_INTENSITY,
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    DIRECTIONAL_LIGHT_INTENSITY,
  );
  directionalLight.position.set(
    DIRECTIONAL_LIGHT_POSITION.x,
    DIRECTIONAL_LIGHT_POSITION.y,
    DIRECTIONAL_LIGHT_POSITION.z,
  );
  scene.add(directionalLight);

  let renderer: THREE.WebGLRenderer | null = null;
  const isInitialized = ref(false);

  function init() {
    if (!canvasRef.value) return;

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    resize();
    isInitialized.value = true;
  }

  function resize() {
    if (!renderer || !canvasRef.value) return;

    const parent = canvasRef.value.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function render() {
    if (!renderer) return;
    renderer.render(scene, camera);
  }

  function dispose() {
    renderer?.dispose();
    renderer = null;
    isInitialized.value = false;
  }

  onUnmounted(dispose);

  return { scene, camera, isInitialized, init, resize, render, dispose };
}
