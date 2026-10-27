import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = createServer(app);

import fs from 'fs';

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Endpoint for saving uploaded images, audio songs, and cinema videos permanently
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Missing data in upload request' });
    }

    let base64Data = data;
    let ext = 'bin';
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = data.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        base64Data = match[2];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('webm')) ext = 'webm';
        else if (mime.includes('quicktime')) ext = 'mov';
        else if (mime.includes('mpeg') || mime.includes('mp3')) ext = 'mp3';
        else if (mime.includes('wav')) ext = 'wav';
        else if (mime.includes('ogg')) ext = 'ogg';
      }
    } else if (filename && filename.includes('.')) {
      ext = filename.split('.').pop() || 'bin';
    }

    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, cleanName);
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${cleanName}`;
    return res.json({ ok: true, url: publicUrl, filename: cleanName, size: buffer.length });
  } catch (err: any) {
    console.error('Error in /api/upload:', err);
    return res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// In-memory room manager for multiplayer
interface PlayerState {
  id: string;
  name: string;
  avatar: 'kai' | 'mira';
  position: [number, number, number];
  rotationY: number;
  isMoving: boolean;
  isSeated: boolean;
  action: string;
  lastActive: number;
  role: 'admin' | 'partner';
}

interface RoomData {
  players: Map<string, { ws: WebSocket; state: PlayerState }>;
  frames?: any[];
  selectedSongId?: string;
  customAudioUrl?: string;
  cinemaVideoUrl?: string;
  dedication?: any;
}

const rooms = new Map<string, RoomData>();

// Setup WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') || 'default';
  const playerId = url.searchParams.get('playerId') || `player_${Math.random().toString(36).substring(2, 9)}`;
  const role = (url.searchParams.get('role') || 'admin') as 'admin' | 'partner';

  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
    });
  }

  const room = rooms.get(roomId)!;

  // STRICT 2-MEMBER LIMIT
  // If player is not already in the room, and there are already 2 players, reject connection
  if (!room.players.has(playerId) && room.players.size >= 2) {
    ws.send(JSON.stringify({
      type: 'room:full',
      message: 'This private sanctuary is reserved for 2 members only and is currently full.',
    }));
    ws.close(1008, 'Room capacity reached (max 2 members)');
    return;
  }

  const initialPlayer: PlayerState = {
    id: playerId,
    name: role === 'partner' ? 'Emily' : 'James',
    avatar: role === 'partner' ? 'mira' : 'kai',
    position: [0, 0, 1.8],
    rotationY: 0,
    isMoving: false,
    isSeated: false,
    action: 'idle',
    lastActive: Date.now(),
    role,
  };

  room.players.set(playerId, { ws, state: initialPlayer });

  // Send initial list of existing players and museum state to the new player
  const existingPlayers: PlayerState[] = [];
  room.players.forEach((client, id) => {
    if (id !== playerId) {
      existingPlayers.push(client.state);
    }
  });

  ws.send(JSON.stringify({
    type: 'room:init',
    playerId,
    players: existingPlayers,
    frames: room.frames,
    selectedSongId: room.selectedSongId,
    customAudioUrl: room.customAudioUrl,
    cinemaVideoUrl: room.cinemaVideoUrl,
    dedication: room.dedication,
  }));

  // Notify other player that someone joined
  const joinMsg = JSON.stringify({
    type: 'player:joined',
    player: initialPlayer,
  });
  room.players.forEach((client, id) => {
    if (id !== playerId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(joinMsg);
    }
  });

  // Handle incoming messages
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'player:update') {
        const client = room.players.get(playerId);
        if (client) {
          client.state = {
            ...client.state,
            ...msg.payload,
            id: playerId,
            lastActive: Date.now(),
          };

          // Broadcast to other player
          const broadcastMsg = JSON.stringify({
            type: 'player:update',
            playerId,
            payload: client.state,
          });

          room.players.forEach((otherClient, otherId) => {
            if (otherId !== playerId && otherClient.ws.readyState === WebSocket.OPEN) {
              otherClient.ws.send(broadcastMsg);
            }
          });
        }
      } else if (msg.type === 'player:emote') {
        const emoteMsg = JSON.stringify({
          type: 'player:emote',
          playerId,
          action: msg.action,
          emoji: msg.emoji,
        });

        room.players.forEach((otherClient, otherId) => {
          if (otherId !== playerId && otherClient.ws.readyState === WebSocket.OPEN) {
            otherClient.ws.send(emoteMsg);
          }
        });
      } else if (msg.type === 'admin:update_curation') {
        // Only admin can update gallery images, cinema video, or music
        if (msg.payload.frames) room.frames = msg.payload.frames;
        if (msg.payload.selectedSongId) room.selectedSongId = msg.payload.selectedSongId;
        if (msg.payload.customAudioUrl !== undefined) room.customAudioUrl = msg.payload.customAudioUrl;
        if (msg.payload.cinemaVideoUrl !== undefined) room.cinemaVideoUrl = msg.payload.cinemaVideoUrl;
        if (msg.payload.dedication) room.dedication = msg.payload.dedication;

        // Broadcast curation updates to partner
        const syncMsg = JSON.stringify({
          type: 'room:curation_sync',
          payload: msg.payload,
        });

        room.players.forEach((otherClient, otherId) => {
          if (otherId !== playerId && otherClient.ws.readyState === WebSocket.OPEN) {
            otherClient.ws.send(syncMsg);
          }
        });
      }
    } catch {
      // Ignore invalid JSON
    }
  });

  ws.on('close', () => {
    room.players.delete(playerId);
    if (room.players.size === 0) {
      // Keep room state for reconnecting partners
    } else {
      const leaveMsg = JSON.stringify({
        type: 'player:left',
        playerId,
      });
      room.players.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(leaveMsg);
        }
      });
    }
  });
});

// REST endpoint to query room info
app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.json({ count: 0, players: [] });
  }
  const players = Array.from(room.players.values()).map((p) => ({
    id: p.state.id,
    name: p.state.name,
    avatar: p.state.avatar,
    role: p.state.role,
  }));
  res.json({ count: room.players.size, players, isFull: room.players.size >= 2 });
});

// Mount Vite middleware in development or serve static in production
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OUR MUSEUM server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
