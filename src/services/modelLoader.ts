import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface ModelTemplate {
  id: string;
  name: string;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  targetAvatar: 'kai' | 'mira';
}

export interface AvatarRuntimeInstance {
  id: string;
  scene: THREE.Group;
  mixer: THREE.AnimationMixer;
  idleAction?: THREE.AnimationAction;
  walkAction?: THREE.AnimationAction;
  targetAvatar: 'kai' | 'mira';
}

export interface LoadedCustomModel {
  id: string;
  name: string;
  scene: THREE.Group | THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  animations: THREE.AnimationClip[];
  targetAvatar: 'kai' | 'mira';
}

// In-memory template registry
const templateRegistry = new Map<'kai' | 'mira', ModelTemplate>();
// User-uploaded model registry
const customModelRegistry = new Map<string, LoadedCustomModel>();

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let preloadPromise: Promise<void> | null = null;
let isPreloading = false;

/**
 * Builds an in-place AnimationClip by cloning tracks and zeroing out root/pelvis Z motion
 * so the character walks in place when WASD controls drive position.
 */
function createInPlaceClip(
  originalClip: THREE.AnimationClip,
  clipName: string,
  prefixFrom?: string,
  prefixTo?: string
): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of originalClip.tracks) {
    const clone = track.clone();
    if (prefixFrom && prefixTo) {
      clone.name = clone.name.replace(prefixFrom, prefixTo);
    }

    // Zero out X & Z translation on the root bone so walk cycle stays in place
    if (
      clone.name.endsWith('root.position') ||
      clone.name.endsWith('pelvis.position') ||
      clone.name.endsWith('hip.position')
    ) {
      if (clone.name.endsWith('root.position')) {
        for (let i = 0; i < clone.values.length; i += 3) {
          clone.values[i] = 0; // X
          clone.values[i + 1] = 0; // Y
          clone.values[i + 2] = 0; // Z
        }
      }
    }
    tracks.push(clone);
  }

  return new THREE.AnimationClip(clipName, originalClip.duration, tracks);
}

/**
 * Preloads both Boy (Nathan) and Girl (Sophia) 3D rigged FBX models, textures,
 * materials, and sets up retargeted animations (idle & walk) for both characters.
 */
