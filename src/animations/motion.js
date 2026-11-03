import { gsap } from "../lib/gsap";

/**
 * Her animasyonun iki versiyonu: tam (awards) ve azaltılmış.
 * full/reduced fonksiyonları useGSAP kapsamında çalışır, temizlik otomatik.
 */
export function motion({ full, reduced }) {
  const mm = gsap.matchMedia();
  mm.add(
    {
      full: "(prefers-reduced-motion: no-preference)",
      reduce: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 768px)",
    },
    (ctx) => {
      const { full: isFull, desktop } = ctx.conditions;
      if (isFull) return full?.({ desktop });
      return reduced?.({ desktop });
    },
  );
  return mm;
}

/** Azaltılmış harekette standart: yerinde, kısa fade */
export const softFade = (targets, trigger, extra = {}) =>
  gsap.from(targets, {
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: "power1.out",
    scrollTrigger: { trigger, start: "top 75%" },
    ...extra,
  });
