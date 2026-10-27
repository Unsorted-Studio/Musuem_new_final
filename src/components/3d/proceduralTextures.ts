import * as THREE from 'three';

/**
 * Procedural Canvas Textures for OUR MUSEUM.
 * Generates realistic museum surfaces: polished marble floor, limestone walls,
 * gold dedication inscription, and animated cinema video canvas.
 */

// 1. Polished Classical Museum Marble Floor (Calacatta Gold with polished veins and brass inlays)
export function createMarbleFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm Italian marble base (soft limestone / ivory)
  ctx.fillStyle = '#2d2825';
  ctx.fillRect(0, 0, 1024, 1024);

  const tileSize = 256;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#3a3430' : '#322c28';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Gold & pearlescent marble veining
      ctx.strokeStyle = isAlt ? 'rgba(235, 205, 155, 0.22)' : 'rgba(200, 190, 180, 0.15)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      let cx = x + 25;
      let cy = y + 25;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.45) * 70 + 40;
        cy += (Math.random() - 0.45) * 70 + 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Gleaming brass joint inlay lines
      ctx.strokeStyle = 'rgba(225, 185, 75, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Royal Crimson & Gold Velvet Carpet Runner (Aisle down the center of the gallery)
export function createCarpetRunnerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep royal crimson velvet
  ctx.fillStyle = '#6b1120';
  ctx.fillRect(0, 0, 512, 512);

  // Velvet micro-texture
  for (let i = 0; i < 8000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(150, 25, 45, 0.15)' : 'rgba(70, 8, 18, 0.2)';
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Double golden braided borders on edges
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(20, 0, 8, 512);
  ctx.fillRect(36, 0, 3, 512);
  ctx.fillRect(512 - 28, 0, 8, 512);
  ctx.fillRect(512 - 39, 0, 3, 512);

  // Greek key / baroque damask ornament along the gold edge
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 512; y += 32) {
    ctx.strokeRect(22, y + 4, 15, 24);
    ctx.strokeRect(512 - 37, y + 4, 15, 24);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Gallery Wall Texture (Warm neoclassical plaster with gilded wainscoting)
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm French limestone / silk gray base
  ctx.fillStyle = '#262220';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle warm grain
  for (let i = 0; i < 7000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const bright = Math.random() * 0.05;
    ctx.fillStyle = `rgba(255, 245, 225, ${bright})`;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Neoclassical wainscoting panels
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 40, 210, 280);
  ctx.strokeRect(270, 40, 210, 280);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 50, 190, 260);
  ctx.strokeRect(280, 50, 190, 260);

  // Gold picture rail molding at top
  ctx.fillStyle = '#3a332d';
  ctx.fillRect(0, 350, 512, 20);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 348, 512, 3);
  ctx.fillRect(0, 368, 512, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Ornate Dedication Plaque Wall Texture
export function createDedicationPlaqueTexture(
  coupleNames: string,
  anniversary: string,
  quote: string = "Every love story is beautiful, but ours is my favorite."
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep dark warm marble plaque
  ctx.fillStyle = '#171412';
  ctx.fillRect(0, 0, 1024, 1024);

  // Double gold borders with ornate corner brackets
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 944, 944);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 914, 914);

  // Corner flourishes
  const drawCornerFlourish = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, 10, 15, 0, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  };

  drawCornerFlourish(40, 40, 0);
  drawCornerFlourish(984, 40, Math.PI / 2);
  drawCornerFlourish(984, 984, Math.PI);
  drawCornerFlourish(40, 984, -Math.PI / 2);

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
  ctx.font = '500 24px serif';
  ctx.fillText('M U S E U M   D E D I C A T I O N', 512, 140);

  // Decorative divider
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(340, 170);
  ctx.lineTo(684, 170);
  ctx.stroke();
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(512, 170, 5, 0, Math.PI * 2);
  ctx.fill();

  // Couple Names
  ctx.font = '600 68px serif';
  ctx.fillStyle = '#f5e6c8';
  ctx.fillText(coupleNames, 512, 280);

  // Anniversary date
  ctx.font = 'italic 400 32px serif';
  ctx.fillStyle = '#e2c589';
  ctx.fillText(`Established ${anniversary}`, 512, 345);

  // Golden heart icon
  ctx.font = '32px serif';
  ctx.fillStyle = '#e11d48';
  ctx.fillText('♥', 512, 410);

  // Romantic Quote
  ctx.font = 'italic 400 32px serif';
  ctx.fillStyle = '#d6cebe';
  ctx.fillText(`“${quote}”`, 512, 510);

  // Prompt hint
  ctx.fillStyle = '#f3f4f6';
  ctx.font = '600 26px sans-serif';
  ctx.fillText('[ E ]  READ DEDICATION LETTER', 512, 850);

  ctx.font = '400 18px sans-serif';
  ctx.fillStyle = 'rgba(214, 206, 190, 0.6)';
  ctx.fillText('Click or press E while standing near to unfold our story', 512, 890);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. Cinema Dynamic Screen Canvas Manager
