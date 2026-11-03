/**
 * Sahne pozları. Her bölüm bir poz; GSAP aralarında scroll ile geçiş yapar.
 * c*: kamera konumu, t*: kameranın baktığı nokta
 * sx: masaüstünde objenin yatay kayması (ekran oranı, + sağa) — metin karşı tarafta durur
 * sy: mobilde objenin dikey kayması (+ yukarı) — metin altta durur
 * needle: iğnenin plak merkezine uzaklığı (2.2 = kol park hâlinde)
 * armLift: 0 iğne plakta, 1 kol kalkık
 * lift: plağın tabladan yüksekliği, flip: 0 A yüzü, 1 B yüzü
 * explode: 0 monte, 1 katmanlarına ayrılmış
 * yaw: pikabın kendi ekseninde dönüşü, beam: spot ışığın gücü
 */
const base = {
  cx: 0,
  cy: 0,
  cz: 0,
  tx: 0,
  ty: 0,
  tz: 0,
  sx: 0,
  sy: 0,
  needle: 2.2,
  armLift: 1,
  lift: 0,
  flip: 0,
  explode: 0,
  yaw: 0,
  beam: 1,
};

// Her poz tek satır: kamera (c*), hedef (t*), kayma (sx/sy) ve pikap durumu
// prettier-ignore
export const POSES = {
  intro:      { ...base, cx: -0.5, cy: 17.4, cz: 0.9,  tx: -0.5,  ty: 3.0,  tz: 0,    lift: 2.4, beam: 0 },
  hero:       { ...base, cx: 5.6,  cy: 4.4,  cz: 7.6,  tx: -0.2,  ty: 0.3,  tz: 0,    sx: 0.2,   sy: 0.17, needle: 1.42, armLift: 0 },
  platter:    { ...base, cx: -1.9, cy: 1.85, cz: 5.6,  tx: -0.45, ty: 0.42, tz: 0.3,  sx: 0.27,  sy: 0.2,  needle: 1.27, armLift: 0 },
  inside:     { ...base, cx: 8.4,  cy: 5.2,  cz: 10.2, tx: -0.2,  ty: 2.1,  tz: 0,    sx: 0.2,   sy: 0.26, needle: 1.11, armLift: 0 },
  insideOpen: { ...base, cx: 8.4,  cy: 5.2,  cz: 10.2, tx: -0.2,  ty: 2.1,  tz: 0,    sx: 0.2,   sy: 0.26, needle: 1.11, armLift: 0, explode: 1, yaw: -0.35 },
  arm:        { ...base, cx: 1.25, cy: 2.3,  cz: 2.55, tx: -0.05, ty: 0.62, tz: 0.55, sx: -0.2,  sy: 0.2,  needle: 0.95, armLift: 0 },
  finishes:   { ...base, cx: -1.2, cy: 5.4,  cz: 8.6,  tx: 0,     ty: 0.2,  tz: 0,    sx: 0.2,   sy: 0.17, needle: 0.79, armLift: 0, yaw: 0.55 },
  flip:       { ...base, cx: 5,    cy: 4.4,  cz: 9.4,  tx: -0.5,  ty: -0.5, tz: 0,    sy: 0.12 },
  flipped:    { ...base, cx: -5,   cy: 4.4,  cz: 9.4,  tx: -0.5,  ty: -0.5, tz: 0,    sy: 0.12, flip: 1 },
  liner:      { ...base, cx: -4.2, cy: 8.2,  cz: 7.6,  tx: -0.4,  ty: 0.3,  tz: 0,    sx: -0.29, sy: 0.2,  needle: 1.4,  armLift: 0, flip: 1, beam: 0.6 },
  preorder:   { ...base, cx: 6.8,  cy: 3.7,  cz: 8.2,  tx: 0,     ty: 0.4,  tz: 0,    sx: 0.27,  sy: 0.18, needle: 1.0,  armLift: 0, flip: 1, beam: 0.8 },
  runout:     { ...base, cx: 0,    cy: 19,   cz: 4.3,  tx: 0,      ty: 0.5,   tz: 0.8,   sy: 0.12, needle: 0.57, armLift: 0, flip: 1, beam: 1 },
};
