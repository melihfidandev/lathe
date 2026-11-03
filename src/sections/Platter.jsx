import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { live } from "../lib/store";
import { motion, softFade } from "../animations/motion";
import TrackHead from "../components/TrackHead";

const NOMINAL = 33.333;

export default function Platter() {
  const root = useRef();
  const readout = useRef();
  const state = useRef();

  // Canlı devir göstergesi: rakam tablanın hızıyla esner ve eğilir
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let shown = "";
      const tick = () => {
        const rpm = live.rpm;
        const steady = Math.abs(rpm - NOMINAL) < 0.8;
        const text = steady ? "33⅓" : rpm.toFixed(1);
        if (text !== shown) {
          readout.current.textContent = text;
          shown = text;
          state.current.textContent = steady
            ? "Steady at 33⅓ rpm"
            : rpm > NOMINAL
              ? "Speeding up"
              : rpm < 0
                ? "Running backwards"
                : "Slowing down";
        }
        if (reduced) return;
        const stretch = gsap.utils.clamp(75, 100, 75 + Math.abs(rpm) * 0.75);
        const skew = gsap.utils.clamp(-14, 14, (rpm - NOMINAL) * -0.22);
        readout.current.style.fontStretch = `${stretch}%`;
        readout.current.style.transform = `skewX(${skew}deg)`;
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: root },
  );

  useGSAP(
    () => {
      motion({
        full: () => {
          gsap.from(readout.current, {
            yPercent: 60,
            opacity: 0,
            duration: 1.4,
            scrollTrigger: { trigger: root.current, start: "top 70%" },
          });
          SplitText.create("[data-anim='platter-copy']", {
            type: "lines",
            mask: "lines",
            aria: "none",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: 1.1,
                stagger: 0.07,
                scrollTrigger: { trigger: root.current, start: "top 55%" },
              }),
          });
        },
        reduced: () => softFade("[data-anim]", root.current),
      });
    },
    { scope: root },
  );

  return (
    <section
      id="platter"
      ref={root}
      aria-labelledby="platter-title"
      className="relative flex min-h-[135svh] flex-col justify-end px-gutter pb-32 md:justify-center md:py-32"
    >
      <div className="w-full md:max-w-[31rem]">
        <TrackHead code="A2" title="Platter" />
        <p
          aria-hidden="true"
          className="mt-4 overflow-clip font-display text-display font-[720] tracking-[-0.04em] text-label"
        >
          <span ref={readout} className="inline-block origin-bottom-left will-change-transform">
            33⅓
          </span>
        </p>
        <p ref={state} aria-live="off" className="font-display text-small text-ink-soft">
          Steady at 33⅓ rpm
        </p>
        <h2
          id="platter-title"
          data-anim="platter-copy"
          className="mt-10 font-display text-h2 font-[650] tracking-[-0.03em]"
        >
          4.2 kilograms of aluminum
        </h2>
        <p data-anim="platter-copy" className="mt-5 max-w-[34em] text-body text-ink-soft">
          The platter is machined from a single billet and balanced to within a gram. All that mass
          works like a flywheel: it smooths out the motor’s pulses and shrugs off a knock on the
          shelf. Scroll fast and watch the speed drift, then settle back.
        </p>
        <p data-anim="platter-copy" className="mt-4 max-w-[34em] text-body text-ink-soft">
          The dots around its edge are a strobe ring. Under mains light, the right row stands
          perfectly still when the speed is exact.
        </p>
      </div>
    </section>
  );
}
