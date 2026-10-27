export interface PictureFrameItem {
  id: string;
  roomId: 'entrance' | 'memories' | 'whispers' | 'cinema';
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  title: string;
  date: string;
  story: string;
  imageUrl?: string;
  aspectRatio?: number;
}

export type UserRole = 'admin' | 'partner';

export interface SoundTrackOption {
  id: string;
  title: string;
  composer: string;
  mood: string;
}

export interface MuseumConfig {
  coupleNames: string;
  partner1: string;
  partner2: string;
  anniversaryDate: string;
  title: string;
  subtitle: string;
  dedicationLetter: string;
  selectedAvatar: 'kai' | 'mira';
  playerName: string;
  partnerName: string;
  userRole: UserRole;
  selectedSongId: string;
  customAudioUrl?: string;
  cinemaVideoUrl?: string;
}

export type CameraMode = 'first-person' | 'third-person' | 'cinema-seated';

export type LightingPreset = 'golden' | 'twilight' | 'midnight';

export type CharacterAction = 'idle' | 'walk' | 'sit' | 'wave' | 'kiss' | 'dance' | 'celebrate';

export interface InteractiveTarget {
  type: 'frame' | 'dedication' | 'cinema-seat';
  id?: string;
  title: string;
  hint: string;
  distance: number;
}
