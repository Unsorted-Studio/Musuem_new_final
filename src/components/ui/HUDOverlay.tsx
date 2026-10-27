import React, { useState } from 'react';
import { CameraMode, CharacterAction, InteractiveTarget, LightingPreset, MuseumConfig, UserRole } from '../../types/museum';
import { RemotePlayer } from '../../types/multiplayer';
import {
  Eye,
  User,
  Smile,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Search,
  ArrowUp,
  X,
  Heart,
  Users,
  Disc,
  Video,
} from 'lucide-react';
import { soundtrack } from '../../services/soundtrack';

interface HUDOverlayProps {
  config: MuseumConfig;
  cameraMode: CameraMode;
  lightingPreset: LightingPreset;
  remotePlayers: RemotePlayer[];
  userRole?: UserRole;
  onLightingPresetChange: (preset: LightingPreset) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  activeTarget: InteractiveTarget | null;
  onTriggerTarget: () => void;
  onTriggerAction: (action: CharacterAction, emoji?: string) => void;
  onTeleport: (pos: [number, number, number]) => void;
  onOpenDedication: () => void;
  onOpenInvite: () => void;
  onOpenCuratorSettings?: () => void;
  onOpenCuratorVideo?: () => void;
  floatingEmotes?: Array<{ id: string; playerId: string; emoji: string }>;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  cameraMode,
  remotePlayers,
  userRole = 'admin',
  onCameraModeChange,
  activeTarget,
  onTriggerTarget,
  onTriggerAction,
  onTeleport,
  onOpenDedication,
  onOpenInvite,
  onOpenCuratorSettings,
  onOpenCuratorVideo,
  floatingEmotes = [],
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(soundtrack.getIsPlaying());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReactDrawer, setShowReactDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [localFloatingReaction, setLocalFloatingReaction] = useState<string | null>(null);

