/**
 * Ses motoru — hiçbir ses dosyası yok, her şey Web Audio ile üretilir.
 * Müzik bir kez OfflineAudioContext'te "basılır" (tıpkı bir plak gibi), sonra
 * playbackRate ile çalınır: tabla hızlanınca hem tempo hem perde yükselir, tıpkı gerçek pikap gibi.
 */

let ctx = null;
let master, musicGain, crackleGain, scratchGain, scratchFilter, musicSrc;
let building = null;

const BPM = 74;
const BARS = 8;

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// Dm9 → G13 → Cmaj9 → A7(b9): her akor 2 ölçü
const CHORDS = [
  { root: 38, notes: [53, 57, 60, 64] },
  { root: 43, notes: [53, 59, 64, 69] },
  { root: 36, notes: [52, 55, 59, 62] },
  { root: 45, notes: [55, 61, 64, 70] },
];

function noiseBuffer(ac, seconds, fill) {
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = fill(i, d);
  return buf;
}

async function pressRecord(sampleRate) {
  const beat = 60 / BPM;
  const length = beat * 4 * BARS;
  const ac = new OfflineAudioContext(2, Math.ceil(sampleRate * length), sampleRate);

  const out = ac.createBiquadFilter();
  out.type = "lowpass";
  out.frequency.value = 3800;
  const comp = ac.createDynamicsCompressor();
  out.connect(comp).connect(ac.destination);

  const white = noiseBuffer(ac, 1, () => Math.random() * 2 - 1);

  const tone = (
    freq,
    t,
    dur,
    { type = "sine", gain = 0.1, attack = 0.01, cutoff = 2000, detune = 0 },
  ) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, Math.min(t + dur, length - 0.01));
    o.connect(f).connect(g).connect(out);
    o.start(t);
    o.stop(Math.min(t + dur + 0.05, length));
  };

  const hit = (t, { freq = 1800, q = 0.8, gain = 0.1, dur = 0.08, type = "bandpass" }) => {
    const s = ac.createBufferSource();
    s.buffer = white;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t);
    s.stop(t + dur + 0.02);
  };

  const kick = (t) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.4);
  };

  for (let bar = 0; bar < BARS; bar++) {
    const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
    const t0 = bar * beat * 4;
    // Pad: iki hafif detune'lu testere, yumuşak atak
    if (bar % 2 === 0) {
      chord.notes.forEach((n) => {
        tone(midi(n), t0, beat * 8, {
          type: "sawtooth",
          gain: 0.022,
          attack: 0.9,
          cutoff: 900,
          detune: -7,
        });
        tone(midi(n), t0, beat * 8, {
          type: "sawtooth",
          gain: 0.022,
          attack: 0.9,
          cutoff: 900,
          detune: 7,
        });
      });
    }
    for (let b = 0; b < 4; b++) {
      const t = t0 + b * beat;
      const swing = beat * 0.58;
      // Bas
      if (b === 0 || b === 2)
        tone(midi(chord.root), t, beat * 1.6, { gain: 0.26, attack: 0.02, cutoff: 400 });
      if (b === 3) tone(midi(chord.root + 7), t + swing, beat * 0.4, { gain: 0.16, cutoff: 400 });
      // Rhodes benzeri vuruşlar (2 ve 4'ün offbeat'i)
      if (b === 1 || b === 3) {
        chord.notes.forEach((n, i) =>
          tone(midi(n + 12), t + swing + i * 0.012, beat * 1.2, {
            type: "triangle",
            gain: 0.03,
            cutoff: 2600,
          }),
        );
      }
      // Davul
      if (b === 0 || (b === 2 && bar % 2 === 1)) kick(t);
      if (b === 2 && bar % 2 === 0) kick(t + swing);
      if (b === 1 || b === 3) hit(t, { freq: 1900, q: 0.7, gain: 0.16, dur: 0.12 });
      hit(t, { freq: 8000, q: 1, gain: 0.035, dur: 0.03, type: "highpass" });
      hit(t + swing, { freq: 8000, q: 1, gain: 0.025, dur: 0.03, type: "highpass" });
    }
  }

  return ac.startRendering();
}

function crackleBuffer(ac) {
  let last = 0;
  let pop = 0;
  let popSign = 1;
  return noiseBuffer(ac, 4, () => {
    // yumuşak tıslama + seyrek çıtırtılar
    last = last * 0.86 + (Math.random() * 2 - 1) * 0.14;
    if (Math.random() < 0.00035) {
      pop = 0.35 + Math.random() * 0.6;
      popSign = Math.random() < 0.5 ? -1 : 1;
    }
    const p = pop * popSign;
    pop *= 0.82;
    popSign *= -1;
    return last * 0.05 + p;
  });
}

async function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(master);

  crackleGain = ctx.createGain();
  crackleGain.gain.value = 0;
  crackleGain.connect(master);
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuffer(ctx);
  crackle.loop = true;
  crackle.connect(crackleGain);
  crackle.start();

  scratchFilter = ctx.createBiquadFilter();
  scratchFilter.type = "bandpass";
  scratchFilter.Q.value = 3;
  scratchGain = ctx.createGain();
  scratchGain.gain.value = 0;
  scratchFilter.connect(scratchGain).connect(master);
  const scratch = ctx.createBufferSource();
  scratch.buffer = noiseBuffer(ctx, 2, () => Math.random() * 2 - 1);
  scratch.loop = true;
  scratch.connect(scratchFilter);
  scratch.start();

  const pressed = await pressRecord(ctx.sampleRate);
  musicSrc = ctx.createBufferSource();
  musicSrc.buffer = pressed;
  musicSrc.loop = true;
  musicSrc.connect(musicGain);
  musicSrc.start();
}

export async function enableSound() {
  if (!ctx) building = building || build();
  await building;
  await ctx.resume();
  master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.15);
}

export function disableSound() {
  if (!ctx) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
}

/** Her karede çağrılır. rate: tablanın nominal hıza oranı (1 = 33⅓) */
export function updateSound({ rate, needleDown, reverse }) {
  if (!ctx || !musicSrc || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const playing = needleDown && rate > 0.08;
  musicSrc.playbackRate.setTargetAtTime(Math.max(0.05, Math.min(rate, 2.2)), now, 0.04);
  musicGain.gain.setTargetAtTime(playing && !reverse ? 0.6 : 0, now, reverse ? 0.02 : 0.12);
  crackleGain.gain.setTargetAtTime(needleDown ? 0.5 : 0, now, 0.1);
  const s = needleDown && reverse ? Math.min(1, reverse * 0.35) : 0;
  scratchGain.gain.setTargetAtTime(s * 0.5, now, 0.02);
  scratchFilter.frequency.setTargetAtTime(500 + reverse * 260, now, 0.02);
}

/** İğne inişi: boğuk bir "tump" + kısa çıtırtı */
export function needleDropSound() {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.45);
}