export async function preloadCoupleAvatars(): Promise<void> {
  if (templateRegistry.has('kai') && templateRegistry.has('mira')) {
    return;
  }
  if (preloadPromise) {
    return preloadPromise;
  }

  isPreloading = true;

  preloadPromise = (async () => {
    try {
      // 1. Load textures in parallel
      const [
        nathanDif,
        nathanNorm,
        nathanGloss,
        sophiaDif,
        sophiaNorm,
        sophiaGloss,
      ] = await Promise.all([
        textureLoader.loadAsync('/boymodels/tex/rp_nathan_animated_003_dif.jpg'),
        textureLoader.loadAsync('/boymodels/tex/rp_nathan_animated_003_norm.jpg'),
        textureLoader.loadAsync('/boymodels/tex/rp_nathan_animated_003_gloss.jpg'),
        textureLoader.loadAsync('/models/tex/rp_sophia_animated_003_dif.jpg'),
        textureLoader.loadAsync('/models/tex/rp_sophia_animated_003_norm.jpg'),
        textureLoader.loadAsync('/models/tex/rp_sophia_animated_003_gloss.jpg'),
      ]);

      nathanDif.colorSpace = THREE.SRGBColorSpace;
      sophiaDif.colorSpace = THREE.SRGBColorSpace;

      const nathanMaterial = new THREE.MeshStandardMaterial({
        map: nathanDif,
        normalMap: nathanNorm,
        roughnessMap: nathanGloss,
        roughness: 0.72,
        metalness: 0.1,
      });

      const sophiaMaterial = new THREE.MeshStandardMaterial({
        map: sophiaDif,
        normalMap: sophiaNorm,
        roughnessMap: sophiaGloss,
        roughness: 0.75,
        metalness: 0.1,
      });

      // 2. Load FBX models in parallel
      const [nathanFbx, sophiaFbx] = await Promise.all([
        fbxLoader.loadAsync('/boymodels/rp_nathan_animated_003_walking.fbx'),
        fbxLoader.loadAsync('/models/rp_sophia_animated_003_idling.fbx'),
      ]);

      // --- CONFIGURE BOY (NATHAN / KAI) ---
      nathanFbx.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = nathanMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const nathanScale = 0.00974; // ~1.82m tall
      nathanFbx.scale.set(nathanScale, nathanScale, nathanScale);
      nathanFbx.position.set(0, 0.012, 0); // Ground feet precisely on floor

      const nathanContainer = new THREE.Group();
      nathanContainer.name = 'nathan_boy_avatar';
      nathanContainer.add(nathanFbx);

      const nathanOriginalWalk = nathanFbx.animations[0];
      const nathanWalkClip = createInPlaceClip(nathanOriginalWalk, 'walk');

      // --- CONFIGURE GIRL (SOPHIA / MIRA) ---
      sophiaFbx.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = sophiaMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const sophiaScale = 0.0099; // ~1.68m tall
      sophiaFbx.scale.set(sophiaScale, sophiaScale, sophiaScale);
      // Reset FBX coordinate pitch rotation to 0 so Sophia stands straight upright on her feet
      sophiaFbx.rotation.set(0, 0, 0);
      sophiaFbx.position.set(0, 0.012, 0); // Ground feet precisely on floor

      const sophiaContainer = new THREE.Group();
      sophiaContainer.name = 'sophia_girl_avatar';
      sophiaContainer.add(sophiaFbx);

      const sophiaOriginalIdle = sophiaFbx.animations[0];
      const sophiaIdleClip = createInPlaceClip(sophiaOriginalIdle, 'idle');

      // --- RETARGET ANIMATIONS BETWEEN SKELETONS ---
      // Both models share the identical 88-bone Renderpeople skeleton, only prefixes differ
      const nathanIdleClip = createInPlaceClip(
        sophiaOriginalIdle,
        'idle',
        'rp_sophia_animated_003_idling_',
        'rp_nathan_animated_003_walking_'
      );

      const sophiaWalkClip = createInPlaceClip(
        nathanOriginalWalk,
        'walk',
        'rp_nathan_animated_003_walking_',
        'rp_sophia_animated_003_idling_'
      );

      // Store in template registry
      templateRegistry.set('kai', {
        id: 'nathan-boy',
        name: 'Renderpeople Nathan (Boy)',
        scene: nathanContainer,
        animations: [nathanIdleClip, nathanWalkClip],
        targetAvatar: 'kai',
      });

      templateRegistry.set('mira', {
        id: 'sophia-girl',
        name: 'Renderpeople Sophia (Girl)',
        scene: sophiaContainer,
        animations: [sophiaIdleClip, sophiaWalkClip],
        targetAvatar: 'mira',
      });

      // Dispatch event to re-render any waiting avatars
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('couple-models-ready'));
      }
    } catch (err) {
      console.error('Error preloading couple 3D models:', err);
    } finally {
      isPreloading = false;
    }
  })();

  return preloadPromise;
}

/**
 * Instantiates an independent cloned 3D model with its own AnimationMixer
 * for use by local or remote avatars.
 */