  // Sync music state
  const handleToggleMusic = () => {
    const playing = soundtrack.toggle();
    setIsPlayingMusic(playing);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Trigger Reaction & Emote
  const handleSelectReaction = (action: CharacterAction, symbol: string) => {
    onTriggerAction(action, symbol);
    setLocalFloatingReaction(symbol);
    setTimeout(() => {
      setLocalFloatingReaction(null);
      onTriggerAction('idle');
    }, 2800);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 font-sans">
      
      {/* ============================================================== */}
      {/* 1. TOP RIGHT FLOATING CONTROLS CAPSULE (Exact GiftVera Header) */}
      {/* ============================================================== */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-center bg-[#1c1c1f]/85 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 shadow-xl text-stone-200 gap-1.5">
        
        {/* Share / Invite Partner Button */}
        <button
          onClick={onOpenInvite}
          className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
            remotePlayers.length > 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'hover:bg-white/10 text-stone-300 hover:text-white'
          }`}
          title="Invite Partner to Explore Together"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {remotePlayers.length > 0 ? 'Partner (1/1)' : 'Invite Partner'}
          </span>
          {remotePlayers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
          )}
        </button>

        {/* Admin Music & Cinema Curator Button */}
        {userRole === 'admin' && onOpenCuratorSettings && (
          <button
            onClick={onOpenCuratorSettings}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-amber-300 hover:text-amber-200"
            title="Choose Music & Cinema Video (Admin)"
          >
            <Disc className="w-4 h-4" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-white/15 my-auto" />

        {/* Camera Toggle: 1st / 3rd Person */}
        <button
          onClick={() => {
            soundtrack.playCameraSwitch();
            if (cameraMode === 'first-person') onCameraModeChange('third-person');
            else if (cameraMode === 'third-person') onCameraModeChange('first-person');
            else if (cameraMode === 'cinema-seated') onCameraModeChange('third-person');
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-stone-300 hover:text-white"
          title={cameraMode === 'first-person' ? 'Third Person View' : 'First Person View'}
        >
          {cameraMode === 'first-person' ? <Eye className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </button>

        {/* Reaction Drawer Toggle */}
        <button
          onClick={() => {
            setShowReactDrawer((prev) => !prev);
            setShowSettingsDrawer(false);
          }}
          className={`p-2 rounded-lg transition-colors ${
            showReactDrawer ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-stone-300 hover:text-white'
          }`}
          title="Reactions & Emotes"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleMusic}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-stone-300 hover:text-white"
          title={isPlayingMusic ? 'Mute Audio' : 'Play Audio'}
        >
          {isPlayingMusic ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleToggleFullscreen}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-stone-300 hover:text-white"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Settings / Navigation Drawer Toggle */}
        <button
          onClick={() => {
            setShowSettingsDrawer((prev) => !prev);
            setShowReactDrawer(false);
          }}
          className={`p-2 rounded-lg transition-colors ${
            showSettingsDrawer ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-stone-300 hover:text-white'
          }`}
          title="Settings & Rooms"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. REACTION DRAWER (Exact GiftVera Right-Hand Panel)          */}
      {/* ============================================================== */}
      {showReactDrawer && (
        <div className="absolute top-16 right-4 pointer-events-auto w-56 bg-[#1a1a1d]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-stone-100 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h3 className="font-serif italic text-lg text-stone-200">React</h3>
            <button
              onClick={() => setShowReactDrawer(false)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-sm">
            {[
              { label: 'Wave', icon: '👋', action: 'wave' as CharacterAction },
              { label: 'Nice', icon: '👍', action: 'celebrate' as CharacterAction },
              { label: 'Agree', icon: '✔️', action: 'wave' as CharacterAction },
              { label: 'Celebrate', icon: '🎉', action: 'celebrate' as CharacterAction },
              { label: 'Blow a kiss', icon: '❤️', action: 'kiss' as CharacterAction },
              { label: 'Dance', icon: '🎵', action: 'dance' as CharacterAction },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectReaction(item.action, item.icon)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-left transition-colors text-stone-300 hover:text-white font-medium text-xs"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SETTINGS & ROOM NAV DRAWER                                  */}
      {/* ============================================================== */}
      {showSettingsDrawer && (
        <div className="absolute top-16 right-4 pointer-events-auto w-64 bg-[#1a1a1d]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl text-stone-100 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h3 className="font-serif italic text-lg text-stone-200">Options & Gallery</h3>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Teleport */}
            <div>
              <span className="text-stone-400 font-sans block mb-2 uppercase tracking-wider text-[10px]">
                Jump to Location
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onTeleport([0, 0, 1.8]);
                    setShowSettingsDrawer(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-stone-200 transition-colors"
                >
                  Gallery Entrance
                </button>
                <button
                  onClick={() => {
                    onTeleport([0, 0, -4.5]);
                    setShowSettingsDrawer(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-stone-200 transition-colors"
                >
                  Centerpiece Display
                </button>
                <button
                  onClick={() => {
                    onTeleport([0, 0, -30]);
                    setShowSettingsDrawer(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-stone-200 transition-colors"
                >
                  Cinema Video Screen & Bench
                </button>
              </div>
            </div>

            {/* Read Dedication */}
            <div>
              <button
                onClick={() => {
                  onOpenDedication();
                  setShowSettingsDrawer(false);
                }}
                className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 rounded-lg text-stone-100 font-medium text-center transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Read Dedication Note
              </button>
            </div>

            {/* Admin Music & Video Settings */}
            {userRole === 'admin' && onOpenCuratorSettings && (
              <div>
                <button
                  onClick={() => {
                    onOpenCuratorSettings();
                    setShowSettingsDrawer(false);
                  }}
                  className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  Choose Music & Cinema Video
                </button>
              </div>
            )}

            {/* Share link button */}
            <div>
              <button
                onClick={() => {
                  onOpenInvite();
                  setShowSettingsDrawer(false);
                }}
                className="w-full py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-200 font-medium text-center transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-rose-400" />
                Invite Partner Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. FLOATING INTERACTION PILL (Exact GiftVera Sit/Stand/Zoom)   */}
      {/* ============================================================== */}
      {cameraMode === 'cinema-seated' ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-auto animate-in fade-in duration-200 flex items-center gap-2.5">
          <button
            onClick={onTriggerTarget}
            className="px-6 py-2.5 bg-[#1c1c1f]/95 hover:bg-black text-white text-xs font-medium rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95"
          >
            Stand up
          </button>
          {userRole === 'admin' && onOpenCuratorVideo && (
            <button
              onClick={onOpenCuratorVideo}
              className="px-5 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium rounded-full shadow-2xl border border-rose-400/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Add / Change Video</span>
            </button>
          )}
        </div>
      ) : activeTarget ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-auto animate-in fade-in duration-200">
          {activeTarget.type === 'cinema-seat' ? (
            <button
              onClick={onTriggerTarget}
              className="px-6 py-2.5 bg-[#1c1c1f]/95 hover:bg-black text-white text-xs font-medium rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Sit</span>
            </button>
          ) : activeTarget.type === 'frame' ? (
            <button
              onClick={onTriggerTarget}
              className="p-3 bg-[#1c1c1f]/95 hover:bg-black text-white rounded-full shadow-2xl border border-white/20 transition-all hover:scale-110 flex items-center justify-center"
              title="Zoom Photo"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onTriggerTarget}
              className="px-6 py-2.5 bg-[#1c1c1f]/95 hover:bg-black text-white text-xs font-medium rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105"
            >
              View
            </button>
          )}
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* 5. FLOATING REACTION EMOJIS (Local and Remote Partner)         */}
      {/* ============================================================== */}
      {localFloatingReaction && (
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-5xl pointer-events-none animate-bounce">
          {localFloatingReaction}
        </div>
      )}

      {floatingEmotes.map((em) => (
        <div
          key={em.id}
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-5xl pointer-events-none animate-bounce"
        >
          {em.emoji}
        </div>
      ))}

      {/* ============================================================== */}
      {/* 6. BOTTOM RIGHT MOVE / STEP BUTTON (Exact GiftVera Up Arrow)   */}
      {/* ============================================================== */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <button
          onClick={() => {
            const eventDown = new KeyboardEvent('keydown', { code: 'KeyW' });
            window.dispatchEvent(eventDown);
            setTimeout(() => {
              const eventUp = new KeyboardEvent('keyup', { code: 'KeyW' });
              window.dispatchEvent(eventUp);
            }, 300);
          }}
          className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-xl border border-stone-200 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          title="Step Forward"
        >
          <ArrowUp className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
