import { CharacterAction } from './museum';

export interface RemotePlayer {
  id: string;
  name: string;
  avatar: 'kai' | 'mira';
  position: [number, number, number];
  rotationY: number;
  isMoving: boolean;
  isSeated: boolean;
  action: CharacterAction;
  emoji?: string;
  lastActive?: number;
}

export interface MultiplayerState {
  isConnected: boolean;
  roomId: string;
  playerId: string;
  remotePlayers: RemotePlayer[];
  broadcastLocalState: (state: Partial<RemotePlayer>) => void;
  sendEmote: (action: CharacterAction, emoji: string) => void;
}
