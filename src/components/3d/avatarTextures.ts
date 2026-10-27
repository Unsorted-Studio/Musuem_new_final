import * as THREE from 'three';

// Cache generated textures so we don't recreate them every frame
let kaiFaceTexture: THREE.CanvasTexture | null = null;
let miraFaceTexture: THREE.CanvasTexture | null = null;
let kaiVestTexture: THREE.CanvasTexture | null = null;
let miraKnitTexture: THREE.CanvasTexture | null = null;
let luxuryMarbleTexture: THREE.CanvasTexture | null = null;

/**
 * High-Resolution Stylized Anime Face Texture for Kai (Male)
 * Matching the exact look in GiftVera screenshot:
 * Dark expressive anime eyes, lashes, clean brows, nose bridge, gentle confident smile
 */
export function getKaiFaceTexture(): THREE.CanvasTexture {
  if (kaiFaceTexture) return kaiFaceTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm skin tone background
  ctx.fillStyle = '#f5d9c8';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft ambient shading / blush on cheeks
  const leftCheekGrad = ctx.createRadialGradient(380, 560, 10, 380, 560, 120);
  leftCheekGrad.addColorStop(0, 'rgba(235, 140, 130, 0.28)');
  leftCheekGrad.addColorStop(1, 'rgba(235, 140, 130, 0)');
  ctx.fillStyle = leftCheekGrad;
  ctx.beginPath();
  ctx.arc(380, 560, 120, 0, Math.PI * 2);
  ctx.fill();

  const rightCheekGrad = ctx.createRadialGradient(644, 560, 10, 644, 560, 120);
  rightCheekGrad.addColorStop(0, 'rgba(235, 140, 130, 0.28)');
  rightCheekGrad.addColorStop(1, 'rgba(235, 140, 130, 0)');
  ctx.fillStyle = rightCheekGrad;
  ctx.beginPath();
  ctx.arc(644, 560, 120, 0, Math.PI * 2);
  ctx.fill();

  // Draw Eyes (Left: center ~ 390, Right: center ~ 634, Y ~ 470)
  const drawEye = (cx: number, cy: number, isRight: boolean) => {
    // Sclera (Eye White)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 65, 48, (isRight ? 0.08 : -0.08), 0, Math.PI * 2);
    ctx.fillStyle = '#fdfdfd';
    ctx.fill();
    ctx.clip();

    // Iris (Rich deep brown / amber anime iris)
    const irisGrad = ctx.createRadialGradient(cx, cy - 8, 5, cx, cy, 46);
    irisGrad.addColorStop(0, '#5a3d28');
    irisGrad.addColorStop(0.6, '#362114');
    irisGrad.addColorStop(1, '#1a0f08');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();

    // Dark Pupil
    ctx.fillStyle = '#0a0604';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight / Catchlight (Top-Left Anime Sparkle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smaller highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(cx + 12, cy + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Dark Upper Eyelash line
    ctx.strokeStyle = '#22140e';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 68, 42, (isRight ? 0.05 : -0.05), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Subtle lower lash line
    ctx.strokeStyle = '#6e4c3a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 55, 36, (isRight ? 0.05 : -0.05), Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // Double Eyelid Crease
    ctx.strokeStyle = '#aa7762';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 54, 52, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Eyebrow (Sharp, stylized dark brown anime brow)
    ctx.strokeStyle = '#321d13';
    ctx.lineWidth = 9;
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(cx - 65, cy - 88);
      ctx.quadraticCurveTo(cx - 10, cy - 105, cx + 70, cy - 84);
    } else {
      ctx.moveTo(cx - 70, cy - 84);
      ctx.quadraticCurveTo(cx + 10, cy - 105, cx + 65, cy - 88);
    }
    ctx.stroke();
  };

  drawEye(385, 470, false);
  drawEye(639, 470, true);

  // Nose tip & shadow
  ctx.strokeStyle = '#a87560';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(512, 530);
  ctx.lineTo(512, 570);
  ctx.lineTo(526, 576);
  ctx.stroke();

  // Gentle confident mouth
  ctx.strokeStyle = '#854238';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(465, 660);
  ctx.quadraticCurveTo(512, 672, 559, 660);
  ctx.stroke();

  // Subtle lower lip shadow
  ctx.strokeStyle = '#c48b7c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(512, 690, 24, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  kaiFaceTexture = new THREE.CanvasTexture(canvas);
  kaiFaceTexture.colorSpace = THREE.SRGBColorSpace;
  return kaiFaceTexture;
}

/**
 * High-Resolution Stylized Anime Face Texture for Mira (Female)
 * Matching the exact look in GiftVera screenshot:
 * Almond anime eyes, winged upper lashes, warm hazel irises, soft blush, pink lips
 */
export function getMiraFaceTexture(): THREE.CanvasTexture {
  if (miraFaceTexture) return miraFaceTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f7ded0';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft rose blush on cheeks
  const leftCheekGrad = ctx.createRadialGradient(375, 560, 10, 375, 560, 130);
  leftCheekGrad.addColorStop(0, 'rgba(244, 114, 120, 0.35)');
  leftCheekGrad.addColorStop(1, 'rgba(244, 114, 120, 0)');
  ctx.fillStyle = leftCheekGrad;
  ctx.beginPath();
  ctx.arc(375, 560, 130, 0, Math.PI * 2);
  ctx.fill();

  const rightCheekGrad = ctx.createRadialGradient(649, 560, 10, 649, 560, 130);
  rightCheekGrad.addColorStop(0, 'rgba(244, 114, 120, 0.35)');
  rightCheekGrad.addColorStop(1, 'rgba(244, 114, 120, 0)');
  ctx.fillStyle = rightCheekGrad;
  ctx.beginPath();
  ctx.arc(649, 560, 130, 0, Math.PI * 2);
  ctx.fill();

  // Draw Eyes
  const drawEye = (cx: number, cy: number, isRight: boolean) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 66, 48, (isRight ? 0.06 : -0.06), 0, Math.PI * 2);
    ctx.fillStyle = '#fefefe';
    ctx.fill();
    ctx.clip();

    // Iris (Hazel / Warm Amber)
    const irisGrad = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy, 45);
    irisGrad.addColorStop(0, '#754625');
    irisGrad.addColorStop(0.55, '#452613');
    irisGrad.addColorStop(1, '#201006');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#080402';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    // Primary highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 15, cy - 14, 13, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx + 12, cy + 10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Elegant winged lash line
    ctx.strokeStyle = '#1a0d08';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 70, 44, (isRight ? 0.05 : -0.05), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Wing flick at outer corner
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(cx + 62, cy - 12);
      ctx.quadraticCurveTo(cx + 80, cy - 24, cx + 90, cy - 30);
    } else {
      ctx.moveTo(cx - 62, cy - 12);
      ctx.quadraticCurveTo(cx - 80, cy - 24, cx - 90, cy - 30);
    }
    ctx.stroke();

    // Crease
    ctx.strokeStyle = '#b68370';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 52, 50, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Curved slender feminine brow
    ctx.strokeStyle = '#3d2518';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(cx - 60, cy - 86);
      ctx.quadraticCurveTo(cx - 10, cy - 106, cx + 65, cy - 80);
    } else {
      ctx.moveTo(cx - 65, cy - 80);
      ctx.quadraticCurveTo(cx + 10, cy - 106, cx + 60, cy - 86);
    }
    ctx.stroke();
  };

  drawEye(385, 470, false);
  drawEye(639, 470, true);

  // Cute refined nose
  ctx.strokeStyle = '#b07a65';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(512, 565, 8, 0, Math.PI * 0.8);
  ctx.stroke();

  // Soft pink lips with gloss highlight
  ctx.fillStyle = '#dc6f73';
  ctx.beginPath();
  ctx.ellipse(512, 665, 42, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#99353a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(472, 665);
  ctx.quadraticCurveTo(512, 672, 552, 665);
  ctx.stroke();

  miraFaceTexture = new THREE.CanvasTexture(canvas);
  miraFaceTexture.colorSpace = THREE.SRGBColorSpace;
  return miraFaceTexture;
}

