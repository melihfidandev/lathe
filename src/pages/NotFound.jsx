import { useEffect, useRef } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { motion } from "../animations/motion";
import { useMagnetic } from "../hooks/useMagnetic";
import { TRACKS } from "../content/tracks";
import Cursor from "../components/Cursor";

/**
 * 404 — "Not on this pressing". İstenen adres, B yüzüne basılmamış bir üçüncü parça olarak
 * listeye eklenir; süresi 4:04. Hata mesajı aynı zamanda gidilebilecek gerçek parçaları gösterir.
 */
export default function NotFound() {
  const root = useRef();
  const cta = useRef();
  useMagnetic(cta, { strength: 0.3 });

  const path = decodeURIComponent(window.location.pathname);
  const sideB = TRACKS.filter((t) => t.side === "B");

  useEffect(() => {
    document.title = "Not on this pressing — Lathe One";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.append(robots);
    return () => robots.remove();
  }, []);

  useGSAP(
    () => {
      motion({
        full: () => {
          // autoSplit yeniden bölerken onSplit'in döndürdüğünü öldürür → başlık kendi tween'i olmalı
          SplitText.create("[data-anim='nf-title']", {
            type: "lines",
            mask: "lines",
            aria: "none",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 105, duration: 1.2, stagger: 0.08, delay: 0.15 }),
          });
          gsap
            .timeline({ delay: 0.15 })
            .from("[data-anim='nf-in']", { opacity: 0, y: 20, duration: 1, stagger: 0.08 }, 0.35)
            .from("[data-anim='nf-row']", { opacity: 0, x: -16, duration: 0.8, stagger: 0.08 }, 0.4)
            // Basılmamış parça en son, yukarıdan düşer gibi gelir
            .from("[data-anim='nf-missing']", { opacity: 0, y: -18, duration: 0.9 }, 0.9)
            .from("[data-anim='nf-note']", { opacity: 0, duration: 0.6 }, 1.5);
        },
        reduced: () => {
          gsap.from("[data-anim^='nf']", { opacity: 0, duration: 0.5, stagger: 0.04 });
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex min-h-svh flex-col bg-stage text-ink">
      <header className="flex items-center justify-between px-gutter pt-[max(1rem,env(safe-area-inset-top))]">
        <a
          href="/"
          data-cursor="Side A"
          className="inline-flex min-h-11 items-center font-display text-2xl font-[750] tracking-[-0.03em] [font-stretch:80%]"
        >
          Lathe
        </a>
        <a
          href="/#pre-order"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/40 px-4 font-display text-small transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-stage"
        >
          Pre-order
        </a>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-12 px-gutter py-16 md:grid-cols-[1.05fr_1fr] md:items-end md:gap-16">
        <div className="grid justify-items-start gap-6">
          <p data-anim="nf-in" className="flex items-baseline gap-3 font-display text-small">
            <span className="tabular-nums opacity-60">404</span>
            <span className="font-[600]">Not on this pressing</span>
          </p>
          <h1
            data-anim="nf-title"
            className="font-display text-display font-[760] tracking-[-0.04em] text-balance"
          >
            That track isn’t on the record.
          </h1>
          <p data-anim="nf-in" className="max-w-[34ch] text-ink-soft">
            There’s no page at{" "}
            <span className="font-display font-[600] break-all text-ink">{path}</span>. Here’s what
            side B does have.
          </p>
          <a
            ref={cta}
            data-anim="nf-in"
            href="/"
            data-cursor="Play"
            className="inline-flex min-h-12 items-center rounded-full bg-label px-7 font-display font-[650] text-oxblood"
          >
            Play side A
          </a>
        </div>

        <section aria-labelledby="nf-side" className="font-display">
          <p id="nf-side" className="mb-3 text-small opacity-60">
            Side B
          </p>
          <ol>
            {sideB.map((t) => (
              <li key={t.id} data-anim="nf-row" className="border-t border-ink/15">
                <a
                  href={`/#${t.id}`}
                  data-cursor="Play"
                  className="group flex items-baseline gap-4 py-3"
                >
                  <span className="w-8 text-small tabular-nums opacity-60">{t.code}</span>
                  <span className="text-h2 font-[650] tracking-[-0.03em] [font-stretch:85%] transition-[font-stretch,color] duration-500 ease-out-expo group-hover:text-label group-hover:[font-stretch:100%] group-focus-visible:text-label">
                    {t.title}
                  </span>
                  <span className="leader" aria-hidden="true" />
                  <span className="text-small tabular-nums opacity-60">{t.time}</span>
                </a>
              </li>
            ))}
            <li data-anim="nf-missing" className="border-t border-ink/15 text-label">
              <div className="flex items-baseline gap-4 py-3">
                <span className="w-8 text-small tabular-nums">B3</span>
                <del className="min-w-0 text-h2 font-[650] tracking-[-0.03em] [overflow-wrap:anywhere] [font-stretch:75%] decoration-[3px]">
                  {path}
                </del>
                <span className="leader" aria-hidden="true" />
                <span className="text-small tabular-nums">4:04</span>
              </div>
              <p data-anim="nf-note" className="pb-3 pl-12 text-small">
                Not pressed. This record has two tracks on side B.
              </p>
            </li>
          </ol>
        </section>
      </main>

      <Cursor />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-60 overflow-clip">
        <div className="grain" />
      </div>
    </div>
  );
}
