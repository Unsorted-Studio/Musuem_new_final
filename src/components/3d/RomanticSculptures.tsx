import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Creates an engraved museum brass plaque texture
 */
function createBrassPlaqueTexture(title: string, subtitle?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Brushed champagne gold / brass metallic gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, '#cda747');
  grad.addColorStop(0.25, '#ebd790');
  grad.addColorStop(0.5, '#ba9435');
  grad.addColorStop(0.75, '#ebd790');
  grad.addColorStop(1, '#9b7625');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Outer border & inner hairline border
  ctx.strokeStyle = '#5a4313';
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, 488, 232);

  ctx.strokeStyle = '#fff1b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(17, 17, 478, 222);

  // Corner rivets/screws
  const rivets = [
    [26, 26],
    [486, 26],
    [26, 230],
    [486, 230],
  ];
  ctx.fillStyle = '#42310a';
  rivets.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#221905';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Typography
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e1606';
  ctx.font = 'bold 34px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.fillText(title.toUpperCase(), 256, 110);

  if (subtitle) {
    ctx.fillStyle = '#3c2e11';
    ctx.font = 'italic 20px "Cinzel", "Playfair Display", "Georgia", serif';
    ctx.fillText(subtitle, 256, 160);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

interface MuseumGlassVitrineProps {
  position?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * MuseumGlassVitrine: Crystal-clear museum display case (vitrine)
 * Features optical-grade physical glass, refined brass/champagne edge framing,
 * obsidian velvet display plinth pad, internal accent lighting, and an engraved brass provenance plaque.
 */
export const MuseumGlassVitrine: React.FC<MuseumGlassVitrineProps> = ({
  position = [0, 0, 0],
  width = 0.58,
  height = 0.65,
  depth = 0.58,
  title,
  subtitle,
  children,
}) => {
  const plaqueTexture = useMemo(
    () => createBrassPlaqueTexture(title, subtitle),
    [title, subtitle]
  );

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  const frameThickness = 0.012;

  return (
    <group position={position}>
      {/* 1. Base Velvet Display Pad & Gold Rim (Sits flush on pedestal top) */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[width - 0.04, 0.016, depth - 0.04]} />
        <meshStandardMaterial color="#151518" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.004, 0]}>
        <boxGeometry args={[width + 0.02, 0.008, depth + 0.02]} />
        <meshStandardMaterial color="#c5a059" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* 2. Optical Glass Enclosure (5-Sided Vitrine Box) */}
      <mesh position={[0, halfH, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.92}
          opacity={0.98}
          transparent
          roughness={0.03}
          ior={1.52}
          reflectivity={0.9}
          thickness={0.25}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Subtle Glass Specular Edge Wireframe */}
      <lineSegments position={[0, halfH, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#dbeafe" transparent opacity={0.35} />
      </lineSegments>

      {/* 4. Elegant Champagne Brass Frame (4 Vertical Corner Columns) */}
      {[
        [-halfW, -halfD],
        [halfW, -halfD],
        [-halfW, halfD],
        [halfW, halfD],
      ].map(([fx, fz], idx) => (
        <mesh key={`col-${idx}`} position={[fx, halfH, fz]}>
          <boxGeometry args={[frameThickness, height, frameThickness]} />
          <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.2} />
        </mesh>
      ))}

      {/* 5. Top Perimeter Frame (4 Horizontal Beams) */}
      <mesh position={[0, height, -halfD]}>
        <boxGeometry args={[width, frameThickness, frameThickness]} />
        <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0, height, halfD]}>
        <boxGeometry args={[width, frameThickness, frameThickness]} />
        <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[-halfW, height, 0]}>
        <boxGeometry args={[frameThickness, frameThickness, depth]} />
        <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[halfW, height, 0]}>
        <boxGeometry args={[frameThickness, frameThickness, depth]} />
        <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.2} />
      </mesh>

      {/* 6. Corner Accents / Brackets */}
      {[
        [-halfW, 0, -halfD],
        [halfW, 0, -halfD],
        [-halfW, 0, halfD],
        [halfW, 0, halfD],
        [-halfW, height, -halfD],
        [halfW, height, -halfD],
        [-halfW, height, halfD],
        [halfW, height, halfD],
      ].map(([cx, cy, cz], idx) => (
        <mesh key={`bracket-${idx}`} position={[cx, cy, cz]}>
          <boxGeometry args={[frameThickness * 1.5, frameThickness * 1.5, frameThickness * 1.5]} />
          <meshStandardMaterial color="#dfbf6c" metalness={0.92} roughness={0.16} />
        </mesh>
      ))}

      {/* 7. Internal Museum Vitrine Micro-Spotlight (Illuminates the artwork directly) */}
      <pointLight
        position={[0, height - 0.05, 0]}
        color="#fff5e6"
        intensity={1.6}
        distance={1.4}
        decay={2}
      />

      {/* 8. Engraved Brass Provenance Plaque on Front of Pedestal */}
      <group position={[0, -0.32, halfD + 0.07]}>
        {/* Brass Bevel Plate */}
        <mesh>
          <boxGeometry args={[0.36, 0.18, 0.012]} />
          <meshStandardMaterial color="#a17d2e" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Plaque Canvas Face */}
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.35, 0.17]} />
          <meshBasicMaterial map={plaqueTexture} toneMapped={false} />
        </mesh>
      </group>

      {/* 9. Enclosed 3D Artwork */}
      {children}
    </group>
  );
};

