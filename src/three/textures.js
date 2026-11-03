import * as THREE from "three";

/**
 * Tüm dokular canvas ile prosedürel üretilir — harici görsel yok.
 * Plak yarıçapı 1.5 birim; oluk yarıçapları bu ölçeğe göre.
 */
export const RECORD_R = 1.5;
export const LABEL_R = 0.5;

// Parçalar arasındaki boşluklar plakta gerçekten görünür: A yüzünde 5, B yüzünde 2 parça
export const SIDE_A_TRACKS = [
  [1.46, 1.33],
  [1.31, 1.17],
  [1.15, 1.0],
  [0.98, 0.84],
  [0.82, 0.62],
];
export const SIDE_B_TRACKS = [
  [1.46, 1.05],
  [1.03, 0.62],
];

const FONT = '"Bricolage Grotesque Variable", sans-serif';

function canvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function recordTexture(side) {
  const size = 2048;
  const [c, g] = canvas(size);
  const k = size / 2 / RECORD_R;
  const rnd = seeded(side === "A" ? 7 : 13);
  g.translate(size / 2, size / 2);

  g.fillStyle = "#060606";
  g.beginPath();
  g.arc(0, 0, RECORD_R * k, 0, Math.PI * 2);
  g.fill();

  const tracks = side === "A" ? SIDE_A_TRACKS : SIDE_B_TRACKS;
  for (const [outer, inner] of tracks) {
    for (let r = outer * k; r > inner * k; r -= 1.6) {
      const l = 14 + rnd() * 16;
      g.strokeStyle = `rgba(${l},${l},${l},${0.55 + rnd() * 0.45})`;
      g.lineWidth = 0.9;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
  }
  // Runout oluğu: etiketin hemen dışında tek bir parlak halka
  g.strokeStyle = "rgba(60,60,60,0.9)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 0.56 * k, 0, Math.PI * 2);
  g.stroke();

  // Etiket
  const labelColor = side === "A" ? "#f0b429" : "#ede6da";
  const ink = "#2a0d10";
  g.fillStyle = labelColor;
  g.beginPath();
  g.arc(0, 0, LABEL_R * k, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `750 ${0.19 * k}px ${FONT}`;
  g.fillText("Lathe", 0, -0.2 * k);
  g.font = `500 ${0.055 * k}px ${FONT}`;
  g.fillText(side === "A" ? "Side A" : "Side B", 0, 0.2 * k);
  g.font = `400 ${0.042 * k}px ${FONT}`;
  g.fillText("33⅓ rpm  LTH-001", 0, 0.29 * k);

  // Etiket kenarında dairesel yazı
  const ring =
    side === "A" ? "Needle drop  Platter  Inside  The arm  Finishes  " : "Liner notes  Pre-order  ";
  g.font = `500 ${0.036 * k}px ${FONT}`;
  const text = ring.repeat(side === "A" ? 2 : 4);
  const rr = 0.42 * k;
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    g.save();
    g.rotate(i * step);
    g.translate(0, -rr);
    g.fillText(text[i], 0, 0);
    g.restore();
  }

  // Merkez deliği
  g.fillStyle = "#050505";
  g.beginPath();
  g.arc(0, 0, 0.035 * k, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Anizotropi haritası: her pikselde oluk yönü (teğet). Plağın üzerinde dönen
 * o meşhur ışık kuyruğunu verir. rg = yön, b = güç.
 */
export function grooveAnisotropyMap() {
  const size = 512;
  const [c, g] = canvas(size);
  const img = g.createImageData(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const r = Math.hypot(dx, dy) * RECORD_R;
      const len = Math.hypot(dx, dy) || 1;
      const tx = -dy / len;
      const ty = dx / len;
      const i = (y * size + x) * 4;
      img.data[i] = (tx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ty * 0.5 + 0.5) * 255;
      img.data[i + 2] = r > LABEL_R && r < RECORD_R ? 255 : 0;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Ahşap damar dokusu — gri tonlu, renk materyalden gelir (konfigüratör için) */
export function woodTexture() {
  // Damar x boyunca uzar, ince detay y'de: x yarı çözünürlükte örneklenir (STEP), y tam kalır.
  // Desen 1024 genişlikteki koordinatlarla hesaplanır, görünüm değişmez; maliyet yarıya iner.
  const STEP = 2;
  const w = 1024 / STEP;
  const h = 512;
  const [c, g] = canvas(w, h);
  const img = g.createImageData(w, h);
  const rnd = seeded(3);
  const knots = Array.from({ length: 5 }, () => [rnd() * 1024, rnd() * h, 20 + rnd() * 60]);
  for (let y = 0; y < h; y++) {
    const rowWave = Math.sin(y * 0.011) * 0.8;
    for (let px = 0; px < w; px++) {
      const x = px * STEP;
      let warp = Math.sin(x * 0.0042 + rowWave) * 22 + Math.sin(x * 0.013) * 4;
      for (const [kx, ky, kr] of knots) {
        const dx = x - kx;
        const dy = (y - ky) * 2;
        warp += (kr * 40) / (Math.sqrt(dx * dx + dy * dy) + kr * 0.9);
      }
      const ring = Math.sin((y + warp) * 0.19);
      const fine = Math.sin((y + warp * 1.3) * 1.1 + x * 0.002);
      const v = 205 + ring * 22 + fine * 7 + (rnd() - 0.5) * 10;
      const i = (y * w + px) * 4;
      img.data[i] = v;
      img.data[i + 1] = v * 0.97;
      img.data[i + 2] = v * 0.93;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Tabla kenarındaki strobe noktaları: 50 Hz / 60 Hz, 33⅓ / 45 için dört sıra */
export function strobeTexture() {
  const w = 4096;
  const h = 128;
  const [c, g] = canvas(w, h);
  g.fillStyle = "#c9c8c4";
  g.fillRect(0, 0, w, h);
  // ince torna izleri
  for (let y = 0; y < h; y += 2) {
    const l = 190 + Math.random() * 30;
    g.fillStyle = `rgba(${l},${l},${l},0.35)`;
    g.fillRect(0, y, w, 1);
  }
  const rows = [180, 216, 133, 160];
  rows.forEach((count, row) => {
    const y = 14 + row * 27;
    const dw = w / count;
    g.fillStyle = "#1c1c1c";
    for (let i = 0; i < count; i++) g.fillRect(i * dw, y, dw * 0.5, 16);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Fırçalanmış alüminyum için pürüzlülük haritası (yatay fırça izleri) */
export function brushedRoughness() {
  const w = 512;
  const [c, g] = canvas(w);
  for (let y = 0; y < w; y++) {
    const l = 110 + Math.random() * 60;
    g.fillStyle = `rgb(${l},${l},${l})`;
    g.fillRect(0, y, w, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Keçe mat — ince lifli doku */
export function feltTexture() {
  const w = 512;
  const [c, g] = canvas(w);
  const img = g.createImageData(w, w);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + Math.random() * 55;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
