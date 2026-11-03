import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { scrollToTarget } from "../lib/lenis";
import { useMagnetic } from "../hooks/useMagnetic";

// Halka tam bir tur: textLength çevreye eşit, metin kendi üstüne binmez
const RING =
  "You’ve reached the runout groove. It keeps turning until you lift the needle. Thanks for listening.  ";
const CIRCUMFERENCE = 2 * Math.PI * 170;

export default function Runout() {
  const root = useRef();
  const button = useRef();
  useMagnetic(button, { strength: 0.3 });

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-anim='ring']", {
        scale: 0.6,
        opacity: 0,
        rotate: -60,
        duration: 2,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 40%" },
      });
    },
    { scope: root },
  );

  return (
    <footer
      id="runout"
      ref={root}
      className="relative grid min-h-svh place-items-center overflow-clip px-gutter pt-24 pb-6"
    >
      <svg
        data-anim="ring"
        viewBox="0 0 400 400"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 w-0"
      >
        <defs>
          <path id="runout-path" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" />
        </defs>
        <g className="runout-spin origin-center">
          <text className="fill-ink font-display text-[16px] font-[500]">
            <textPath href="#runout-path" textLength={CIRCUMFERENCE - 4} lengthAdjust="spacing">
              {RING}
            </textPath>
          </text>
        </g>
      </svg>

      <div className="relative mt-auto flex flex-col items-center gap-5 self-end pb-16 text-center md:pb-2">
        <button
          ref={button}
          type="button"
          data-cursor="Rewind"
          onClick={() =>
            scrollToTarget(0, { duration: 3.2, easing: (t) => 1 - Math.pow(1 - t, 3) })
          }
          className="min-h-12 rounded-full bg-label px-7 font-display text-base font-[650] text-oxblood"
        >
          Play side A again
        </button>
        <p className="rounded-full bg-stage/80 px-4 py-1 text-small text-ink">
          Concept, design and code by Melih Fidan, 2026.
        </p>
      </div>
    </footer>
  );
}