/**
 * High-Detail 3D Blooming Rose in a Minimalist Glass Vase
 */
export const BloomingRoseVase: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      {/* 1. Fluted Cylindrical Glass Vase */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.16, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.96}
          opacity={0.2}
          transparent
          roughness={0.05}
          ior={1.5}
        />
      </mesh>
      {/* Water inside vase */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.065, 0.056, 0.11, 16]} />
        <meshStandardMaterial color="#bfe5e8" transparent opacity={0.4} roughness={0.1} />
      </mesh>

      {/* 2. Curved Rose Stem */}
      <mesh position={[0, 0.18, 0]} rotation={[0.05, 0, -0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
        <meshStandardMaterial color="#2d5e35" roughness={0.6} />
      </mesh>

      {/* 3. Rose Leaves */}
      <mesh position={[-0.04, 0.19, 0.02]} rotation={[0.4, 0.2, -0.8]}>
        <coneGeometry args={[0.035, 0.08, 3]} />
        <meshStandardMaterial color="#224d29" roughness={0.5} />
      </mesh>
      <mesh position={[0.04, 0.22, -0.01]} rotation={[-0.3, -0.2, 0.8]}>
        <coneGeometry args={[0.035, 0.08, 3]} />
        <meshStandardMaterial color="#224d29" roughness={0.5} />
      </mesh>

      {/* 4. Layered Blooming Rose Flower Head (Rich Deep Crimson) */}
      <group position={[0, 0.3, 0]}>
        {/* Calyx & green sepals */}
        <mesh position={[0, -0.025, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.032, 0.04, 5]} />
          <meshStandardMaterial color="#224d29" roughness={0.6} />
        </mesh>

        {/* Outer Flared Petals */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh
              key={`outer-petal-${i}`}
              position={[Math.sin(angle) * 0.035, 0.01, Math.cos(angle) * 0.035]}
              rotation={[0.35, angle, 0]}
            >
              <sphereGeometry args={[0.036, 12, 12, 0, Math.PI]} />
              <meshStandardMaterial
                color="#be123c"
                roughness={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Inner Curved Petals */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI * 2) / 4 + 0.4;
          return (
            <mesh
              key={`inner-petal-${i}`}
              position={[Math.sin(angle) * 0.022, 0.025, Math.cos(angle) * 0.022]}
              rotation={[0.2, angle, 0]}
            >
              <sphereGeometry args={[0.028, 10, 10, 0, Math.PI]} />
              <meshStandardMaterial
                color="#e11d48"
                roughness={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Center Tight Rosebud Heart */}
        <mesh position={[0, 0.032, 0]}>
          <coneGeometry args={[0.02, 0.04, 12]} />
          <meshStandardMaterial color="#9f1239" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Elegant Polished Bronze / Gold "Entwined Lovers" Romantic Statue
 * Stylized modernist sculpture of two lovers embracing, evoking eternal love
 */
export const EntwinedLoversStatue: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0, 0],
}) => {
  return (
    <group position={position}>
      {/* Dark Granite Sculpture Plinth */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#1a1a1d" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Flowing Intertwined Figures in Polished Champagne Bronze */}
      {/* Figure 1 - Graceful Arched Spine */}
      <mesh position={[-0.03, 0.16, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.02, 0.035, 0.26, 16]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>
      {/* Head 1 */}
      <mesh position={[-0.06, 0.31, 0.01]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>

      {/* Figure 2 - Embracing Counter-Curve */}
      <mesh position={[0.03, 0.18, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.022, 0.038, 0.28, 16]} />
        <meshStandardMaterial
          color="#c5a059"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>
      {/* Head 2 (Gently tilted toward Head 1) */}
      <mesh position={[0.05, 0.34, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#c5a059"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>

      {/* Entwined Embracing Ribbon forming a subtle infinity / heart loop */}
      <mesh position={[0, 0.22, 0.03]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.055, 0.014, 12, 24, Math.PI * 1.6]} />
        <meshStandardMaterial
          color="#e6ca65"
          metalness={0.9}
          roughness={0.18}
        />
      </mesh>
    </group>
  );
};
