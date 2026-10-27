import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraMode, CharacterAction, InteractiveTarget, PictureFrameItem } from '../../types/museum';
import { Avatars } from './Avatars';
import { soundtrack } from '../../services/soundtrack';

interface PlayerControllerProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  frames: PictureFrameItem[];
  selectedAvatar: 'kai' | 'mira';
  playerName: string;
  currentAction: CharacterAction;
  onInteractFrame: (frame: PictureFrameItem) => void;
  onInteractDedication: () => void;
  onInteractCinemaSeat: () => void;
  onActiveTargetChange: (target: InteractiveTarget | null) => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportComplete?: () => void;
  onPositionUpdate?: (
    pos: [number, number, number],
    rotY: number,
    moving: boolean,
    seated: boolean
  ) => void;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  cameraMode,
  onCameraModeChange,
  frames,
  selectedAvatar,
  playerName,
  currentAction,
  onInteractFrame,
  onInteractDedication,
  onInteractCinemaSeat,
  onActiveTargetChange,
  teleportTarget,
  onTeleportComplete,
  onPositionUpdate,
}) => {
  const { camera, gl } = useThree();

  // Player position initialized in the entrance facing the gallery
  const playerPos = useRef(new THREE.Vector3(0, 0, 1.8));
  const playerYaw = useRef(0);
  const playerPitch = useRef(0);
  const isMoving = useRef(false);
  const [movingState, setMovingState] = useState(false);

  // Key tracking
  const keys = useRef<{ [key: string]: boolean }>({});

  // Mouse look tracking
  const isDragging = useRef(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Collision limits
  const validatePosition = (nextPos: THREE.Vector3): THREE.Vector3 => {
    // Gallery boundaries: X in [-6.8, 6.8], Z in [-36.2, 3.2]
    nextPos.x = Math.max(-6.8, Math.min(6.8, nextPos.x));
    nextPos.z = Math.max(-36.2, Math.min(3.2, nextPos.z));

    // Avoid walking through the centerpiece partition at [0, 0, -8]
    if (nextPos.z > -9.6 && nextPos.z < -6.5 && Math.abs(nextPos.x) < 3.8) {
      if (playerPos.current.z >= -6.5) nextPos.z = -6.49;
      else if (playerPos.current.z <= -9.6) nextPos.z = -9.61;
      else if (playerPos.current.x >= 3.8) nextPos.x = 3.81;
      else if (playerPos.current.x <= -3.8) nextPos.x = -3.81;
    }

    return nextPos;
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      keys.current[e.code] = true;

      // Camera toggle: Key V
      if (e.code === 'KeyV') {
        soundtrack.playCameraSwitch();
        if (cameraMode === 'first-person') onCameraModeChange('third-person');
        else if (cameraMode === 'third-person') onCameraModeChange('first-person');
        else if (cameraMode === 'cinema-seated') onCameraModeChange('third-person');
      }

      // Stand up from cinema: Escape or Space
      if (cameraMode === 'cinema-seated' && (e.code === 'Escape' || e.code === 'Space')) {
        onCameraModeChange('third-person');
      }

      // Interaction: Key E
      if (e.code === 'KeyE') {
        checkAndTriggerInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode, onCameraModeChange]);

  // Mouse look handlers
  useEffect(() => {
    const domElement = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        prevMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === domElement) {
        playerYaw.current -= e.movementX * 0.0024;
        playerPitch.current -= e.movementY * 0.0024;
        playerPitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, playerPitch.current));
        return;
      }

      if (isDragging.current) {
        const dx = e.clientX - prevMousePos.current.x;
        const dy = e.clientY - prevMousePos.current.y;
        prevMousePos.current = { x: e.clientX, y: e.clientY };

        playerYaw.current -= dx * 0.003;
        playerPitch.current -= dy * 0.003;
        playerPitch.current = Math.max(-Math.PI / 3.2, Math.min(Math.PI / 3.2, playerPitch.current));
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gl]);

  // Teleport handler
  useEffect(() => {
    if (teleportTarget) {
      playerPos.current.set(teleportTarget[0], teleportTarget[1], teleportTarget[2]);
      if (teleportTarget[2] < -25) {
        playerYaw.current = 0; // Face forward towards screen
      }
      onTeleportComplete?.();
    }
  }, [teleportTarget, onTeleportComplete]);

  // Target interaction detection
  const checkNearestTarget = (): InteractiveTarget | null => {
    const pos = playerPos.current;

    // 1. Cinema Bench Target (bench at [0, 0, -32.8], screen at -37.4)
    const benchDist = pos.distanceTo(new THREE.Vector3(0, 0, -32.8));
    if (benchDist < 2.8) {
      return {
        type: 'cinema-seat',
        title: 'Cinema Gallery Bench',
        hint: cameraMode === 'cinema-seated' ? 'Stand up' : 'Sit',
        distance: benchDist,
      };
    }

    // 2. Dedication Podium & Centerpiece Plaque (at [0, 0, -6.6])
    const dedicationDist = pos.distanceTo(new THREE.Vector3(0, 0, -6.6));
    if (dedicationDist < 2.8) {
      return {
        type: 'dedication',
        title: 'A Permanent Collection',
        hint: 'View Collection Note',
        distance: dedicationDist,
      };
    }

    // 3. Wall Picture Frames
    let nearestFrame: PictureFrameItem | null = null;
    let minFrameDist = 3.2;

    for (const frame of frames) {
      const frameVec = new THREE.Vector3(frame.position[0], 0, frame.position[2]);
      const dist = pos.distanceTo(frameVec);
      if (dist < minFrameDist) {
        minFrameDist = dist;
        nearestFrame = frame;
      }
    }

    if (nearestFrame) {
      return {
        type: 'frame',
        id: nearestFrame.id,
        title: nearestFrame.title,
        hint: 'Zoom',
        distance: minFrameDist,
      };
    }

    return null;
  };

  const checkAndTriggerInteraction = () => {
    const target = checkNearestTarget();
    if (!target) return;

    soundtrack.playInspectChime();

    if (target.type === 'dedication') {
      onInteractDedication();
    } else if (target.type === 'cinema-seat') {
      onInteractCinemaSeat();
    } else if (target.type === 'frame' && target.id) {
      const found = frames.find((f) => f.id === target.id);
      if (found) onInteractFrame(found);
    }
  };

  // Frame Loop
  useFrame((_, delta) => {
    const isSeated = cameraMode === 'cinema-seated';

    // 1. Cinema Seated Mode: EXACT GiftVera View
    // Seated ON bench at Z = -32.8, facing directly towards the video screen at Z = -37.4
    // Camera is positioned directly behind character at [0, 1.82, -28.6], framing both avatar and screen!
    if (isSeated) {
      playerPos.current.set(-0.55, 0, -32.8);
      const targetCamPos = new THREE.Vector3(-0.25, 1.82, -28.6);
      camera.position.lerp(targetCamPos, 0.1);
      camera.lookAt(0, 3.2, -37.4); // Focus right on the active screen!

      onPositionUpdate?.(
        [playerPos.current.x, playerPos.current.y, playerPos.current.z],
        Math.PI,
        false,
        true
      );
      return;
    }

    // 2. Normal Movement Calculation
    let moveForward = 0;
    let moveRight = 0;
    const k = keys.current;

    if (k['KeyW'] || k['ArrowUp']) moveForward += 1;
    if (k['KeyS'] || k['ArrowDown']) moveForward -= 1;
    if (k['KeyA'] || k['ArrowLeft']) moveRight -= 1;
    if (k['KeyD'] || k['ArrowRight']) moveRight += 1;

    const moving = moveForward !== 0 || moveRight !== 0;
    if (moving !== isMoving.current) {
      isMoving.current = moving;
      setMovingState(moving);
    }

    if (moving) {
      soundtrack.playFootstep();
      const speed = (k['ShiftLeft'] || k['ShiftRight']) ? 5.8 : 3.6;

      const forwardDir = new THREE.Vector3(
        -Math.sin(playerYaw.current),
        0,
        -Math.cos(playerYaw.current)
      );
      const rightDir = new THREE.Vector3(
        Math.cos(playerYaw.current),
        0,
        -Math.sin(playerYaw.current)
      );

      const moveDir = new THREE.Vector3()
        .addScaledVector(forwardDir, moveForward)
        .addScaledVector(rightDir, moveRight)
        .normalize();

      const nextPos = playerPos.current.clone().addScaledVector(moveDir, speed * delta);
      validatePosition(nextPos);
      playerPos.current.copy(nextPos);
    }

    // 3. Camera Placement
    if (cameraMode === 'first-person') {
      camera.position.set(playerPos.current.x, 1.68, playerPos.current.z);
      const lookTarget = new THREE.Vector3(
        playerPos.current.x - Math.sin(playerYaw.current) * Math.cos(playerPitch.current),
        1.68 + Math.sin(playerPitch.current),
        playerPos.current.z - Math.cos(playerYaw.current) * Math.cos(playerPitch.current)
      );
      camera.lookAt(lookTarget);
    } else {
      // Third Person Chase Cam (GiftVera view behind Kai/Mira)
      const chaseDistance = 3.0;
      const targetCamPos = new THREE.Vector3(
        playerPos.current.x + Math.sin(playerYaw.current) * chaseDistance,
        playerPos.current.y + 1.95 - playerPitch.current * 0.7,
        playerPos.current.z + Math.cos(playerYaw.current) * chaseDistance
      );

      camera.position.lerp(targetCamPos, 0.14);
      const lookTarget = new THREE.Vector3(
        playerPos.current.x,
        playerPos.current.y + 1.35,
        playerPos.current.z
      );
      camera.lookAt(lookTarget);
    }

    // Broadcast position to multiplayer service
    onPositionUpdate?.(
      [playerPos.current.x, playerPos.current.y, playerPos.current.z],
      playerYaw.current + Math.PI,
      moving,
      false
    );

    // Target check
    const target = checkNearestTarget();
    onActiveTargetChange(target);
  });

  return (
    <>
      {cameraMode !== 'first-person' && (
        <Avatars
          position={[playerPos.current.x, 0, playerPos.current.z]}
          rotationY={playerYaw.current + Math.PI}
          isMoving={movingState}
          isSeated={cameraMode === 'cinema-seated'}
          selectedAvatar={selectedAvatar}
          playerName={playerName}
          action={currentAction}
          seatOffset={-0.55}
        />
      )}
    </>
  );
};
