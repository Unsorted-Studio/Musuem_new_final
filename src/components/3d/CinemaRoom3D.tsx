import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CinemaCanvasScreen } from './proceduralTextures';
import { UserRole } from '../../types/museum';

interface CinemaRoom3DProps {
  position?: [number, number, number];
  onSitDown?: () => void;
  slideImages?: string[];
  isCinemaPlaying?: boolean;
  videoUrl?: string;
  onOpenVideoSettings?: () => void;
  userRole?: UserRole;
}

export const CinemaRoom3D: React.FC<CinemaRoom3DProps> = ({
  position = [0, 0, 0],
  onSitDown,
  slideImages = [],
  isCinemaPlaying = true,
  videoUrl,
  onOpenVideoSettings,
  userRole = 'admin',
}) => {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [isScreenHovered, setIsScreenHovered] = useState(false);

  // Cinema screen canvas texture manager (used as fallback or for photo reels)
  const cinemaScreen = useMemo(() => {
    return new CinemaCanvasScreen(slideImages);
  }, [slideImages]);

  // Synchronize play state for fallback canvas
  useEffect(() => {
    if (cinemaScreen.getIsPlaying() !== isCinemaPlaying) {
      cinemaScreen.togglePlay();
    }
  }, [isCinemaPlaying, cinemaScreen]);

  // Active video URL from config or curator settings
  const activeVideoUrl = videoUrl && videoUrl.trim() !== '' ? videoUrl.trim() : '';

  // Setup HTML5 Video Texture only when a valid custom videoUrl is provided
  useEffect(() => {
    if (!activeVideoUrl) {
      if (videoElementRef.current) {
        try {
          videoElementRef.current.pause();
          videoElementRef.current.src = '';
        } catch {}
        videoElementRef.current = null;
      }
      setVideoTexture(null);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true; // Muted to guarantee auto-play across modern browsers
    video.playsInline = true;
    video.autoplay = true;

    let vTex: THREE.VideoTexture | null = null;

    const onReady = () => {
      if (video.videoWidth > 0 && video.readyState >= 2 && !vTex) {
        try {
          vTex = new THREE.VideoTexture(video);
          vTex.minFilter = THREE.LinearFilter;
          vTex.magFilter = THREE.LinearFilter;
          vTex.format = THREE.RGBAFormat;
          vTex.colorSpace = THREE.SRGBColorSpace;
          vTex.generateMipmaps = false;
          setVideoTexture(vTex);
        } catch (err) {
          console.warn('Could not create VideoTexture:', err);
          setVideoTexture(null);
        }
      }
    };

    video.onerror = () => {
      console.warn('Cinema video failed to load, falling back to romantic celestial cinema screen');
      if (vTex) {
        vTex.dispose();
        vTex = null;
      }
      setVideoTexture(null);
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);
    video.addEventListener('playing', onReady);

    // Set src and trigger play
    video.src = activeVideoUrl;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Cinema video autoplay pending user gesture:', err);
      });
    }

    // Listen to user interaction anywhere on the window to unlock playback if browser blocked it
    const handleGesture = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });

    videoElementRef.current = video;

    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('playing', onReady);
      try {
        video.pause();
        video.src = '';
      } catch {}
      if (vTex) {
        vTex.dispose();
      }
      videoElementRef.current = null;
      setVideoTexture(null);
    };
  }, [activeVideoUrl]);

  // Synchronize video play / pause with isCinemaPlaying
  useEffect(() => {
    if (videoElementRef.current) {
      if (isCinemaPlaying && videoElementRef.current.paused) {
        videoElementRef.current.play().catch(() => {});
      } else if (!isCinemaPlaying && !videoElementRef.current.paused) {
        videoElementRef.current.pause();
      }
    }
  }, [isCinemaPlaying]);

  // Update animated canvas or video texture in frame loop safely
  useFrame((_, delta) => {
    try {
      if (
        videoTexture &&
        videoElementRef.current &&
        videoElementRef.current.readyState >= 2 &&
        !videoElementRef.current.error
      ) {
        videoTexture.needsUpdate = true;
      } else {
        cinemaScreen.update(delta);
      }
    } catch {
      setVideoTexture(null);
      cinemaScreen.update(delta);
    }
  });

  useEffect(() => {
    return () => {
      cinemaScreen.dispose();
    };
  }, [cinemaScreen]);

  return (
    <group position={position}>
      {/* 1. Large Wall-Mounted Widescreen Video Display (Exact GiftVera TV Screen) */}
      <group position={[0, 3.2, -37.4]}>
        {/* Sleek Minimalist Black Metal Frame */}
        <mesh position={[0, 0, -0.04]} castShadow>
          <boxGeometry args={[8.8, 5.0, 0.08]} />
          <meshStandardMaterial
            color={isScreenHovered && userRole === 'admin' ? '#222228' : '#0d0d0f'}
            roughness={0.7}
          />
        </mesh>

        {/* Active High-Definition Video Screen Plane */}
        <mesh
          position={[0, 0, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            if (userRole === 'admin' && onOpenVideoSettings) {
              onOpenVideoSettings();
            } else {
              onSitDown?.();
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setIsScreenHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setIsScreenHovered(false);
          }}
        >
          <planeGeometry args={[8.6, 4.8]} />
          <meshBasicMaterial
            map={videoTexture || cinemaScreen.texture}
            toneMapped={false}
          />
        </mesh>

        {/* Soft Ambient Light Glow casting onto the floor & bench */}
        <pointLight
          position={[0, 0, 1.8]}
          color="#f1f5f9"
          intensity={1.8}
          distance={12}
          decay={1.8}
        />
      </group>

      {/* 2. Minimalist Contemporary Gallery Bench (Exact GiftVera Wood & Steel Bench) */}
      {/* Positioned facing the screen at Z = -32.8 */}
      <group
        position={[0, 0, -32.8]}
        onClick={(e) => {
          e.stopPropagation();
          onSitDown?.();
        }}
      >
        {/* Wooden Bench Top Slab (Light Natural Wood / Ash) */}
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.08, 0.85]} />
          <meshStandardMaterial color="#cfc7b8" roughness={0.4} />
        </mesh>

        {/* Minimal Black Metal Slab Leg Supports */}
        <mesh position={[-1.1, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.44, 0.7]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
        </mesh>
        <mesh position={[1.1, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.44, 0.7]} />
          <meshStandardMaterial color="#1a1a1c" roughness={0.6} />
        </mesh>
      </group>

      {/* 3. Ceiling Track Lights Illuminating the Video Screen Area */}
      <group position={[0, 5.8, -34.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[8.0, 0.06, 0.06]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        {[-2.5, 0, 2.5].map((tx, idx) => (
          <group key={`track-${idx}`} position={[tx, -0.12, 0]}>
            <mesh rotation={[Math.PI / 4, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.18, 12]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            <spotLight
              position={[0, 0, 0]}
              target-position={[0, -2.5, -2.9]}
              color="#fff5e6"
              intensity={1.2}
              angle={Math.PI / 4}
              penumbra={0.4}
              distance={8}
            />
          </group>
        ))}
      </group>
    </group>
  );
};
