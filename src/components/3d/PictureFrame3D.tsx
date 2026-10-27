import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { PictureFrameItem, UserRole } from '../../types/museum';

interface PictureFrame3DProps {
  frame: PictureFrameItem;
  onSelect: (frame: PictureFrameItem) => void;
  isHovered?: boolean;
  userRole?: UserRole;
}

export const PictureFrame3D: React.FC<PictureFrame3DProps> = ({
  frame,
  onSelect,
  isHovered = false,
  userRole = 'admin',
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const activeHover = isHovered || internalHover;

  // Load artwork texture or generate clean empty placeholder
  const artworkTexture = useMemo(() => {
    if (frame.imageUrl) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(frame.imageUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // Modern clean placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1c1c1f';
    ctx.fillRect(0, 0, 512, 384);

    ctx.strokeStyle = '#44444a';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2.5;
    ctx.strokeRect(20, 20, 472, 344);

    if (userRole === 'admin') {
      // Admin: Plus icon to mount photo
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(256, 145);
      ctx.lineTo(256, 195);
      ctx.moveTo(231, 170);
      ctx.lineTo(281, 170);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 22px sans-serif';
      ctx.fillText('MOUNT YOUR PHOTO', 256, 235);

      ctx.fillStyle = '#a8a29e';
      ctx.font = '400 16px sans-serif';
      ctx.fillText('Admin Curation · Tap to upload', 256, 268);
    } else {
      // Partner view: waiting for admin photo
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4af37';
      ctx.font = 'italic 500 26px serif';
      ctx.fillText('Memory in Curating', 256, 180);

      ctx.fillStyle = '#a8a29e';
      ctx.font = '400 16px sans-serif';
      ctx.fillText('Curated by your partner', 256, 225);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [frame.imageUrl, userRole]);

  const fw = frame.width;
  const fh = frame.height;
  const borderDepth = 0.05;
  const frameBorderWidth = 0.08;

  return (
    <group
      position={frame.position}
      rotation={frame.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(frame);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setInternalHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setInternalHover(false);
      }}
    >
      {/* 1. Sleek Modern Black Picture Frame (Exact GiftVera Style) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[fw + frameBorderWidth * 2, fh + frameBorderWidth * 2, borderDepth]} />
        <meshStandardMaterial
          color={activeHover ? '#303036' : '#111113'}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* 2. Crisp White Matting Border */}
      <mesh position={[0, 0, borderDepth / 2 + 0.003]}>
        <planeGeometry args={[fw, fh]} />
        <meshStandardMaterial color="#fdfdfc" roughness={0.9} />
      </mesh>

      {/* 3. High-Res Artwork Photo Canvas - strictly proportional to photo ratio */}
      <mesh position={[0, 0, borderDepth / 2 + 0.008]}>
        <planeGeometry args={[fw * 0.88, fh * 0.88]} />
        <meshBasicMaterial map={artworkTexture} />
      </mesh>

      {/* 4. Ceiling Track Spot Light casting warm cone on the photograph */}
      <group position={[0, fh / 2 + 1.2, 1.4]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <spotLight
          color="#fff6e8"
          intensity={2.4}
          distance={6.5}
          angle={Math.PI / 4.2}
          penumbra={0.5}
          position={[0, 0, 0]}
          target-position={[0, -1.2, -1.4]}
        />
      </group>
    </group>
  );
};
