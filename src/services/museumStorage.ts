import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MuseumConfig, PictureFrameItem } from '../types/museum';

const CONFIG_DOC_ID = 'default';
const CONFIG_PATH = `museum_config/${CONFIG_DOC_ID}`;
const FRAMES_COLLECTION_PATH = 'frames';

/**
 * Subscribes to real-time updates for museum global configuration (music, cinema video, dedication letter).
 */
export function subscribeMuseumConfig(
  onUpdate: (config: Partial<MuseumConfig>) => void
): () => void {
  try {
    const configDocRef = doc(db, 'museum_config', CONFIG_DOC_ID);
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<MuseumConfig>;
          onUpdate(data);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CONFIG_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, CONFIG_PATH);
    return () => {};
  }
}

/**
 * Subscribes to real-time updates for all wall-mounted picture frames.
 */
export function subscribeFrames(
  onUpdate: (frames: PictureFrameItem[]) => void
): () => void {
  try {
    const framesColRef = collection(db, FRAMES_COLLECTION_PATH);
    const unsubscribe = onSnapshot(
      framesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedFrames: PictureFrameItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedFrames.push(docSnap.data() as PictureFrameItem);
          });
          onUpdate(loadedFrames);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, FRAMES_COLLECTION_PATH);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, FRAMES_COLLECTION_PATH);
    return () => {};
  }
}

/**
 * Helper to upload a media file (photo, soundtrack, cinema video) to the permanent backend storage.
 * Returns the permanent public URL (e.g. /uploads/12345.jpg).
 */
export async function uploadMediaAsset(
  fileOrPayload: File | { filename: string; data: string }
): Promise<string> {
  try {
    let filename = '';
    let data = '';

    if (fileOrPayload instanceof File) {
      filename = fileOrPayload.name;
      data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrPayload);
      });
    } else {
      filename = fileOrPayload.filename;
      data = fileOrPayload.data;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.url) {
        return result.url;
      }
    }
  } catch (err) {
    console.warn('Backend upload server unreachable or error, falling back:', err);
  }

  // Fallback to data URL directly if backend unavailable
  return typeof fileOrPayload === 'object' && 'data' in fileOrPayload
    ? fileOrPayload.data
    : '';
}

/**
 * Loads cached museum configuration from local storage for instant render on refresh.
 */
export function loadCachedMuseumConfig(): Partial<MuseumConfig> | null {
  try {
    const raw = localStorage.getItem('our_museum_config_cache');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Loads cached picture frames from local storage for instant render on refresh.
 */
export function loadCachedFrames(): Record<string, PictureFrameItem> {
  const result: Record<string, PictureFrameItem> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('our_museum_frame_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const item = JSON.parse(raw);
          if (item?.id) result[item.id] = item;
        }
      }
    }
  } catch {}
  return result;
}

/**
 * Saves or updates the museum configuration in Firestore and local cache.
 */
export async function persistMuseumConfig(config: Partial<MuseumConfig>): Promise<void> {
  const path = `museum_config/${CONFIG_DOC_ID}`;

  // Update local cache immediately
  try {
    const existing = loadCachedMuseumConfig() || {};
    localStorage.setItem('our_museum_config_cache', JSON.stringify({ ...existing, ...config }));
  } catch {}

  try {
    const configDocRef = doc(db, 'museum_config', CONFIG_DOC_ID);
    
    // Clean payload according to allowed schema
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (config.coupleNames !== undefined) payload.coupleNames = config.coupleNames;
    if (config.partner1 !== undefined) payload.partner1 = config.partner1;
    if (config.partner2 !== undefined) payload.partner2 = config.partner2;
    if (config.playerName !== undefined) payload.playerName = config.playerName;
    if (config.partnerName !== undefined) payload.partnerName = config.partnerName;
    if (config.anniversaryDate !== undefined) payload.anniversaryDate = config.anniversaryDate;
    if (config.title !== undefined) payload.title = config.title;
    if (config.subtitle !== undefined) payload.subtitle = config.subtitle;
    if (config.dedicationLetter !== undefined) payload.dedicationLetter = config.dedicationLetter;
    if (config.selectedSongId !== undefined) payload.selectedSongId = config.selectedSongId;
    if (config.customAudioUrl !== undefined) payload.customAudioUrl = config.customAudioUrl;
    if (config.cinemaVideoUrl !== undefined) payload.cinemaVideoUrl = config.cinemaVideoUrl;

    await setDoc(configDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves or updates a specific wall-mounted picture frame in Firestore and local cache.
 */
export async function persistFrame(frame: PictureFrameItem): Promise<void> {
  const path = `frames/${frame.id}`;

  // Update local cache immediately
  try {
    localStorage.setItem(`our_museum_frame_${frame.id}`, JSON.stringify(frame));
  } catch {}

  try {
    const frameDocRef = doc(db, 'frames', frame.id);
    const payload = {
      id: frame.id,
      roomId: frame.roomId,
      title: frame.title,
      date: frame.date || '',
      story: frame.story || '',
      imageUrl: frame.imageUrl || '',
      width: frame.width,
      height: frame.height,
      position: frame.position,
      rotation: frame.rotation,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(frameDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seeds initial museum frames and config into Firestore if the collections are empty.
 */
export async function seedInitialMuseumDataIfEmpty(
  initialConfig: MuseumConfig,
  initialFrames: PictureFrameItem[]
): Promise<void> {
  try {
    const framesColRef = collection(db, FRAMES_COLLECTION_PATH);
    const existingFrames = await getDocs(framesColRef);

    if (existingFrames.empty) {
      const batch = writeBatch(db);

      // Seed default museum config
      const configDocRef = doc(db, 'museum_config', CONFIG_DOC_ID);
      batch.set(configDocRef, {
        coupleNames: initialConfig.coupleNames,
        partner1: initialConfig.partner1,
        partner2: initialConfig.partner2,
        anniversaryDate: initialConfig.anniversaryDate,
        title: initialConfig.title,
        subtitle: initialConfig.subtitle,
        dedicationLetter: initialConfig.dedicationLetter,
        selectedSongId: initialConfig.selectedSongId,
        customAudioUrl: initialConfig.customAudioUrl || '',
        cinemaVideoUrl: initialConfig.cinemaVideoUrl || '',
        updatedAt: new Date().toISOString(),
      });

      // Seed initial frames
      for (const frame of initialFrames) {
        const frameDocRef = doc(db, 'frames', frame.id);
        batch.set(frameDocRef, {
          id: frame.id,
          roomId: frame.roomId,
          title: frame.title,
          date: frame.date || '',
          story: frame.story || '',
          imageUrl: frame.imageUrl || '',
          width: frame.width,
          height: frame.height,
          position: frame.position,
          rotation: frame.rotation,
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}