export class CinemaCanvasScreen {
  public canvas: HTMLCanvasElement;
  public texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private time = 0;
  private isPlaying = true;
  private mode: 'stars' | 'slideshow' | 'vintage' = 'stars';
  private slides: string[] = [];
  private currentSlideIdx = 0;
  private lastSlideChange = 0;
  private slideImages: HTMLImageElement[] = [];

  constructor(slideImageUrls: string[]) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d')!;
    this.slides = slideImageUrls;

    // Preload slide images
    this.slides.forEach((url) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        this.slideImages.push(img);
      };
    });

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.render();
  }

  public setMode(mode: 'stars' | 'slideshow' | 'vintage'): void {
    this.mode = mode;
  }

  public togglePlay(): boolean {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public update(delta: number): void {
    if (!this.isPlaying) return;
    this.time += delta;
    this.render();
    this.texture.needsUpdate = true;
  }

  private render(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    if (this.mode === 'slideshow' && this.slideImages.length > 0) {
      // Cycle through images every 6 seconds with smooth crossfade
      const now = this.time;
      if (now - this.lastSlideChange > 6) {
        this.currentSlideIdx = (this.currentSlideIdx + 1) % this.slideImages.length;
        this.lastSlideChange = now;
      }
      const activeImg = this.slideImages[this.currentSlideIdx];
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);
      if (activeImg.complete) {
        // Draw centered and letterboxed
        const scale = Math.min(w / activeImg.width, h / activeImg.height);
        const nw = activeImg.width * scale;
        const nh = activeImg.height * scale;
        const ox = (w - nw) / 2;
        const oy = (h - nh) / 2;
        ctx.drawImage(activeImg, ox, oy, nw, nh);
      }
      // Romantic cinema title overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h - 90, w, 90);
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('Our Cherished Moments in 4K Cinema', w / 2, h - 38);
      return;
    }

    // Default mode: Enchanted Romantic Starry Galaxy & Nebula Animation
    // Deep cosmic gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 700);
    grad.addColorStop(0, '#1e1138');
    grad.addColorStop(0.5, '#0d0b24');
    grad.addColorStop(1, '#020205');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cosmic dust / nebula clouds
    for (let c = 0; c < 3; c++) {
      const cx = w * 0.5 + Math.sin(this.time * 0.3 + c) * 200;
      const cy = h * 0.5 + Math.cos(this.time * 0.2 + c * 2) * 100;
      const cgrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 350);
      cgrad.addColorStop(0, c === 0 ? 'rgba(236, 72, 153, 0.18)' : 'rgba(147, 51, 234, 0.15)');
      cgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cgrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 120; i++) {
      const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 77 + 2) * 0.5 + 0.5) * h;
      const pulse = Math.sin(this.time * 2.5 + i) * 0.5 + 0.5;
      const radius = (i % 4 === 0) ? 2.5 * pulse : 1.2;
      ctx.globalAlpha = 0.3 + pulse * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Occasional shooting star
    const shootCycle = (this.time * 0.8) % 4;
    if (shootCycle < 1.2) {
      const p = shootCycle / 1.2;
      const startX = w * 0.2 + p * 500;
      const startY = h * 0.1 + p * 300;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - p) * 0.9 + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX - 90, startY - 50);
      ctx.stroke();
    }

    // Central romantic couple silhouette on hill watching the cosmos
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.arc(w / 2, h + 320, 480, Math.PI, 0, false);
    ctx.fill();

    // Elegant text caption on cinema screen
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2d5c3';
    ctx.font = 'italic 300 36px serif';
    ctx.fillText('“Two souls, one endless universe.”', w / 2, h - 140);

    ctx.font = '500 20px sans-serif';
    ctx.fillStyle = 'rgba(214, 188, 148, 0.7)';
    ctx.fillText('NOW SHOWING IN CINEMA SUITE · PRESS [E] TO SIT TOGETHER', w / 2, h - 90);
  }

  public dispose(): void {
    this.texture.dispose();
  }
}
