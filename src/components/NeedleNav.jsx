import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { setUI, useUI } from "../lib/store";
import { TRACKS } from "../content/tracks";
import { getLenis, scrollToTarget } from "../lib/lenis";
import { useMagnetic } from "../hooks/useMagnetic";

const LABELS = {
  flip: { code: "↻", title: "Flip the record" },
  runout: { code: "∞", title: "Runout groove" },
};

/**
 * İğne navigasyonu: küçük bir pikap. Kolu sayfanın ilerlemesini gösterir,
 * tıklanınca parça listesi (menü) açılır.
 */
export default function NeedleNav() {
  const track = useUI((s) => s.track);
  const introDone = useUI((s) => s.introDone);
  const arm = useRef();
  const disc = useRef();
  const button = useRef();
  const dialog = useRef();
  const closeButton = useRef();
  const [open, setOpen] = useState(false);
  useMagnetic(button, { strength: 0.2 });
  useMagnetic(closeButton, { strength: 0.3 });

  const current = TRACKS.find((t) => t.id === track) || LABELS[track] || TRACKS[0];

  // Kol açısı = sayfa ilerlemesi (17° dış kenar → 34° etiket)
  useEffect(() => {
    // quickTo: her karede yeni tween yaratmak yerine tek bir tween'in hedefi güncellenir
    gsap.set(arm.current, { svgOrigin: "64 8" });
    const rotate = gsap.quickTo(arm.current, "rotation", { duration: 0.6, ease: "power2.out" });
    let last = -1;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const angle = introDone ? 17 + p * 17 : 0;
      if (Math.abs(angle - last) < 0.01) return;
      last = angle;
      rotate(angle);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [introDone]);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(disc.current, {
      rotation: 360,
      duration: 1.8,
      repeat: -1,
      ease: "none",
      svgOrigin: "32 38",
    });
  });

  useGSAP(
    () => {
      if (!open) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.fromTo(
        "[data-anim='tracklist-row']",
        reduced ? { opacity: 0 } : { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: reduced ? 0.3 : 0.9, stagger: 0.05, ease: "expo.out" },
      );
      gsap.fromTo(
        dialog.current,
        { clipPath: "circle(0% at 92% 92%)" },
        {
          clipPath: "circle(150% at 92% 92%)",
          duration: reduced ? 0.01 : 0.9,
          ease: "power3.inOut",
        },
      );
    },
    { dependencies: [open], scope: dialog },
  );

  const show = () => {
    dialog.current.showModal();
    getLenis()?.stop();
    setOpen(true);
    setUI({ menuOpen: true });
  };
  const close = () => {
    dialog.current.close();
  };
  const onClose = () => {
    getLenis()?.start();
    setOpen(false);
    setUI({ menuOpen: false });
  };

  const go = (id) => {
    // Lenis liste açıkken durdurulmuş; close olayı gelmeden scroll komutu yok sayılmasın
    getLenis()?.start();
    close();
    scrollToTarget(`#${id}`, { duration: 2.2 });
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        data-cursor="Tracklist"
        className="fixed right-gutter bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-full py-1 pr-1 pl-4 text-ink"
      >
        <span className="hidden flex-col items-end text-right font-display leading-tight sm:flex">
          <span className="text-small tabular-nums opacity-70">{current.code}</span>
          <span className="text-small font-[600]">{current.title}</span>
        </span>
        <span className="sr-only">
          Now playing {current.code} {current.title}. Open the tracklist
        </span>
        <svg viewBox="0 0 72 72" className="size-16" aria-hidden="true">
          <circle cx="36" cy="36" r="35" fill="currentColor" opacity="0.08" />
          <g ref={disc}>
            <circle cx="32" cy="38" r="26" fill="#060606" />
            <circle cx="32" cy="38" r="20" fill="none" stroke="#2c2c2c" strokeWidth="0.6" />
            <circle cx="32" cy="38" r="15" fill="none" stroke="#2c2c2c" strokeWidth="0.6" />
            <circle cx="32" cy="38" r="9" fill="#f0b429" />
            <rect x="31" y="30" width="2" height="4" fill="#2a0d10" />
          </g>
          <g ref={arm}>
            <line
              x1="64"
              y1="8"
              x2="64"
              y2="52"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="61.5" y="50" width="5" height="6" rx="1" fill="currentColor" />
            <circle cx="64" cy="8" r="4" fill="currentColor" />
          </g>
        </svg>
      </button>

      <dialog
        ref={dialog}
        onClose={onClose}
        aria-labelledby="tracklist-title"
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-oxblood-deep p-0 text-paper backdrop:bg-transparent"
      >
        <div className="flex min-h-full flex-col pb-10">
          {/* Üst satır ana sayfa header'ıyla birebir aynı hizada: logo → başlık, Pre-order → Close */}
          <div className="flex items-center justify-between px-gutter pt-[max(1rem,env(safe-area-inset-top))]">
            <h2
              id="tracklist-title"
              className="font-display text-2xl font-[750] tracking-[-0.03em] [font-stretch:80%]"
            >
              Lathe One
            </h2>
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              data-cursor="Close"
              className="inline-flex min-h-11 items-center rounded-full border border-paper/40 px-4 font-display text-small hover:bg-paper hover:text-oxblood"
            >
              Close
            </button>
          </div>
          <div className="mx-auto mt-[10vh] grid w-full max-w-6xl gap-12 px-gutter md:grid-cols-2 md:gap-16">
            {["A", "B"].map((side) => (
              <section key={side} aria-label={`Side ${side}`} className="flex flex-col">
                <p className="mb-4 font-display text-small opacity-60">Side {side}</p>
                <ol>
                  {TRACKS.filter((t) => t.side === side).map((t) => (
                    <li key={t.id} className="overflow-clip border-t border-paper/15">
                      <a
                        href={`#${t.id}`}
                        data-anim="tracklist-row"
                        data-cursor="Play"
                        onClick={(e) => {
                          e.preventDefault();
                          go(t.id);
                        }}
                        className="group flex items-baseline gap-4 py-3 font-display md:py-4"
                      >
                        <span className="w-8 text-small tabular-nums opacity-60">{t.code}</span>
                        <span className="text-h2 font-[650] tracking-[-0.03em] [font-stretch:85%] transition-[font-stretch,color] duration-500 ease-out-expo group-hover:text-label group-hover:[font-stretch:100%] group-focus-visible:text-label">
                          {t.title}
                        </span>
                        <span className="leader hidden sm:block" />
                        <span className="ml-auto text-small tabular-nums opacity-60">{t.time}</span>
                      </a>
                    </li>
                  ))}
                </ol>
                {/* B sütunu A'nın boyuna esner; künye en alta oturur → A'nın son satırıyla aynı hizada */}
                {side === "B" && (
                  <p className="mt-8 text-right text-small opacity-60 md:mt-auto">
                    A concept record player by Melih Fidan.
                    <br />
                    Each track is a part of the page.
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
