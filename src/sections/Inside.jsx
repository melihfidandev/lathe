import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { motion } from "../animations/motion";
import TrackHead from "../components/TrackHead";

// Yukarıdan aşağı, 3D'deki katman sırasıyla aynı
const PARTS = [
  ["Record", "180 g, pressed flat so the stylus never rides a warp."],
  ["Felt mat", "Pure wool. Kills static and the ring of bare metal."],
  ["Platter", "4.2 kg of machined aluminum with a strobe ring."],
  ["Sub-platter", "Spins on an inverted bearing with a ceramic ball."],
  ["Arm", "Carbon fiber on a gimbal bearing."],
  ["Motor", "24-pole synchronous, mounted on its own rubber island."],
  ["Plinth", "Solid wood, 30 mm thick, joined without screws."],
  ["Damping slab", "12 mm of dense polymer between the wood and the shelf."],
  ["Feet", "Spiked aluminum cones that drain vibration downward."],
];

export default function Inside() {
  const root = useRef();

  useGSAP(
    () => {
      // Metin her zaman okunur kalır; "yanan" şey satırın üstündeki çizgi
      const lines = gsap.utils.toArray("[data-anim='part-line']");
      motion({
        full: () => {
          gsap.from("[data-anim='inside-head'] > *", {
            yPercent: 40,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: "top 60%" },
          });
          // Pikap ayrıldıkça liste satır satır yanar — 3D ile aynı scroll aralığı
          gsap
            .timeline({
              scrollTrigger: {
                trigger: root.current,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            })
            .fromTo(
              lines,
              { scaleX: 0 },
              { scaleX: 1, stagger: 0.07, duration: 0.2, ease: "power2.out" },
            )
            .to({}, { duration: 0.2 });
        },
        reduced: () => {
          gsap.from(lines, {
            opacity: 0,
            duration: 0.4,
            stagger: 0.04,
            scrollTrigger: { trigger: root.current, start: "top top" },
          });
        },
      });
    },
    { scope: root },
  );

  return (
    <section id="inside" ref={root} aria-labelledby="inside-title" className="relative h-[340svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-end px-gutter pt-24 pb-28 md:justify-center md:pb-0">
        <div className="md:max-w-[40rem]">
          <div data-anim="inside-head">
            <TrackHead code="A3" title="Inside" />
            <h2
              id="inside-title"
              className="mt-4 font-display text-h2 font-[650] tracking-[-0.03em]"
            >
              Nine parts, one job
            </h2>
            <p className="mt-4 max-w-[32em] text-body text-ink-soft">
              Everything between the motor and the needle is there to keep vibration out of the
              groove. Keep scrolling to take it apart.
            </p>
          </div>
          <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 md:mt-8 md:grid-cols-3 md:gap-x-6 md:gap-y-3">
            {PARTS.map(([name, note]) => (
              <li key={name} className="relative border-t border-ink/15 pt-2">
                <span
                  data-anim="part-line"
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-0.5 w-full origin-left bg-label"
                />
                <p className="font-display text-small font-[600]">{name}</p>
                <p className="hidden text-small text-ink-soft md:[@media(min-height:860px)]:block">
                  {note}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
