import { useSyncExternalStore } from "react";
import { POSES } from "../animations/poses";

/**
 * scene: GSAP'in anime ettiği, R3F'in her karede okuduğu düz nesne.
 * React state'i değil — her karede re-render olmasın diye.
 */
export const scene = { ...POSES.intro };

/** live: sürekli değişen, React dışı paylaşılan değerler */
export const live = {
  velocity: 0, // Lenis'ten, px/kare
  rpm: 0, // tablanın anlık devri
  needleDown: false,
  burst: 0, // iğne inişinde toz patlaması (1 → 0)
  finish: "walnut",
  pointerX: 0,
  pointerY: 0,
  clientX: -100, // imlecin son ekran konumu (portal değişince yeniden yerleşmek için)
  clientY: -100,
};

/** ui: React'in tepki vermesi gereken seyrek değişen durum */
const listeners = new Set();
let ui = {
  loaded: false,
  introDone: false,
  track: "needle-drop",
  sound: false,
  finish: "walnut",
  menuOpen: false,
};

export const setUI = (patch) => {
  ui = { ...ui, ...patch };
  listeners.forEach((l) => l());
};
export const getUI = () => ui;

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useUI = (selector) => useSyncExternalStore(subscribe, () => selector(ui));
