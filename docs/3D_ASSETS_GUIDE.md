# OUR MUSEUM - 3D Character & Asset Integration Guide

## Overview
Our Museum features fully procedural, stylized 3D couple avatars (male and female) built directly in Three.js and React Three Fiber. They feature:
- Walk-cycle kinematics with coordinated leg strides and arm swinging
- Idle breathing and head movements
- Seated poses designed for the couple's private cinema seats

## How to Add Custom 3D Character Models (GLTF / GLB)
If you wish to replace the procedural couple avatars with custom 3D humanoid character models (such as custom avatars generated with Ready Player Me, Mixamo, or Sketchfab CC-BY assets), follow these steps:

### 1. Recommended Legally Usable Character Sources
- **Ready Player Me** ([readyplayer.me](https://readyplayer.me)): Free for personal and commercial use under their terms. Generates fully rigged `.glb` avatars from photos.
- **Mixamo** ([mixamo.com](https://www.mixamo.com)): Free collection of rigged humanoid characters and motion-capture animations (FBX / GLTF) provided by Adobe.
- **Kenney.nl** ([kenney.nl](https://kenney.nl)): CC0 Public Domain 3D characters and animated humanoid models.
- **Poly Pizza** ([poly.pizza](https://poly.pizza)): Low-poly CC0 / CC-BY 3D assets.

### 2. File Placement
Export your rigged character models as binary GLTF (`.glb`) files:
```bash
/public/models/partner_male.glb
/public/models/partner_female.glb
```

### 3. Loading with React Three Fiber & Drei
In `src/components/3d/Avatars.tsx`, you can use Drei's `useGLTF` hook:
```tsx
import { useGLTF, useAnimations } from '@react-three/drei';

export function CustomAvatarMale({ position, rotationY }: { position: [number, number, number], rotationY: number }) {
  const { scene, animations } = useGLTF('/models/partner_male.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    // Play idle or walk animation depending on player movement
    actions['Walking']?.play();
  }, [actions]);

  return <primitive object={scene} position={position} rotation={[0, rotationY, 0]} scale={1.0} />;
}

useGLTF.preload('/models/partner_male.glb');
```
