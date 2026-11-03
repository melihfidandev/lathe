import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "../lib/gsap";
import { motion, softFade } from "../animations/motion";
import TrackHead from "../components/TrackHead";

const SPECS = [
  ["Effective length", "229 mm"],
  ["Tracking force", "1.8 g"],
  ["Effective mass", "11 g"],
  ["Cartridge", "Moving magnet, elliptical stylus"],
];

export default function Arm() {
  const root = useRef();

  useGSAP(
    () => {
      motion({
        full: () => {
          // Kelimeler kol gibi bir pivot etrafında süpürülerek yerine oturur
          SplitText.create("[data-anim='arm-title']", {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.words, {
                rotate: -24,
                xPercent: 40,
                opacity: 0,
                transformOrigin: "120% -200%",
                duration: 1.5,
                stagger: 0.09,
                scrollTrigger: { trigger: root.current, start: "top 60%" },
              }),
          });
          gsap.from("[data-anim='arm-copy']", {
            opacity: 0,
            y: 30,
            duration: 1.2,
            scrollTrigger: { trigger: root.current, start: "top 45%" },
          });
          gsap.from("[data-anim='arm-spec']", {
            clipPath: "inset(0 100% 0 0)",
            duration: 1.1,
            stagger: 0.1,
            ease: "expo.inOut",
            scrollTrigger: { trigger: "[data-anim='arm-specs']", start: "top 85%" },
          });
        },
        reduced: () => softFade("[data-anim]", root.current),
      });
    },
    { scope: root },
  );

  return (
    <section
      id="the-arm"
      ref={root}
      aria-labelledby="arm-title"
      className="relative flex min-h-[140svh] flex-col justify-end overflow-x-clip px-gutter pb-32 md:items-end md:justify-center md:py-32"
    >
      <div className="w-full md:max-w-[32rem]">
        <TrackHead code="A4" title="The arm" />
        <h2
          id="arm-title"
          data-anim="arm-title"
          className="mt-4 font-display text-display font-[720] tracking-[-0.04em] [font-stretch:82%]"
        >
          Nine inches of carbon
        </h2>
        <p data-anim="arm-copy" className="mt-6 max-w-[34em] text-body text-ink-soft">
          The arm tube is wound from carbon fiber, stiff where it needs to be and lighter than a
          pencil. It pivots on a gimbal bearing with no measurable play, so the stylus can follow a
          groove narrower than a hair.
        </p>
        <dl data-anim="arm-specs" className="mt-8 font-display text-small">
          {SPECS.map(([k, v]) => (
            <div
              key={k}
              data-anim="arm-spec"
              className="flex items-baseline border-t border-ink/15 py-2.5"
            >
              <dt className="text-ink-soft">{k}</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-[600]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
