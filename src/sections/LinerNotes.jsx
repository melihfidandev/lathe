import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { motion, softFade } from "../animations/motion";
import TrackHead from "../components/TrackHead";

// Plak kapağının arkasındaki parça listesi gibi: ad, noktalı çizgi, değer
const SPECS = [
  ["Drive", "Belt, 24-pole AC synchronous motor"],
  ["Speeds", "33⅓ and 45 rpm, switched electronically"],
  ["Platter", "4.2 kg machined aluminum"],
  ["Wow and flutter", "0.04%"],
  ["Signal to noise", "74 dB"],
  ["Tonearm", "9 in carbon fiber, gimbal bearing"],
  ["Cartridge", "Moving magnet, elliptical stylus"],
  ["Output", "Line or phono, switchable"],
  ["Plinth", "Solid wood over a 12 mm damping slab"],
  ["Size", "460 × 360 × 140 mm"],
  ["Weight", "11.5 kg"],
];

export default function LinerNotes() {
  const root = useRef();

  useGSAP(
    () => {
      motion({
        full: () => {
          gsap.from("[data-anim='liner-head'] > *", {
            y: 40,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: "top 60%" },
          });
          // Satırlar baskı makinesinden çıkıyormuş gibi: önce ad, sonra noktalar, sonra değer
          const rows = gsap.utils.toArray("[data-anim='spec']");
          rows.forEach((row) => {
            const [dt, leader, dd] = row.children;
            gsap
              .timeline({ scrollTrigger: { trigger: row, start: "top 92%" } })
              .from(dt, { opacity: 0, x: -16, duration: 0.7 })
              .from(
                leader,
                { scaleX: 0, transformOrigin: "left center", duration: 0.8, ease: "expo.inOut" },
                0.1,
              )
              .from(dd, { opacity: 0, x: 16, duration: 0.7 }, 0.45);
          });
        },
        reduced: () => softFade("[data-anim]", root.current),
      });
    },
    { scope: root },
  );

  return (
    <section
      id="liner-notes"
      ref={root}
      aria-labelledby="liner-title"
      className="relative flex min-h-[150svh] flex-col justify-end px-gutter pt-[40svh] pb-32 md:items-end md:justify-center md:pt-24 md:pb-36"
    >
      <div className="w-full md:max-w-[36rem]">
        <div data-anim="liner-head">
          <TrackHead code="B1" title="Liner notes" />
          <h2
            id="liner-title"
            className="mt-4 flex items-baseline gap-4 font-display text-h2 font-[650] tracking-[-0.03em]"
          >
            Lathe One
            <span className="font-display text-small font-[500] tracking-normal text-ink-soft">
              LTH-001
            </span>
          </h2>
          <p className="mt-4 max-w-[34em] text-body text-ink-soft">
            Designed and assembled in small batches. Every unit plays the same record for an hour on
            the bench before it’s boxed, and the person who listened signs the inside of the plinth.
          </p>
        </div>
        <dl className="mt-8 font-display text-small md:mt-10">
          {SPECS.map(([k, v]) => (
            <div key={k} data-anim="spec" className="flex items-baseline py-2">
              <dt className="shrink-0">{k}</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="text-right font-[600]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
