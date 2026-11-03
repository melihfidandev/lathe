/**
 * ↻ Plağı çevir — imza geçiş. Kart, 3D plakla aynı scroll aralığında X ekseninde döner.
 * Animasyon director.js'teki tek timeline'da, 3D ile senkron.
 */
export default function Flip() {
  return (
    <section id="flip" aria-label="Flip the record" className="relative h-[300svh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-end px-gutter pb-32 [perspective:1400px] md:justify-end md:pb-[12svh]">
        <div data-anim="flip-card" className="relative grid [transform-style:preserve-3d]">
          <p className="col-start-1 row-start-1 font-display text-poster font-[760] tracking-[-0.045em] [backface-visibility:hidden]">
            Side A
          </p>
          <p
            aria-hidden="true"
            className="col-start-1 row-start-1 [transform:rotateX(180deg)] font-display text-poster font-[760] tracking-[-0.045em] [backface-visibility:hidden]"
          >
            Side B
          </p>
        </div>
        <p className="mt-4 font-display text-small text-ink-soft">Two tracks left. Turn it over.</p>
      </div>
    </section>
  );
}
