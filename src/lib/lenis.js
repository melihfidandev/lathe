import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { live } from "./store";

let lenis = null;

export function startLenis() {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  lenis.on("scroll", (e) => {
    live.velocity = e.velocity;
    ScrollTrigger.update();
  });
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  };
}

export const getLenis = () => lenis;

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 2, ...opts });
  else {
    const el =
      typeof target === "string"
        ? document.querySelector(target)
        : target instanceof Element
          ? target
          : null;
    if (el) el.scrollIntoView();
    else window.scrollTo(0, typeof target === "number" ? target : 0);
  }
}
