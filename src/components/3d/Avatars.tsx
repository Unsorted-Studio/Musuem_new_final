import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CharacterAction } from '../../types/museum';
import { getKaiFaceTexture, getMiraFaceTexture } from './avatarTextures';
import {
  createAvatarInstance,
  getCustomModel,
  AvatarRuntimeInstance,
} from '../../services/modelLoader';

interface AvatarsProps {
  position: [number, number, number];
  rotationY: number;
  isMoving: boolean;
  isSeated: boolean;
  selectedAvatar?: 'kai' | 'mira';
  action?: CharacterAction;
  playerName?: string;
  isRemote?: boolean;
  seatOffset?: number; // X offset on the cinema bench
}

export const Avatars: React.FC<AvatarsProps> = ({
  position,
  rotationY,
  isMoving,
  isSeated,
  selectedAvatar = 'kai',
  action = 'idle',
  playerName,
  isRemote = false,
  seatOffset = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Active independent 3D avatar instance cloned from preloaded FBX models
  const [avatarInstance, setAvatarInstance] = useState<AvatarRuntimeInstance | null>(
    () => createAvatarInstance(selectedAvatar)
  );

  useEffect(() => {
    setAvatarInstance(createAvatarInstance(selectedAvatar));

    const handleModelsReady = () => {
      setAvatarInstance(createAvatarInstance(selectedAvatar));
    };
    window.addEventListener('couple-models-ready', handleModelsReady);
    return () => {
      window.removeEventListener('couple-models-ready', handleModelsReady);
    };
  }, [selectedAvatar]);

  // Limb refs for Boy (Kai) fallback
  const boyLeftLeg = useRef<THREE.Group>(null);
  const boyRightLeg = useRef<THREE.Group>(null);
  const boyLeftArm = useRef<THREE.Group>(null);
  const boyRightArm = useRef<THREE.Group>(null);
  const boyHead = useRef<THREE.Group>(null);

  // Limb refs for Girl (Mira) fallback
  const girlLeftLeg = useRef<THREE.Group>(null);
  const girlRightLeg = useRef<THREE.Group>(null);
  const girlLeftArm = useRef<THREE.Group>(null);
  const girlRightArm = useRef<THREE.Group>(null);
  const girlHead = useRef<THREE.Group>(null);
  const girlSkirt = useRef<THREE.Group>(null);

  const animTime = useRef(0);

  // Load facial textures for procedural fallback
  const kaiFace = useMemo(() => getKaiFaceTexture(), []);
  const miraFace = useMemo(() => getMiraFaceTexture(), []);

  // Check for uploaded custom FBX / GLB 3D model
  const customModel = getCustomModel(selectedAvatar);

  useFrame((_, delta) => {
    animTime.current += delta;
    const t = animTime.current;

    // Advance animations on 3D avatar model instance
    if (avatarInstance) {
      avatarInstance.mixer.update(delta);

      if (avatarInstance.walkAction && avatarInstance.idleAction) {
        const isMovingNow = isMoving && !isSeated;
        const targetWalkWeight = isMovingNow ? 1.0 : 0.0;
        const targetIdleWeight = isMovingNow ? 0.0 : 1.0;

        avatarInstance.walkAction.weight = THREE.MathUtils.lerp(
          avatarInstance.walkAction.weight,
          targetWalkWeight,
          0.22
        );
        avatarInstance.idleAction.weight = THREE.MathUtils.lerp(
          avatarInstance.idleAction.weight,
          targetIdleWeight,
          0.22
        );

        avatarInstance.walkAction.timeScale = 1.0;
        avatarInstance.idleAction.timeScale = 1.0;
      }
    } else if (customModel?.mixer) {
      customModel.mixer.update(delta);
    }

    if (groupRef.current) {
      if (isSeated) {
        // Seated on the cinema bench facing the high wall screen
        const benchX = seatOffset || (isRemote ? 0.55 : -0.55);
        groupRef.current.position.set(benchX, 0, -32.8);
        groupRef.current.rotation.y = Math.PI; // Face cinema screen (-Z)
      } else {
        if (isRemote) {
          groupRef.current.position.lerp(new THREE.Vector3(...position), 0.25);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotationY, 0.25);
        } else {
          groupRef.current.position.set(position[0], position[1], position[2]);
          groupRef.current.rotation.y = rotationY;
        }
      }
    }

    // Kinematics for procedural fallback avatars
    if (!avatarInstance && !customModel) {
      const activeLegs = selectedAvatar === 'kai' ? [boyLeftLeg, boyRightLeg] : [girlLeftLeg, girlRightLeg];
      const activeArms = selectedAvatar === 'kai' ? [boyLeftArm, boyRightArm] : [girlLeftArm, girlRightArm];
      const activeHead = selectedAvatar === 'kai' ? boyHead : girlHead;

      // 1. Sitting Kinematics
      if (isSeated) {
        activeLegs.forEach((legRef) => {
          if (legRef.current) {
            legRef.current.rotation.x = -Math.PI / 2;
            legRef.current.position.y = 0.46;
            legRef.current.position.z = 0.08;
          }
        });

        activeArms.forEach((armRef) => {
          if (armRef.current) {
            armRef.current.rotation.x = -0.42;
            armRef.current.rotation.z = 0.04;
          }
        });

        if (activeHead.current) {
          activeHead.current.rotation.x = -0.18 + Math.sin(t * 0.8) * 0.02;
          activeHead.current.rotation.y = 0;
        }

        if (girlSkirt.current) {
          girlSkirt.current.rotation.x = -0.85;
        }
        return;
      }

      // Reset leg positions when standing
      if (selectedAvatar === 'kai') {
        if (boyLeftLeg.current) { boyLeftLeg.current.position.y = 0.90; boyLeftLeg.current.position.z = 0; }
        if (boyRightLeg.current) { boyRightLeg.current.position.y = 0.90; boyRightLeg.current.position.z = 0; }
      } else {
        if (girlLeftLeg.current) { girlLeftLeg.current.position.y = 0.80; girlLeftLeg.current.position.z = 0; }
        if (girlRightLeg.current) { girlRightLeg.current.position.y = 0.80; girlRightLeg.current.position.z = 0; }
        if (girlSkirt.current) { girlSkirt.current.rotation.x = 0; }
      }

      // 2. Emote Overrides
      if (action === 'wave') {
        const arm = selectedAvatar === 'kai' ? boyRightArm : girlRightArm;
        if (arm.current) {
          arm.current.rotation.x = -Math.PI * 0.85;
          arm.current.rotation.z = Math.sin(t * 12) * 0.35 + 0.45;
        }
        return;
      }

      if (action === 'celebrate') {
        activeArms.forEach((arm, idx) => {
          if (arm.current) {
            arm.current.rotation.x = -Math.PI * 0.88;
            arm.current.rotation.z = (idx === 0 ? -1 : 1) * (0.35 + Math.sin(t * 8) * 0.15);
          }
        });
        return;
      }

      if (action === 'kiss') {
        const arm = selectedAvatar === 'kai' ? boyRightArm : girlRightArm;
        if (arm.current) {
          arm.current.rotation.x = -Math.PI * 0.65;
          arm.current.rotation.z = 0.25;
        }
        if (activeHead.current) {
          activeHead.current.rotation.x = -0.15;
        }
        return;
      }

      if (action === 'dance') {
        activeLegs.forEach((leg, idx) => {
          if (leg.current) leg.current.rotation.x = Math.sin(t * 7 + idx * Math.PI) * 0.3;
        });
        activeArms.forEach((arm, idx) => {
          if (arm.current) {
            arm.current.rotation.x = -0.7 + Math.sin(t * 7 + idx) * 0.35;
            arm.current.rotation.z = (idx === 0 ? -0.45 : 0.45) + Math.cos(t * 7) * 0.25;
          }
        });
        if (girlSkirt.current) {
          girlSkirt.current.rotation.z = Math.sin(t * 7) * 0.15;
        }
        return;
      }

      // 3. Walking Kinematics
      if (isMoving) {
        const walkSpeed = 9.2;
        const swing = Math.sin(t * walkSpeed) * 0.55;

        if (activeLegs[0].current) activeLegs[0].current.rotation.x = swing;
        if (activeLegs[1].current) activeLegs[1].current.rotation.x = -swing;
        if (activeArms[0].current) {
          activeArms[0].current.rotation.x = -swing * 0.7;
          activeArms[0].current.rotation.z = 0.06;
        }
        if (activeArms[1].current) {
          activeArms[1].current.rotation.x = swing * 0.7;
          activeArms[1].current.rotation.z = -0.06;
        }

        const bob = Math.abs(Math.sin(t * walkSpeed)) * 0.04;
        if (activeHead.current) {
          activeHead.current.position.y = (selectedAvatar === 'kai' ? 1.66 : 1.54) + bob;
        }

        if (girlSkirt.current) {
          girlSkirt.current.rotation.x = Math.sin(t * walkSpeed) * 0.12;
          girlSkirt.current.rotation.z = Math.cos(t * walkSpeed * 0.5) * 0.08;
        }
      } else {
        // 4. Idle Natural Breathing Sway
        const idle = Math.sin(t * 1.8) * 0.03;
        activeLegs.forEach((leg) => {
          if (leg.current) leg.current.rotation.x = 0;
        });
        if (activeArms[0].current) {
          activeArms[0].current.rotation.x = idle;
          activeArms[0].current.rotation.z = 0.06;
        }
        if (activeArms[1].current) {
          activeArms[1].current.rotation.x = -idle;
          activeArms[1].current.rotation.z = -0.06;
        }
        if (activeHead.current) {
          activeHead.current.rotation.y = Math.sin(t * 0.6) * 0.05;
          activeHead.current.rotation.x = 0;
          activeHead.current.position.y = (selectedAvatar === 'kai' ? 1.66 : 1.54) + idle * 0.3;
        }
        if (girlSkirt.current) {
          girlSkirt.current.rotation.x = 0;
          girlSkirt.current.rotation.z = 0;
        }
      }
    }
  });

  // If a custom 3D model (FBX or GLTF) has been loaded by user, render it directly!
  if (customModel) {
    return (
      <group ref={groupRef}>
        <primitive object={customModel.scene} />
      </group>
    );
  }

  // If preloaded 3D human character avatar (Renderpeople FBX Nathan / Sophia) is available, render it!
  if (avatarInstance) {
    return (
      <group ref={groupRef}>
        <primitive object={avatarInstance.scene} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {selectedAvatar === 'kai' ? (
        /* =================================================================== */
        /* BOY (JAMES / KAI): Sharp Tailored Midnight Navy Suit & Slacks       */
        /* Taller build (1.82m), broad shoulders, tie, gold watch, oxford shoe */
        /* =================================================================== */
        <group scale={[1.05, 1.05, 1.05]}>
          {/* 1. Torso: Midnight Navy Blazer with Crisp White Shirt & Silk Tie */}
          <group position={[0, 1.22, 0]}>
            {/* Structured Suit Blazer Body */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.22, 0.18, 0.54, 16]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>

            {/* White Dress Shirt V-Inset */}
            <mesh position={[0, 0.10, 0.12]}>
              <planeGeometry args={[0.13, 0.24]} />
              <meshStandardMaterial color="#f8f9fa" roughness={0.4} />
            </mesh>

            {/* Black Silk Tie */}
            <mesh position={[0, 0.05, 0.128]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.045, 0.22, 0.012]} />
              <meshStandardMaterial color="#0f131a" roughness={0.3} metalness={0.1} />
            </mesh>

            {/* Blazer Notched Lapels */}
            <mesh position={[-0.08, 0.14, 0.12]} rotation={[0.15, 0.2, -0.3]}>
              <boxGeometry args={[0.08, 0.24, 0.02]} />
              <meshStandardMaterial color="#141a29" roughness={0.5} />
            </mesh>
            <mesh position={[0.08, 0.14, 0.12]} rotation={[0.15, -0.2, 0.3]}>
              <boxGeometry args={[0.08, 0.24, 0.02]} />
              <meshStandardMaterial color="#141a29" roughness={0.5} />
            </mesh>

            {/* Pocket Square in Breast Pocket */}
            <mesh position={[-0.10, 0.12, 0.124]} rotation={[0, 0.15, -0.1]}>
              <boxGeometry args={[0.04, 0.02, 0.01]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>

            {/* Gold Blazer Buttons */}
            {[-0.04, -0.13].map((by, bidx) => (
              <mesh key={`kbtn-${bidx}`} position={[0, by, 0.17]}>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshStandardMaterial color="#e6c875" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}
          </group>

          {/* 2. Neck */}
          <mesh position={[0, 1.54, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.075, 0.1, 16]} />
            <meshStandardMaterial color="#f5d9c8" roughness={0.6} />
          </mesh>

          {/* 3. Head & Sharp Textured Male Hair */}
          <group ref={boyHead} position={[0, 1.66, 0]}>
            {/* Head */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.138, 24, 24]} />
              <meshStandardMaterial color="#f5d9c8" roughness={0.55} />
            </mesh>

            {/* Painted Anime Boy Face */}
            <mesh position={[0, -0.01, 0.126]}>
              <planeGeometry args={[0.19, 0.21]} />
              <meshBasicMaterial map={kaiFace} transparent opacity={0.96} />
            </mesh>

            {/* Ears */}
            <mesh position={[-0.135, 0, 0]} rotation={[0, -0.2, 0]}>
              <capsuleGeometry args={[0.018, 0.04, 8, 8]} />
              <meshStandardMaterial color="#f5d9c8" />
            </mesh>
            <mesh position={[0.135, 0, 0]} rotation={[0, 0.2, 0]}>
              <capsuleGeometry args={[0.018, 0.04, 8, 8]} />
              <meshStandardMaterial color="#f5d9c8" />
            </mesh>

            {/* Short Textured Chestnut Hair Crown */}
            <mesh position={[0, 0.05, -0.015]} castShadow>
              <sphereGeometry args={[0.15, 20, 20]} />
              <meshStandardMaterial color="#271c16" roughness={0.65} />
            </mesh>

            {/* Clean Short Fringe & Side Parting */}
            <mesh position={[0, 0.09, 0.11]} rotation={[0.25, 0, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.13, 10, 10]} />
              <meshStandardMaterial color="#271c16" roughness={0.65} />
            </mesh>
            <mesh position={[-0.07, 0.07, 0.11]} rotation={[0.1, 0.15, -0.35]} castShadow>
              <coneGeometry args={[0.042, 0.12, 10]} />
              <meshStandardMaterial color="#221812" />
            </mesh>
            <mesh position={[0.07, 0.07, 0.11]} rotation={[0.1, -0.15, 0.35]} castShadow>
              <coneGeometry args={[0.042, 0.12, 10]} />
              <meshStandardMaterial color="#221812" />
            </mesh>
            {/* Tapered clean neck hair contour */}
            <mesh position={[0, -0.04, -0.075]} rotation={[-0.2, 0, 0]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshStandardMaterial color="#221812" roughness={0.7} />
            </mesh>
          </group>

          {/* 4. Left Arm (Navy Suit Sleeve + Cuff + Gold Watch + Hand) */}
          <group ref={boyLeftArm} position={[-0.26, 1.40, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.048, 0.22, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.042, 0.20, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            {/* Gold Luxury Watch on Wrist */}
            <mesh position={[0, -0.47, 0]}>
              <cylinderGeometry args={[0.046, 0.046, 0.025, 16]} />
              <meshStandardMaterial color="#e6c875" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.52, 0.01]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#f5d9c8" roughness={0.6} />
            </mesh>
          </group>

          {/* 5. Right Arm */}
          <group ref={boyRightArm} position={[0.26, 1.40, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.048, 0.22, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.042, 0.20, 12, 12]} />
              <meshStandardMaterial color="#1a2233" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.52, 0.01]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#f5d9c8" roughness={0.6} />
            </mesh>
          </group>

          {/* 6. Left Leg (Navy Suit Trousers & Leather Oxford) */}
          <group ref={boyLeftLeg} position={[-0.11, 0.90, 0]}>
            <mesh position={[0, -0.42, 0]} castShadow>
              <capsuleGeometry args={[0.062, 0.74, 12, 12]} />
              <meshStandardMaterial color="#141a29" roughness={0.6} />
            </mesh>
            <group position={[0, -0.84, 0.04]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.055, 0.13, 10, 10]} />
                <meshStandardMaterial color="#110c08" roughness={0.25} metalness={0.2} />
              </mesh>
              <mesh position={[0, -0.045, 0]}>
                <boxGeometry args={[0.11, 0.02, 0.2]} />
                <meshStandardMaterial color="#080605" roughness={0.9} />
              </mesh>
            </group>
          </group>

          {/* 7. Right Leg */}
          <group ref={boyRightLeg} position={[0.11, 0.90, 0]}>
            <mesh position={[0, -0.42, 0]} castShadow>
              <capsuleGeometry args={[0.062, 0.74, 12, 12]} />
              <meshStandardMaterial color="#141a29" roughness={0.6} />
            </mesh>
            <group position={[0, -0.84, 0.04]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.055, 0.13, 10, 10]} />
                <meshStandardMaterial color="#110c08" roughness={0.25} metalness={0.2} />
              </mesh>
              <mesh position={[0, -0.045, 0]}>
                <boxGeometry args={[0.11, 0.02, 0.2]} />
                <meshStandardMaterial color="#080605" roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>
      ) : (
        /* =================================================================== */
        /* GIRL (EMILY / MIRA): Romantic Rose Blush Flared Cocktail Gown       */
        /* Graceful feminine silhouette (0.94m scale), flowing skirt, long     */
        /* wavy brunette hair with blossom pin, heart necklace, delicate heels */
        /* =================================================================== */
        <group scale={[0.94, 0.94, 0.94]}>
          {/* 1. Torso: Rose Blush Sweetheart Bodice + Satin Waist Ribbon */}
          <group position={[0, 1.16, 0]}>
            {/* Fitted Bodice */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.16, 0.13, 0.42, 16]} />
              <meshStandardMaterial color="#d97081" roughness={0.6} />
            </mesh>

            {/* Sweetheart Neckline Inset */}
            <mesh position={[0, 0.14, 0.08]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>

            {/* Gold Heart Necklace */}
            <mesh position={[0, 0.19, 0.085]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="#e6c875" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Deep Crimson/Ruby Satin Waist Ribbon Sash */}
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
              <meshStandardMaterial color="#822738" roughness={0.3} />
            </mesh>
            {/* Ribbon Bow on Side */}
            <mesh position={[-0.12, -0.16, 0.06]} rotation={[0, 0.4, 0.2]}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshStandardMaterial color="#822738" roughness={0.3} />
            </mesh>
          </group>

          {/* 2. Flared Romantic A-Line Skirt (Clearly identifies as Girl from ANY angle) */}
          <group ref={girlSkirt} position={[0, 0.96, 0]}>
            {/* Upper Flare */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.14, 0.28, 0.32, 20]} />
              <meshStandardMaterial color="#d97081" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Lower Billowing Hemline */}
            <mesh position={[0, -0.14, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.26, 0.36, 0.22, 20]} />
              <meshStandardMaterial color="#cf6375" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Satin Trim at Skirt Hem */}
            <mesh position={[0, -0.24, 0]}>
              <torusGeometry args={[0.36, 0.012, 8, 24]} />
              <meshStandardMaterial color="#822738" roughness={0.3} />
            </mesh>
          </group>

          {/* 3. Slender Neck */}
          <mesh position={[0, 1.44, 0]} castShadow>
            <cylinderGeometry args={[0.046, 0.055, 0.1, 16]} />
            <meshStandardMaterial color="#f7ded0" roughness={0.6} />
          </mesh>

          {/* 4. Head & Long Flowing Wavy Brunette Hair with Blossom Accessory */}
          <group ref={girlHead} position={[0, 1.54, 0]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.128, 24, 24]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.55} />
            </mesh>

            {/* High-Resolution Painted Anime Girl Face */}
            <mesh position={[0, -0.01, 0.118]}>
              <planeGeometry args={[0.18, 0.2]} />
              <meshBasicMaterial map={miraFace} transparent opacity={0.96} />
            </mesh>

            {/* Hair Crown Dome (Warm Honey Brunette) */}
            <mesh position={[0, 0.05, -0.01]} castShadow>
              <sphereGeometry args={[0.142, 20, 20]} />
              <meshStandardMaterial color="#4a2f20" roughness={0.7} />
            </mesh>

            {/* Romantic Rose Flower Hair Clip on Right Side */}
            <group position={[0.12, 0.06, 0.05]} rotation={[0.2, -0.3, -0.2]}>
              <mesh>
                <sphereGeometry args={[0.026, 10, 10]} />
                <meshStandardMaterial color="#ff9ebb" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            </group>

            {/* Face-framing soft fringe */}
            <mesh position={[0, 0.09, 0.10]} rotation={[0.2, 0, 0]} castShadow>
              <capsuleGeometry args={[0.035, 0.10, 8, 8]} />
              <meshStandardMaterial color="#4a2f20" roughness={0.7} />
            </mesh>
            {/* Long Cascading Hair Tresses Past Shoulders & Down Back */}
            <mesh position={[-0.12, -0.18, 0.03]} rotation={[0.05, 0.1, -0.12]} castShadow>
              <capsuleGeometry args={[0.038, 0.36, 10, 10]} />
              <meshStandardMaterial color="#4a2f20" roughness={0.7} />
            </mesh>
            <mesh position={[0.12, -0.18, 0.03]} rotation={[0.05, -0.1, 0.12]} castShadow>
              <capsuleGeometry args={[0.038, 0.36, 10, 10]} />
              <meshStandardMaterial color="#4a2f20" roughness={0.7} />
            </mesh>
            {/* Full Volumetric Back Hair Sheet flowing to mid-back */}
            <mesh position={[0, -0.20, -0.08]} rotation={[-0.08, 0, 0]} castShadow>
              <boxGeometry args={[0.24, 0.44, 0.08]} />
              <meshStandardMaterial color="#40271a" roughness={0.7} />
            </mesh>
            {/* Flared wavy hair tips */}
            <mesh position={[0, -0.42, -0.06]} rotation={[-0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.26, 0.10, 0.07]} />
              <meshStandardMaterial color="#382115" roughness={0.7} />
            </mesh>
          </group>

          {/* 5. Left Arm (Delicate Bare Shoulder + Bracelet + Hand) */}
          <group ref={girlLeftArm} position={[-0.20, 1.30, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.036, 0.22, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.032, 0.20, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.50, 0.01]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
          </group>

          {/* 6. Right Arm (with Gold Bracelet) */}
          <group ref={girlRightArm} position={[0.20, 1.30, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.052, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.036, 0.22, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.032, 0.20, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            {/* Gold Bangle on Wrist */}
            <mesh position={[0, -0.45, 0]}>
              <torusGeometry args={[0.038, 0.006, 8, 16]} />
              <meshStandardMaterial color="#e6c875" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.50, 0.01]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
          </group>

          {/* 7. Left Leg (Elegantly Visible Under Flared Skirt) */}
          <group ref={girlLeftLeg} position={[-0.09, 0.80, 0]}>
            <mesh position={[0, -0.36, 0]} castShadow>
              <capsuleGeometry args={[0.046, 0.64, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            {/* Rose Ankle-Strap Heel */}
            <group position={[0, -0.74, 0.03]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.044, 0.10, 10, 10]} />
                <meshStandardMaterial color="#822738" roughness={0.3} />
              </mesh>
              {/* Heel lift */}
              <mesh position={[0, -0.04, -0.03]}>
                <cylinderGeometry args={[0.015, 0.012, 0.04, 8]} />
                <meshStandardMaterial color="#822738" roughness={0.3} />
              </mesh>
            </group>
          </group>

          {/* 8. Right Leg */}
          <group ref={girlRightLeg} position={[0.09, 0.80, 0]}>
            <mesh position={[0, -0.36, 0]} castShadow>
              <capsuleGeometry args={[0.046, 0.64, 12, 12]} />
              <meshStandardMaterial color="#f7ded0" roughness={0.6} />
            </mesh>
            <group position={[0, -0.74, 0.03]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.044, 0.10, 10, 10]} />
                <meshStandardMaterial color="#822738" roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.04, -0.03]}>
                <cylinderGeometry args={[0.015, 0.012, 0.04, 8]} />
                <meshStandardMaterial color="#822738" roughness={0.3} />
              </mesh>
            </group>
          </group>
        </group>
      )}
    </group>
  );
};
