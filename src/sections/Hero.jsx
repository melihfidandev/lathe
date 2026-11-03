import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { useUI } from "../lib/store";
import TrackHead from "../components/TrackHead";

export default function Hero() {
  const root = useRef();
  const title = useRef();
  const introDone = useUI((s) => s.introDone);

  // İğne inene kadar içerik saklı (yalnızca JS çalışıyorsa)
  useGSAP(
    () => {
      gsap.set("[data-anim='hero-in']", { autoAlpha: 0 });
      gsap.set(title.current, { autoAlpha: 0 });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!introDone) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.set(title.current, { autoAlpha: 1 });

      if (reduced) {
        gsap.from(title.current, { opacity: 0, duration: 0.6 });
        gsap.to("[data-anim='hero-in']", {
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.2,
        });
        return;
      }

      // İğne değdiği an harfler oluktan yükselir; dar başlayıp genişler (devir alır gibi)
      SplitText.create(title.current, {
        type: "lines,words,chars",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          return gsap
            .timeline()
            .fromTo(
              self.chars,
              { yPercent: 118, rotate: 6, fontStretch: "75%" },
              { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.045, ease: "expo.out" },
            )
            .to(
              self.chars,
              { fontStretch: "100%", duration: 1.6, stagger: 0.045, ease: "power3.inOut" },
              0.15,
            );
        },
      });
      gsap.fromTo(
        "[data-anim='hero-in']",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1, delay: 0.55, ease: "expo.out" },
      );
      gsap.fromTo(
        "[data-anim='hero-groove']",
        { scaleX: 0 },
        { scaleX: 1, duration: 1.6, delay: 1, ease: "expo.inOut", transformOrigin: "left center" },
      );
    },
    { dependencies: [introDone], scope: root },
  );

  return (
    <section
      id="needle-drop"
      ref={root}
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col justify-end px-gutter pt-28 pb-32 md:justify-end md:pb-24"
    >
      <TrackHead code="A1" title="Needle drop" className="mb-4" data-anim="hero-in" />
      <h1
        id="hero-title"
        ref={title}
        className="font-display text-poster font-[760] tracking-[-0.045em] text-ink [font-stretch:100%]"
      >
        Lathe <br />
        One
      </h1>
      <div className="mt-6 grid gap-6 md:mt-8 md:max-w-[40rem] md:grid-cols-[1fr_auto] md:items-end">
        <p data-anim="hero-in" className="max-w-[30ch] text-lede text-ink">
          A record player built around one moment: the needle finding the groove.
        </p>
        <p
          data-anim="hero-in"
          className="flex items-center gap-3 font-display text-small text-ink-soft"
        >
          <span data-anim="hero-groove" aria-hidden="true" className="block h-px w-10 bg-current" />
          Side A, five tracks. Scroll to play.
        </p>
      </div>
    </section>
  );
}
