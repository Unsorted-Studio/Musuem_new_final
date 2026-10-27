import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MuseumConfig } from '../../types/museum';
import { getLuxuryMarbleTexture } from './avatarTextures';
import {
  BloomingRoseVase,
  EntwinedLoversStatue,
  MuseumGlassVitrine,
} from './RomanticSculptures';

interface MuseumArchitectureProps {
  config: MuseumConfig;
  onSelectDedication: () => void;
}

export const MuseumArchitecture: React.FC<MuseumArchitectureProps> = ({
  config,
  onSelectDedication,
}) => {
  // Luxury Italian Marble floor texture with subtle brass grid
  const marbleTexture = useMemo(() => getLuxuryMarbleTexture(), []);

  // Monumental Black Dedication Plaque on the front lectern (matching GiftVera reference)
  const plaqueTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ultra-deep luxury matte OLED black display
    ctx.fillStyle = '#0d0d10';
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle dark gradient for OLED depth
    const radial = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 1000);
    radial.addColorStop(0, '#16161a');
    radial.addColorStop(1, '#08080a');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 2048, 1024);

    // Delicate micro-bezel border
    ctx.strokeStyle = '#282522';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 2000, 976);

    const recipient = config.partner2 || config.partnerName || 'Emily';
    const author = config.partner1 || config.playerName || 'James';
    
    // Clean letter text (strip trailing signoff if present in string)
    let rawLetter = config.dedicationLetter?.trim() || 'A private 3D sanctuary created for our timeless love story.';
    if (rawLetter.toLowerCase().includes('love,')) {
      rawLetter = rawLetter.substring(0, rawLetter.toLowerCase().lastIndexOf('love,')).trim();
    }

    ctx.textAlign = 'center';

    // 1. Top Section Tagline
    ctx.fillStyle = '#b59e75';
    ctx.font = '600 36px sans-serif';
    ctx.fillText('A   P E R M A N E N T   C O L L E C T I O N', 1024, 210);

    // 2. Main Dedication Title (For Emily)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 500 112px serif';
    ctx.fillText(`For ${recipient}`, 1024, 380);

    // 3. Body Message (With word wrap)
    ctx.fillStyle = 'rgba(235, 232, 225, 0.9)';
    ctx.font = '400 48px sans-serif';

    const words = rawLetter.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    const maxLineWidth = 1680;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= 3) break;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine && lines.length < 3) {
      lines.push(currentLine);
    }

    const startY = 530;
    const lineHeight = 72;
    lines.forEach((line, idx) => {
      ctx.fillText(line, 1024, startY + idx * lineHeight);
    });

    // 4. Sign-off (Love, James)
    ctx.fillStyle = '#b59e75';
    ctx.font = 'italic 400 58px serif';
    const signoffY = Math.max(startY + lines.length * lineHeight + 80, 840);
    ctx.fillText(`Love, ${author}`, 1024, signoffY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [
    config.partner1,
    config.partner2,
    config.playerName,
    config.partnerName,
    config.dedicationLetter,
  ]);

  return (
    <group>
      {/* ============================================================== */}
      {/* 1. LUXURY POLISHED MARBLE FLOOR & BRASS BORDER ACCENTS         */}
      {/* Dim, gentle specular gleam without blinding wash               */}
      {/* ============================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]} receiveShadow>
        <planeGeometry args={[24, 48]} />
        <meshStandardMaterial
          map={marbleTexture}
          roughness={0.35}
          metalness={0.08}
          color="#cfc9be"
        />
      </mesh>

      {/* Warm Brass Floor Inlay Trims */}
      {[-6.8, 6.8].map((fx, idx) => (
        <mesh key={`floor-trim-${idx}`} position={[fx, 0.005, -18]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 48]} />
          <meshStandardMaterial color="#9d7e3e" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ============================================================== */}
      {/* 2. INDUSTRIAL ELEGANT MATTE BLACK CEILING & GRID TRACKS        */}
      {/* ============================================================== */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.2, -18]}>
        <planeGeometry args={[24, 48]} />
        <meshStandardMaterial color="#111114" roughness={0.95} />
      </mesh>

      {/* Structural Ceiling Beams */}
      {[-7, -3.5, 0, 3.5, 7].map((gx, idx) => (
        <mesh key={`beam-x-${idx}`} position={[gx, 6.08, -18]}>
          <boxGeometry args={[0.08, 0.22, 48]} />
          <meshStandardMaterial color="#08080a" roughness={0.8} />
        </mesh>
      ))}

      {/* ============================================================== */}
      {/* 3. WARM LUXURY GALLERY WALLS (Dim moody tone under ambient)    */}
      {/* ============================================================== */}
      {/* South Wall (Entrance) */}
      <mesh position={[0, 3.1, 6]} receiveShadow>
        <boxGeometry args={[16, 6.2, 0.3]} />
        <meshStandardMaterial color="#c5bfb4" roughness={0.85} />
      </mesh>

      {/* West Gallery Wall */}
      <mesh position={[-7.5, 3.1, -18]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[48, 6.2, 0.3]} />
        <meshStandardMaterial color="#c5bfb4" roughness={0.85} />
      </mesh>

      {/* East Gallery Wall */}
      <mesh position={[7.5, 3.1, -18]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[48, 6.2, 0.3]} />
        <meshStandardMaterial color="#c5bfb4" roughness={0.85} />
      </mesh>

      {/* North Cinema Wall (Behind screen) */}
      <mesh position={[0, 3.1, -38.2]} receiveShadow>
        <boxGeometry args={[16, 6.2, 0.4]} />
        <meshStandardMaterial color="#bfb9ae" roughness={0.85} />
      </mesh>

      {/* Charcoal & Brass Baseboards */}
      {[-7.35, 7.35].map((bx, idx) => (
        <group key={`baseboard-${idx}`} position={[bx, 0.12, -18]} rotation={[0, idx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[48, 0.24, 0.04]} />
            <meshStandardMaterial color="#141416" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0.01]}>
            <boxGeometry args={[48, 0.02, 0.02]} />
            <meshStandardMaterial color="#9d7e3e" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 4. MONUMENTAL CENTERPIECE WALL & DEDICATION PLINTH             */}
      {/* ============================================================== */}
      <group position={[0, 0, -8]}>
        {/* Stepped White Gallery Plinth */}
        <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[7.4, 0.3, 2.8]} />
          <meshStandardMaterial color="#eae7e1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[7.46, 0.04, 2.86]} />
          <meshStandardMaterial color="#9d7e3e" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Freestanding Obsidian Black Monolith Partition */}
        <mesh position={[0, 2.8, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[6.2, 5.0, 0.26]} />
          <meshStandardMaterial color="#121215" roughness={0.5} />
        </mesh>

        {/* Featured Centerpiece Couple Portrait */}
        <group position={[0, 3.2, -0.05]}>
          {/* Crisp White Archival Matting */}
          <mesh castShadow>
            <boxGeometry args={[2.3, 3.0, 0.06]} />
            <meshStandardMaterial color="#f5f3ee" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[2.0, 2.7]} />
            <meshBasicMaterial
              map={new THREE.TextureLoader().load('/src/assets/images/art_sunset_lovers_1792907502463.jpg')}
            />
          </mesh>

          {/* Focused Warm Gold Spotlight on Centerpiece Portrait */}
          <spotLight
            position={[0, 2.8, 2.4]}
            target-position={[0, 0, 0]}
            color="#fff3e0"
            intensity={2.8}
            angle={Math.PI / 4.2}
            penumbra={0.45}
            distance={8.5}
            castShadow
          />
        </group>

        {/* White Console Pedestal with Angled Interactive Plaque (Matching GiftVera Reference) */}
        <group
          position={[0, 0.3, 1.4]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectDedication();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'auto';
          }}
        >
          {/* White Lectern Pillar */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.9, 0.58]} />
            <meshStandardMaterial color="#ece9e2" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[1.68, 0.03, 0.61]} />
            <meshStandardMaterial color="#0d0d0f" roughness={0.6} />
          </mesh>

          {/* Angled Digital Screen Tablet (Grouped so screen plane is strictly in front of bezel) */}
          <group position={[0, 0.98, 0.05]} rotation={[-Math.PI / 4.6, 0, 0]}>
            {/* Tablet Chassis & Bezel */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.5, 0.72, 0.04]} />
              <meshStandardMaterial color="#0a0a0c" roughness={0.5} metalness={0.2} />
            </mesh>

            {/* Brass Edge Trim on tablet casing */}
            <mesh position={[0, 0, -0.005]}>
              <boxGeometry args={[1.52, 0.74, 0.035]} />
              <meshStandardMaterial color="#2d2924" roughness={0.6} />
            </mesh>

            {/* High-Resolution Illuminated Letter Display Screen */}
            <mesh position={[0, 0, 0.022]}>
              <planeGeometry args={[1.44, 0.66]} />
              <meshBasicMaterial
                map={plaqueTexture}
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Focused Warm Gallery Spotlight over the dedication lectern */}
          <spotLight
            position={[0, 2.8, 1.2]}
            target-position={[0, 0.9, 0]}
            color="#fff8ed"
            intensity={2.4}
            angle={Math.PI / 4.5}
            distance={5.5}
            penumbra={0.4}
          />
        </group>
      </group>

      {/* ============================================================== */}
      {/* 5. LUXURY GLASS VITRINES WITH ROMANTIC SCULPTURES              */}
      {/* West: Detailed Blooming Rose in Vase                           */}
      {/* East: "Entwined Lovers" Polished Bronze Love Statue            */}
      {/* ============================================================== */}
      {/* West Vitrine: Blooming Rose Vase */}
      <group position={[-5.2, 0, -18]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 1.2, 0.7]} />
          <meshStandardMaterial color="#eae7e1" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.72, 0.04, 0.72]} />
          <meshStandardMaterial color="#9d7e3e" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Crystal Glass Vitrine Display Case enclosing the Rose */}
        <MuseumGlassVitrine
          position={[0, 1.2, 0]}
          width={0.62}
          height={0.65}
          depth={0.62}
          title="The Immortal Rose"
          subtitle="Preserved botanical bloom, eternal love"
        >
          <BloomingRoseVase position={[0, 0.015, 0]} />
        </MuseumGlassVitrine>

        {/* Focused Warm Vitrine Spotlight */}
        <spotLight
          position={[0, 5.2, 0]}
          target-position={[0, 1.4, 0]}
          color="#ffe8cc"
          intensity={2.4}
          angle={Math.PI / 4.8}
          penumbra={0.4}
          distance={8.0}
        />
      </group>

      {/* East Vitrine: Entwined Lovers Statue */}
      <group position={[5.2, 0, -18]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 1.2, 0.7]} />
          <meshStandardMaterial color="#eae7e1" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.72, 0.04, 0.72]} />
          <meshStandardMaterial color="#9d7e3e" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Crystal Glass Vitrine Display Case enclosing the Lovers Statue */}
        <MuseumGlassVitrine
          position={[0, 1.2, 0]}
          width={0.62}
          height={0.65}
          depth={0.62}
          title="Entwined Souls"
          subtitle="Polished champagne bronze, circa forever"
        >
          <EntwinedLoversStatue position={[0, 0.015, 0]} />
        </MuseumGlassVitrine>

        {/* Focused Warm Vitrine Spotlight */}
        <spotLight
          position={[0, 5.2, 0]}
          target-position={[0, 1.4, 0]}
          color="#ffe8cc"
          intensity={2.4}
          angle={Math.PI / 4.8}
          penumbra={0.4}
          distance={8.0}
        />
      </group>

      {/* ============================================================== */}
      {/* 6. DIM, MOODY LUXURY LIGHTING (Not Blinding!)                  */}
      {/* Soft warm ambient with dramatic focused spotlights             */}
      {/* ============================================================== */}
      {/* Gentle, dim warm ambient light so the hall is intimate and moody */}
      <ambientLight color="#f5efe6" intensity={0.24} />

      <hemisphereLight
        color="#e8e2d5"
        groundColor="#252422"
        intensity={0.28}
      />

      {/* Very soft directional fill to cast gentle floor shadows */}
      <directionalLight
        position={[4, 12, 3]}
        target-position={[0, 2, -16]}
        color="#fff1db"
        intensity={0.42}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  );
};
