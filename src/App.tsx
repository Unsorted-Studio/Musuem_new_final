/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { CameraMode, CharacterAction, InteractiveTarget, MuseumConfig, PictureFrameItem, UserRole } from './types/museum';
import { INITIAL_MUSEUM_CONFIG, INITIAL_FRAMES } from './data/initialMuseumData';
import { MuseumScene } from './components/3d/MuseumScene';
import { HUDOverlay } from './components/ui/HUDOverlay';
import { PhotoLightboxModal } from './components/ui/PhotoLightboxModal';
import { DedicationModal } from './components/ui/DedicationModal';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { InviteModal } from './components/ui/InviteModal';
import { CuratorSettingsModal } from './components/ui/CuratorSettingsModal';
import { TurnDeviceOverlay } from './components/ui/TurnDeviceOverlay';
import { soundtrack } from './services/soundtrack';
import { useMultiplayer, getUserRoleFromUrl } from './services/multiplayer';
import {
  subscribeMuseumConfig,
  subscribeFrames,
  persistMuseumConfig,
  persistFrame,
  seedInitialMuseumDataIfEmpty,
  loadCachedMuseumConfig,
  loadCachedFrames,
} from './services/museumStorage';
import { preloadCoupleAvatars } from './services/modelLoader';

export default function App() {
  // Determine if this browser session is Admin (creator) or Partner (invited guest)
  const userRole: UserRole = useMemo(() => getUserRoleFromUrl(), []);
  const isInvitedPartner = userRole === 'partner';

  const [config, setConfig] = useState<MuseumConfig>(() => {
    const cached = loadCachedMuseumConfig();
    return {
      ...INITIAL_MUSEUM_CONFIG,
      ...(cached || {}),
      userRole,
      selectedAvatar: isInvitedPartner ? 'mira' : 'kai',
      playerName: isInvitedPartner
        ? (cached?.partnerName || 'Emily')
        : (cached?.playerName || 'James'),
      partnerName: isInvitedPartner
        ? (cached?.playerName || 'James')
        : (cached?.partnerName || 'Emily'),
      selectedSongId: cached?.selectedSongId || 'clair-de-lune',
      customAudioUrl: cached?.customAudioUrl || '',
      cinemaVideoUrl: cached?.cinemaVideoUrl || '',
    };
  });

  const [frames, setFrames] = useState<PictureFrameItem[]>(() => {
    const cachedFramesMap = loadCachedFrames();
    return INITIAL_FRAMES.map((f) => {
      const cached = cachedFramesMap[f.id];
      return cached ? { ...f, ...cached } : f;
    });
  });
  const [cameraMode, setCameraMode] = useState<CameraMode>('third-person');
  const [lightingPreset, setLightingPreset] = useState<'golden' | 'twilight' | 'midnight'>('golden');
  const [currentAction, setCurrentAction] = useState<CharacterAction>('idle');
  
  // Navigation & Teleportation
  const [teleportTarget, setTeleportTarget] = useState<[number, number, number] | null>(null);

  // Active interaction detection
  const [activeTarget, setActiveTarget] = useState<InteractiveTarget | null>(null);

  // Modals
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<PictureFrameItem | null>(null);
  const [isDedicationOpen, setIsDedicationOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCuratorSettingsOpen, setIsCuratorSettingsOpen] = useState(false);
  const [curatorTab, setCuratorTab] = useState<'music' | 'video'>('music');
  const [isCinemaPlaying, setIsCinemaPlaying] = useState(true);

  const handleOpenCuratorMusic = () => {
    setCuratorTab('music');
    setIsCuratorSettingsOpen(true);
  };

  const handleOpenCuratorVideo = () => {
    setCuratorTab('video');
    setIsCuratorSettingsOpen(true);
  };

  // Local player state for multiplayer synchronization
  const [localPos, setLocalPos] = useState<[number, number, number]>([0, 0, 1.8]);
  const [localRotY, setLocalRotY] = useState(0);
  const [localMoving, setLocalMoving] = useState(false);

  // Initialize Firestore real-time listeners, seed data, and preload 3D avatars
  useEffect(() => {
    preloadCoupleAvatars().catch((err) => console.warn('Preload avatars error:', err));
    seedInitialMuseumDataIfEmpty(INITIAL_MUSEUM_CONFIG, INITIAL_FRAMES);

    const unsubConfig = subscribeMuseumConfig((remoteConfig) => {
      setConfig((prev) => {
        let nextPlayerName = prev.playerName;
        let nextPartnerName = prev.partnerName;

        if (isInvitedPartner) {
          // For partner:
          // Admin who created the sanctuary is remoteConfig.partner1 || remoteConfig.playerName
          // Partner's own name entered by admin is remoteConfig.partner2 || remoteConfig.partnerName
          const adminCreator =
            remoteConfig.partner1 ||
            (remoteConfig.playerName && remoteConfig.playerName !== 'Emily'
              ? remoteConfig.playerName
              : 'James');
          const partnerInvited =
            remoteConfig.partner2 ||
            (remoteConfig.partnerName && remoteConfig.partnerName !== 'James'
              ? remoteConfig.partnerName
              : 'Emily');

          nextPlayerName = partnerInvited;
          nextPartnerName = adminCreator;
        } else {
          if (remoteConfig.partner1 || remoteConfig.playerName) {
            nextPlayerName = remoteConfig.partner1 || remoteConfig.playerName || prev.playerName;
          }
          if (remoteConfig.partner2 || remoteConfig.partnerName) {
            nextPartnerName = remoteConfig.partner2 || remoteConfig.partnerName || prev.partnerName;
          }
        }

        const next = {
          ...prev,
          ...remoteConfig,
          playerName: nextPlayerName,
          partnerName: nextPartnerName,
          userRole,
          selectedAvatar: prev.selectedAvatar || (isInvitedPartner ? 'mira' : 'kai'),
        };

        if (remoteConfig.selectedSongId && remoteConfig.selectedSongId !== prev.selectedSongId) {
          soundtrack.setTrack(remoteConfig.selectedSongId, remoteConfig.customAudioUrl);
        }
        return next;
      });
    });

    const unsubFrames = subscribeFrames((remoteFrames) => {
      if (remoteFrames && remoteFrames.length > 0) {
        setFrames((prev) => {
          return prev.map((f) => {
            const remote = remoteFrames.find((rf) => rf.id === f.id);
            return remote ? { ...f, ...remote } : f;
          });
        });
      }
    });

    return () => {
      unsubConfig();
      unsubFrames();
    };
  }, [isInvitedPartner, userRole]);

  // Sync curation from Admin to Partner
  const handleCurationSync = useCallback(
    (payload: any) => {
      if (payload.frames) {
        setFrames(payload.frames);
      }
      if (payload.selectedSongId) {
        setConfig((prev) => ({
          ...prev,
          selectedSongId: payload.selectedSongId,
          customAudioUrl: payload.customAudioUrl,
        }));
        soundtrack.setTrack(payload.selectedSongId, payload.customAudioUrl);
      }
      if (payload.cinemaVideoUrl !== undefined) {
        setConfig((prev) => ({ ...prev, cinemaVideoUrl: payload.cinemaVideoUrl }));
      }
      if (payload.dedication) {
        setConfig((prev) => {
          if (isInvitedPartner) {
            const adminCreator =
              payload.dedication.partner1 ||
              payload.dedication.playerName ||
              'James';
            const partnerInvited =
              payload.dedication.partner2 ||
              payload.dedication.partnerName ||
              'Emily';
            return {
              ...prev,
              ...payload.dedication,
              playerName: partnerInvited,
              partnerName: adminCreator,
            };
          }
          return { ...prev, ...payload.dedication };
        });
      }
    },
    [isInvitedPartner]
  );

  // Multiplayer Hook
  const {
    roomId,
    remotePlayers,
    isRoomFull,
    broadcastLocalState,
    sendEmote,
    broadcastCuration,
    floatingEmotes,
  } = useMultiplayer(
    {
      name: config.playerName || (config.selectedAvatar === 'kai' ? 'James' : 'Emily'),
      avatar: config.selectedAvatar || 'kai',
      position: localPos,
      rotationY: localRotY,
      isMoving: localMoving,
      isSeated: cameraMode === 'cinema-seated',
      action: currentAction,
      role: userRole,
    },
    handleCurationSync
  );

  // Handle position update from player controller
  const handlePositionUpdate = useCallback(
    (pos: [number, number, number], rotY: number, moving: boolean, seated: boolean) => {
      setLocalPos(pos);
      setLocalRotY(rotY);
      setLocalMoving(moving);

      broadcastLocalState({
        position: pos,
        rotationY: rotY,
        isMoving: moving,
        isSeated: seated,
        name: config.playerName,
        avatar: config.selectedAvatar,
        action: currentAction,
      });
    },
    [broadcastLocalState, config.playerName, config.selectedAvatar, currentAction]
  );

  // Frame Inspection Handler
  const handleSelectFrame = (frame: PictureFrameItem) => {
    soundtrack.playInspectChime();
    setSelectedFrame(frame);
  };

  // Frame Update (Admin Only - Persists to Firestore Database)
  const handleSaveFrame = (updated: PictureFrameItem) => {
    if (userRole !== 'admin') return;
    const updatedFrames = frames.map((f) => (f.id === updated.id ? updated : f));
    setFrames(updatedFrames);
    setSelectedFrame(updated);
    // Persist to Firestore database
    persistFrame(updated);
    // Broadcast newly mounted image to partner
    broadcastCuration({ frames: updatedFrames });
  };

  // Dedication Wall Handler
  const handleSelectDedication = () => {
    soundtrack.playInspectChime();
    setIsDedicationOpen(true);
  };

  // Dedication Config Update (Admin Only - Persists to Firestore Database)
  const handleSaveConfig = (updated: Partial<MuseumConfig>) => {
    if (userRole !== 'admin') return;
    const newConfig = { ...config, ...updated };
    setConfig(newConfig);
    // Persist to Firestore database
    persistMuseumConfig(updated);
    broadcastCuration({ dedication: updated });
  };

  // Curator Music & Video Settings (Admin Only - Persists to Firestore Database)
  const handleSaveCuratorSettings = (settings: {
    selectedSongId: string;
    customAudioUrl?: string;
    cinemaVideoUrl?: string;
  }) => {
    if (userRole !== 'admin') return;
    setConfig((prev) => ({
      ...prev,
      selectedSongId: settings.selectedSongId,
      customAudioUrl: settings.customAudioUrl,
      cinemaVideoUrl: settings.cinemaVideoUrl,
    }));
    soundtrack.setTrack(settings.selectedSongId, settings.customAudioUrl);
    // Persist to Firestore database
    persistMuseumConfig({
      selectedSongId: settings.selectedSongId,
      customAudioUrl: settings.customAudioUrl,
      cinemaVideoUrl: settings.cinemaVideoUrl,
    });
    broadcastCuration({
      selectedSongId: settings.selectedSongId,
      customAudioUrl: settings.customAudioUrl,
      cinemaVideoUrl: settings.cinemaVideoUrl,
    });
  };

  // Cinema Sit-Down Handler
  const handleSitDownCinema = () => {
    soundtrack.playCameraSwitch();
    if (cameraMode === 'cinema-seated') {
      setCameraMode('third-person');
      setCurrentAction('idle');
      broadcastLocalState({ isSeated: false, action: 'idle' });
    } else {
      setCameraMode('cinema-seated');
      setCurrentAction('sit');
      broadcastLocalState({ isSeated: true, action: 'sit' });
    }
  };

  // Emote Trigger
  const handleTriggerAction = (action: CharacterAction, emoji?: string) => {
    setCurrentAction(action);
    if (emoji) {
      sendEmote(action, emoji);
    }
    broadcastLocalState({ action });
  };

  // Contextual Interaction execution (via [E] or floating pill button)
  const handleTriggerActiveTarget = () => {
    if (cameraMode === 'cinema-seated') {
      handleSitDownCinema();
      return;
    }

    if (!activeTarget) return;

    if (activeTarget.type === 'dedication') {
      handleSelectDedication();
    } else if (activeTarget.type === 'cinema-seat') {
      handleSitDownCinema();
    } else if (activeTarget.type === 'frame' && activeTarget.id) {
      const frame = frames.find((f) => f.id === activeTarget.id);
      if (frame) handleSelectFrame(frame);
    }
  };

  // Teleport handler
  const handleTeleport = (pos: [number, number, number]) => {
    if (cameraMode === 'cinema-seated') {
      setCameraMode('third-person');
    }
    setTeleportTarget(pos);
  };

  // Welcome page submission
  const handleEnterMuseum = (customConfig?: MuseumConfig) => {
    if (customConfig) {
      setConfig(customConfig);
      broadcastLocalState({
        name: customConfig.playerName,
        avatar: customConfig.selectedAvatar,
      });

      if (userRole === 'admin') {
        const adminName = customConfig.playerName.trim() || 'James';
        const partnerName = customConfig.partnerName.trim() || 'Emily';
        const coupleNames = `${adminName} & ${partnerName}`;
        const subtitle = `A Permanent Collection for ${partnerName}`;

        const payload = {
          partner1: adminName,
          partner2: partnerName,
          playerName: adminName,
          partnerName: partnerName,
          coupleNames,
          subtitle,
        };

        persistMuseumConfig(payload);
        broadcastCuration({ dedication: payload });
      }
    }
    setIsWelcomeOpen(false);
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#121214] font-sans">
      {/* 3D Museum Canvas with Dim Moody Atmosphere, Art Spotlights, and Avatars */}
      <MuseumScene
        config={config}
        frames={frames}
        cameraMode={cameraMode}
        lightingPreset={lightingPreset}
        selectedAvatar={config.selectedAvatar || 'kai'}
        currentAction={currentAction}
        remotePlayers={remotePlayers}
        onCameraModeChange={setCameraMode}
        onSelectFrame={handleSelectFrame}
        onSelectDedication={handleSelectDedication}
        onSitDownCinema={handleSitDownCinema}
        onActiveTargetChange={setActiveTarget}
        teleportTarget={teleportTarget}
        onTeleportComplete={() => setTeleportTarget(null)}
        isCinemaPlaying={isCinemaPlaying}
        onOpenVideoSettings={handleOpenCuratorVideo}
        onPositionUpdate={handlePositionUpdate}
      />

      {/* GiftVera Style HUD Overlay with Reaction Drawer & Header Capsule */}
      <HUDOverlay
        config={config}
        cameraMode={cameraMode}
        lightingPreset={lightingPreset}
        remotePlayers={remotePlayers}
        userRole={userRole}
        onLightingPresetChange={setLightingPreset}
        onCameraModeChange={setCameraMode}
        activeTarget={activeTarget}
        onTriggerTarget={handleTriggerActiveTarget}
        onTriggerAction={handleTriggerAction}
        onTeleport={handleTeleport}
        onOpenDedication={handleSelectDedication}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenCuratorSettings={handleOpenCuratorMusic}
        onOpenCuratorVideo={handleOpenCuratorVideo}
        floatingEmotes={floatingEmotes}
      />

      {/* Explore Our Museum Onboarding Modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onEnterMuseum={handleEnterMuseum}
        defaultConfig={config}
        userRole={userRole}
        isRoomFull={isRoomFull}
      />

      {/* Frame Inspection & Admin-Only Photo Upload Modal */}
      <PhotoLightboxModal
        frame={selectedFrame}
        onClose={() => setSelectedFrame(null)}
        onSaveFrame={handleSaveFrame}
        userRole={userRole}
      />

      {/* Dedication Plaque Modal */}
      <DedicationModal
        config={config}
        isOpen={isDedicationOpen}
        onClose={() => setIsDedicationOpen(false)}
        onSaveConfig={handleSaveConfig}
      />

      {/* Real-time 2-Player Co-Op Share Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
        remotePlayers={remotePlayers}
        localPlayerName={config.playerName}
        localAvatar={config.selectedAvatar || 'kai'}
      />

      {/* Curator Music & Video Settings Modal (Admin Only) */}
      <CuratorSettingsModal
        isOpen={isCuratorSettingsOpen}
        onClose={() => setIsCuratorSettingsOpen(false)}
        selectedSongId={config.selectedSongId || 'clair-de-lune'}
        customAudioUrl={config.customAudioUrl}
        cinemaVideoUrl={config.cinemaVideoUrl}
        initialTab={curatorTab}
        onSaveSettings={handleSaveCuratorSettings}
      />

      {/* Mobile Horizontal Orientation Enforcement (Turn Device Overlay) */}
      <TurnDeviceOverlay />
    </main>
  );
}