/**
 * Rich Luxury Marble Floor Texture with soft warm veining
 * Creates high-end museum aesthetic requested by user
 */
export function getLuxuryMarbleTexture(): THREE.CanvasTexture {
  if (luxuryMarbleTexture) return luxuryMarbleTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm cream/alabaster marble base
  ctx.fillStyle = '#f3f0e8';
  ctx.fillRect(0, 0, 1024, 1024);

  // Large polished tiles (512x512)
  const tileSize = 256;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      // Subtle tile shade variation
      ctx.fillStyle = ((x + y) / tileSize) % 2 === 0 ? '#f7f4ec' : '#f0ece3';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Fine golden/grey veins
      ctx.strokeStyle = 'rgba(180, 160, 140, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 20);
      ctx.bezierCurveTo(x + 80, y + 60, x + 120, y + 140, x + 210, y + 230);
      ctx.stroke();

      // Clean narrow brass/stone grout line
      ctx.strokeStyle = '#d6cebf';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  luxuryMarbleTexture = new THREE.CanvasTexture(canvas);
  luxuryMarbleTexture.wrapS = THREE.RepeatWrapping;
  luxuryMarbleTexture.wrapT = THREE.RepeatWrapping;
  luxuryMarbleTexture.repeat.set(10, 20);
  luxuryMarbleTexture.colorSpace = THREE.SRGBColorSpace;
  return luxuryMarbleTexture;
}
