import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode, CharacterAction, InteractiveTarget, LightingPreset, MuseumConfig, PictureFrameItem } from '../../types/museum';
import { RemotePlayer } from '../../types/multiplayer';
import { MuseumArchitecture } from './MuseumArchitecture';
import { PictureFrame3D } from './PictureFrame3D';
import { CinemaRoom3D } from './CinemaRoom3D';
import { PlayerController } from './PlayerController';
import { Avatars } from './Avatars';
import { setupProceduralEnvironment } from './environmentSetup';

// Environment & Fog Setup Hook (Dim, warm, intimate atmosphere)
function EnvironmentHook({ lightingPreset }: { lightingPreset: LightingPreset }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    setupProceduralEnvironment(gl, scene);
    // Dim, moody gallery atmosphere (not blinding white wash)
    scene.fog = new THREE.FogExp2('#1a191c', 0.005);
  }, [gl, scene, lightingPreset]);

  return null;
}

interface MuseumSceneProps {
  config: MuseumConfig;
  frames: PictureFrameItem[];
  cameraMode: CameraMode;
  lightingPreset: LightingPreset;
  selectedAvatar: 'kai' | 'mira';
  currentAction: CharacterAction;
  remotePlayers: RemotePlayer[];
  onCameraModeChange: (mode: CameraMode) => void;
  onSelectFrame: (frame: PictureFrameItem) => void;
  onSelectDedication: () => void;
  onSitDownCinema: () => void;
  onActiveTargetChange: (target: InteractiveTarget | null) => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportComplete?: () => void;
  isCinemaPlaying?: boolean;
  onOpenVideoSettings?: () => void;
  onPositionUpdate?: (
    pos: [number, number, number],
    rotY: number,
    moving: boolean,
    seated: boolean
  ) => void;
}

export const MuseumScene: React.FC<MuseumSceneProps> = ({
  config,
  frames,
  cameraMode,
  lightingPreset,
  selectedAvatar,
  currentAction,
  remotePlayers,
  onCameraModeChange,
  onSelectFrame,
  onSelectDedication,
  onSitDownCinema,
  onActiveTargetChange,
  teleportTarget,
  onTeleportComplete,
  isCinemaPlaying = true,
  onOpenVideoSettings,
  onPositionUpdate,
}) => {
  const slideImages = frames
    .filter((f) => !!f.imageUrl)
    .map((f) => f.imageUrl as string);

  return (
    <div className="w-full h-full relative bg-[#121214]">
      <Canvas
        shadows
        camera={{ position: [0, 1.7, 1.8], fov: 60, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95, // Soft, dim, moody tone
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <EnvironmentHook lightingPreset={lightingPreset} />

          {/* Luxury Museum Gallery Architecture with Dim Atmospheric Lighting */}
          <MuseumArchitecture
            config={config}
            onSelectDedication={onSelectDedication}
          />

          {/* Wall Art Picture Frames with Focused Gallery Spotlights */}
          {frames.map((frame) => (
            <PictureFrame3D
              key={frame.id}
              frame={frame}
              onSelect={onSelectFrame}
              userRole={config.userRole}
            />
          ))}

          {/* Cinema Wall Video Display & Minimalist Gallery Bench */}
          <CinemaRoom3D
            position={[0, 0, 0]}
            onSitDown={onSitDownCinema}
            slideImages={slideImages}
            isCinemaPlaying={isCinemaPlaying}
            videoUrl={config.cinemaVideoUrl}
            onOpenVideoSettings={onOpenVideoSettings}
            userRole={config.userRole}
          />

          {/* Remote Partner in Multiplayer Session */}
          {remotePlayers.map((player) => (
            <Avatars
              key={player.id}
              position={player.position}
              rotationY={player.rotationY}
              isMoving={player.isMoving}
              isSeated={player.isSeated}
              selectedAvatar={player.avatar || 'mira'}
              playerName={player.name}
              action={player.action || 'idle'}
              isRemote={true}
              seatOffset={0.55} // Sit on right side of bench
            />
          ))}

          {/* Local Player Controller & Avatar */}
          <PlayerController
            cameraMode={cameraMode}
            onCameraModeChange={onCameraModeChange}
            frames={frames}
            selectedAvatar={selectedAvatar}
            playerName={config.playerName || (selectedAvatar === 'kai' ? 'James' : 'Emily')}
            currentAction={currentAction}
            onInteractFrame={onSelectFrame}
            onInteractDedication={onSelectDedication}
            onInteractCinemaSeat={onSitDownCinema}
            onActiveTargetChange={onActiveTargetChange}
            teleportTarget={teleportTarget}
            onTeleportComplete={onTeleportComplete}
            onPositionUpdate={onPositionUpdate}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
