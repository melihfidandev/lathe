import { useRef } from "react";
import { scrollToTarget } from "../lib/lenis";
import { useMagnetic } from "../hooks/useMagnetic";
import SoundToggle from "./SoundToggle";

export default function Header() {
  const cta = useRef();
  useMagnetic(cta, { strength: 0.25 });

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-gutter pt-[max(1rem,env(safe-area-inset-top))]">
      <a
        href="#needle-drop"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget(0, { duration: 2.4 });
        }}
        data-cursor="Side A"
        className="pointer-events-auto font-display text-2xl font-[750] tracking-[-0.03em] text-ink [font-stretch:80%]"
      >
        Lathe
      </a>
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
        <SoundToggle />
        <a
          ref={cta}
          href="#pre-order"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget("#pre-order");
          }}
          className="inline-flex min-h-11 items-center rounded-full border border-ink/40 px-4 font-display text-small text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-stage"
        >
          Pre-order
        </a>
      </div>
    </header>
  );
}
