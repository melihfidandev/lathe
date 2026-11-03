import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { live, setUI, useUI } from "../lib/store";
import { FINISHES } from "../content/tracks";
import { motion, softFade } from "../animations/motion";
import TrackHead from "../components/TrackHead";

export default function Finishes() {
  const root = useRef();
  const note = useRef();
  const finish = useUI((s) => s.finish);
  const current = FINISHES.find((f) => f.id === finish);

  const choose = (id) => {
    live.finish = id;
    setUI({ finish: id });
  };

  useGSAP(
    () => {
      motion({
        full: () => {
          SplitText.create("[data-anim='finish-title']", {
            type: "words,chars", // words: kelime bütün kalır, satır harf ortasından bölünmez
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.chars, {
                fontStretch: "75%",
                fontWeight: 300,
                opacity: 0,
                duration: 1.4,
                stagger: { each: 0.04, from: "random" },
                ease: "power3.out",
                scrollTrigger: { trigger: root.current, start: "top 60%" },
              }),
          });
          gsap.from("[data-anim='swatch']", {
            scale: 0,
            rotate: -90,
            duration: 1.2,
            stagger: 0.12,
            ease: "elastic.out(1, 0.6)",
            scrollTrigger: { trigger: "[data-anim='swatches']", start: "top 85%" },
          });
        },
        reduced: () => softFade("[data-anim]", root.current),
      });
    },
    { scope: root },
  );

  // Not metni seçim değişince yeniden yazılır
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(note.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 });
    },
    { dependencies: [finish], scope: root },
  );

  return (
    <section
      id="finishes"
      ref={root}
      aria-labelledby="finishes-title"
      className="relative flex min-h-[140svh] flex-col justify-end px-gutter pb-32 md:justify-center md:py-32"
    >
      <div className="md:max-w-[32rem]">
        <TrackHead code="A5" title="Finishes" />
        <h2
          id="finishes-title"
          data-anim="finish-title"
          className="mt-4 font-display text-display font-[720] tracking-[-0.04em]"
        >
          Pick the wood
        </h2>
        <fieldset data-anim="swatches" className="mt-8">
          <legend className="sr-only">Plinth finish</legend>
          <div className="flex flex-wrap gap-3">
            {FINISHES.map((f) => (
              <label
                key={f.id}
                data-cursor={finish === f.id ? "" : "Try it"}
                className="group relative flex min-h-11 items-center gap-3 rounded-full border border-ink/25 py-1.5 pr-5 pl-1.5 font-display text-small transition-colors duration-300 has-checked:border-ink has-checked:bg-ink has-checked:text-stage has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-label"
              >
                <input
                  type="radio"
                  name="finish"
                  value={f.id}
                  checked={finish === f.id}
                  onChange={() => choose(f.id)}
                  className="sr-only"
                />
                <span
                  data-anim="swatch"
                  aria-hidden="true"
                  className="block size-8 rounded-full ring-1 ring-black/20 ring-inset"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${f.color} 70%, white), ${f.color} 60%)`,
                  }}
                />
                {f.name}
              </label>
            ))}
          </div>
        </fieldset>
        <p
          ref={note}
          aria-live="polite"
          className="mt-6 min-h-[3lh] max-w-[30em] text-body text-ink-soft"
        >
          {current.note}
        </p>
      </div>
    </section>
  );
}
