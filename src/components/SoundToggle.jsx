import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { useUI, setUI } from "../lib/store";
import { enableSound, disableSound } from "../lib/sound";

export default function SoundToggle() {
  const on = useUI((s) => s.sound);
  const bars = useRef();

  useGSAP(
    () => {
      const els = bars.current.children;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!on || reduced) {
        gsap.to(els, { scaleY: on ? 0.7 : 0.4, duration: 0.3, ease: "power2.out" });
        return;
      }
      Array.from(els).forEach((el, i) =>
        gsap.fromTo(
          el,
          { scaleY: 0.3 },
          {
            scaleY: 1,
            duration: 0.32 + i * 0.09,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.07,
          },
        ),
      );
    },
    { dependencies: [on], revertOnUpdate: true },
  );

  const toggle = async () => {
    if (on) {
      disableSound();
      setUI({ sound: false });
    } else {
      setUI({ sound: true });
      await enableSound();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      data-cursor={on ? "Mute" : "Listen"}
      className="inline-flex min-h-11 items-center gap-2.5 rounded-full px-3 font-display text-small text-ink"
    >
      <span ref={bars} aria-hidden="true" className="flex h-3.5 items-end gap-[3px]">
        <span className="block h-full w-[2px] origin-bottom scale-y-40 bg-current" />
        <span className="block h-full w-[2px] origin-bottom scale-y-40 bg-current" />
        <span className="block h-full w-[2px] origin-bottom scale-y-40 bg-current" />
      </span>
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}