export function createAvatarInstance(targetAvatar: 'kai' | 'mira'): AvatarRuntimeInstance | null {
  const template = templateRegistry.get(targetAvatar);
  if (!template) {
    // If not yet loaded, initiate preload
    preloadCoupleAvatars().catch(() => {});
    return null;
  }

  // Clone using SkeletonUtils to clone bones and skin weights independently
  const clonedScene = SkeletonUtils.clone(template.scene) as THREE.Group;
  const mixer = new THREE.AnimationMixer(clonedScene);

  let idleAction: THREE.AnimationAction | undefined;
  let walkAction: THREE.AnimationAction | undefined;

  const idleClip = template.animations.find((a) => a.name === 'idle');
  const walkClip = template.animations.find((a) => a.name === 'walk');

  if (idleClip) {
    idleAction = mixer.clipAction(idleClip);
    idleAction.play();
  }

  if (walkClip) {
    walkAction = mixer.clipAction(walkClip);
    walkAction.play();
    walkAction.weight = 0; // Start with idle active
  }

  return {
    id: `${targetAvatar}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    scene: clonedScene,
    mixer,
    idleAction,
    walkAction,
    targetAvatar,
  };
}

export function hasPreloadedModels(): boolean {
  return templateRegistry.has('kai') && templateRegistry.has('mira');
}

export function isPreloadingModels(): boolean {
  return isPreloading;
}

export function getCustomModel(avatarKey: 'kai' | 'mira'): LoadedCustomModel | undefined {
  return customModelRegistry.get(avatarKey);
}

export function clearCustomModel(avatarKey: 'kai' | 'mira') {
  customModelRegistry.delete(avatarKey);
}

/**
 * Loads a user-uploaded FBX file from a File object or URL.
 */
export async function loadFbxAvatar(
  fileOrUrl: File | string,
  targetAvatar: 'kai' | 'mira' = 'kai',
  fileName: string = 'custom_character.fbx'
): Promise<LoadedCustomModel> {
  const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);

  return new Promise((resolve, reject) => {
    fbxLoader.load(
      url,
      (group) => {
        try {
          let bbox = new THREE.Box3().setFromObject(group);
          let size = bbox.getSize(new THREE.Vector3());

          // If FBX was exported with pitch rotation causing it to lie flat, reset pitch rotation
          if (size.z > size.y * 1.3 && group.rotation.x !== 0) {
            group.rotation.x = 0;
            bbox = new THREE.Box3().setFromObject(group);
            size = bbox.getSize(new THREE.Vector3());
          }

          const height = size.y > 0.001 ? size.y : 1;
          const targetHeight = targetAvatar === 'kai' ? 1.82 : 1.68;
          const scaleFactor = targetHeight / height;

          group.scale.set(scaleFactor, scaleFactor, scaleFactor);
          bbox.setFromObject(group);
          group.position.y = -bbox.min.y;

          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const mixer =
            group.animations && group.animations.length > 0
              ? new THREE.AnimationMixer(group)
              : undefined;

          if (mixer && group.animations.length > 0) {
            mixer.clipAction(group.animations[0]).play();
          }

          const model: LoadedCustomModel = {
            id: `model-${Date.now()}`,
            name: fileName,
            scene: group,
            mixer,
            animations: group.animations || [],
            targetAvatar,
          };

          customModelRegistry.set(targetAvatar, model);
          resolve(model);
        } catch (err) {
          reject(err);
        }
      },
      undefined,
      (error) => {
        console.error('FBX loading error:', error);
        reject(error);
      }
    );
  });
}

/**
 * Loads a user-uploaded GLTF / GLB file from a File object or URL.
 */
export async function loadGltfAvatar(
  fileOrUrl: File | string,
  targetAvatar: 'kai' | 'mira' = 'kai',
  fileName: string = 'custom_character.glb'
): Promise<LoadedCustomModel> {
  const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        try {
          const group = gltf.scene;
          const bbox = new THREE.Box3().setFromObject(group);
          const size = bbox.getSize(new THREE.Vector3());
          const height = size.y > 0.001 ? size.y : 1;
          const targetHeight = targetAvatar === 'kai' ? 1.82 : 1.68;
          const scaleFactor = targetHeight / height;

          group.scale.set(scaleFactor, scaleFactor, scaleFactor);
          bbox.setFromObject(group);
          group.position.y = -bbox.min.y;

          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const mixer =
            gltf.animations && gltf.animations.length > 0
              ? new THREE.AnimationMixer(group)
              : undefined;

          if (mixer && gltf.animations.length > 0) {
            mixer.clipAction(gltf.animations[0]).play();
          }

          const model: LoadedCustomModel = {
            id: `model-${Date.now()}`,
            name: fileName,
            scene: group,
            mixer,
            animations: gltf.animations || [],
            targetAvatar,
          };

          customModelRegistry.set(targetAvatar, model);
          resolve(model);
        } catch (err) {
          reject(err);
        }
      },
      undefined,
      (error) => {
        console.error('GLTF loading error:', error);
        reject(error);
      }
    );
  });
}
