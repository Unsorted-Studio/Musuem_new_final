import { useEffect, useRef, useState, useCallback } from 'react';
import { RemotePlayer } from '../types/multiplayer';
import { CharacterAction, UserRole } from '../types/museum';

// Helper to get or create room ID from URL
export function getRoomIdFromUrl(): string {
  if (typeof window === 'undefined') return 'our-sanctuary';
  const params = new URLSearchParams(window.location.search);
  let room = params.get('room');
  if (!room) {
    const adjectives = ['amour', 'eternal', 'celestial', 'romance', 'sanctuary', 'cherish'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    room = `${randomAdj}-${randomNum}`;
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', room);
    window.history.replaceState({}, '', newUrl.toString());
  }
  return room;
}

export function getUserRoleFromUrl(): UserRole {
  if (typeof window === 'undefined') return 'admin';
  const params = new URLSearchParams(window.location.search);
  return params.get('role') === 'partner' || params.get('partner') === 'true' ? 'partner' : 'admin';
}

export function useMultiplayer(
  localPlayer: {
    name: string;
    avatar: 'kai' | 'mira';
    position: [number, number, number];
    rotationY: number;
    isMoving: boolean;
    isSeated: boolean;
    action: CharacterAction;
    role: UserRole;
  },
  onCurationSync?: (curation: any) => void
) {
  const [roomId, setRoomId] = useState<string>(() => getRoomIdFromUrl());
  const [playerId] = useState<string>(() => {
    const saved = sessionStorage.getItem('our_museum_player_id');
    if (saved) return saved;
    const newId = `p_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('our_museum_player_id', newId);
    return newId;
  });

  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [floatingEmotes, setFloatingEmotes] = useState<Array<{ id: string; playerId: string; emoji: string }>>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastSentTime = useRef(0);

  // Initialize Connection
  useEffect(() => {
    // 1. Setup local BroadcastChannel
    try {
      const bc = new BroadcastChannel(`our-museum-room-${roomId}`);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg.senderId === playerId) return;

        if (msg.type === 'player:update') {
          setRemotePlayers((prev) => {
            const index = prev.findIndex((p) => p.id === msg.player.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...msg.player };
              return updated;
            }
            return [...prev, msg.player];
          });
        } else if (msg.type === 'player:emote') {
          triggerRemoteEmote(msg.player.id, msg.action, msg.emoji);
        } else if (msg.type === 'room:curation_sync') {
          onCurationSync?.(msg.payload);
        } else if (msg.type === 'player:left') {
          setRemotePlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
        }
      };
    } catch {}

    // 2. Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}&role=${encodeURIComponent(localPlayer.role)}`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setIsRoomFull(false);
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);

            if (data.type === 'room:full') {
              setIsRoomFull(true);
            } else if (data.type === 'room:init') {
              if (Array.isArray(data.players)) {
                setRemotePlayers(data.players);
              }
              if (data.frames || data.selectedSongId || data.cinemaVideoUrl) {
                onCurationSync?.({
                  frames: data.frames,
                  selectedSongId: data.selectedSongId,
                  customAudioUrl: data.customAudioUrl,
                  cinemaVideoUrl: data.cinemaVideoUrl,
                  dedication: data.dedication,
                });
              }
            } else if (data.type === 'player:joined') {
              setRemotePlayers((prev) => {
                if (prev.some((p) => p.id === data.player.id)) return prev;
                return [...prev, data.player];
              });
            } else if (data.type === 'player:update') {
              setRemotePlayers((prev) => {
                const index = prev.findIndex((p) => p.id === data.playerId);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], ...data.payload };
                  return updated;
                }
                return [...prev, data.payload];
              });
            } else if (data.type === 'room:curation_sync') {
              onCurationSync?.(data.payload);
            } else if (data.type === 'player:emote') {
              triggerRemoteEmote(data.playerId, data.action, data.emoji);
            } else if (data.type === 'player:left') {
              setRemotePlayers((prev) => prev.filter((p) => p.id !== data.playerId));
            }
          } catch {}
        };

        ws.onclose = (e) => {
          setIsConnected(false);
          if (e.code === 1008) {
            setIsRoomFull(true);
            return;
          }
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch {}
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    };
  }, [roomId, playerId, localPlayer.role]);

  // Handle remote emote display
  const triggerRemoteEmote = (fromPlayerId: string, action: CharacterAction, emoji?: string) => {
    setRemotePlayers((prev) =>
      prev.map((p) => (p.id === fromPlayerId ? { ...p, action, emoji } : p))
    );

    if (emoji) {
      const emoteId = `${fromPlayerId}_${Date.now()}`;
      setFloatingEmotes((prev) => [...prev, { id: emoteId, playerId: fromPlayerId, emoji }]);
      setTimeout(() => {
        setFloatingEmotes((prev) => prev.filter((e) => e.id !== emoteId));
      }, 3000);
    }

    setTimeout(() => {
      setRemotePlayers((prev) =>
        prev.map((p) => (p.id === fromPlayerId ? { ...p, action: 'idle', emoji: undefined } : p))
      );
    }, 2800);
  };

  // Broadcast local player state throttled
  const broadcastLocalState = useCallback(
    (overrideState?: Partial<RemotePlayer>) => {
      const now = performance.now();
      if (now - lastSentTime.current < 45 && !overrideState) {
        return;
      }
      lastSentTime.current = now;

      const payload: RemotePlayer = {
        id: playerId,
        name: localPlayer.name,
        avatar: localPlayer.avatar,
        position: localPlayer.position,
        rotationY: localPlayer.rotationY,
        isMoving: localPlayer.isMoving,
        isSeated: localPlayer.isSeated,
        action: localPlayer.action,
        ...overrideState,
      };

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'player:update',
            payload,
          })
        );
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'player:update',
          senderId: playerId,
          player: payload,
        });
      }
    },
    [playerId, localPlayer]
  );

  // Send an emote / reaction to partner
  const sendEmote = useCallback(
    (action: CharacterAction, emoji: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'player:emote',
            action,
            emoji,
          })
        );
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'player:emote',
          senderId: playerId,
          action,
          emoji,
        });
      }
    },
    [playerId]
  );

  // Admin broadcast curation updates (frames, music, cinema video)
  const broadcastCuration = useCallback(
    (curationPayload: any) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'admin:update_curation',
            payload: curationPayload,
          })
        );
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'room:curation_sync',
          senderId: playerId,
          payload: curationPayload,
        });
      }
    },
    [playerId]
  );

  return {
    roomId,
    setRoomId,
    playerId,
    isConnected,
    isRoomFull,
    remotePlayers,
    broadcastLocalState,
    sendEmote,
    broadcastCuration,
    floatingEmotes,
  };
}
