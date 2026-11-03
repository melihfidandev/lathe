import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";

/**
 * Preloader: boş bir lake diske torna ile oluk kesiliyor.
 * Spiral, gerçek yükleme ilerlemesine (font + 3D ilk kare) bağlı.
 */
const TURNS = 26;
const spiral = (() => {
  const pts = [];
  const steps = TURNS * 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * TURNS * Math.PI * 2;
    const r = 96 - t * 62;
    pts.push(`${(100 + Math.cos(a) * r).toFixed(2)},${(100 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join("L")}`;
})();

export default function Preloader({ ready, reduced, onDone }) {
  const root = useRef();
  const path = useRef();
  const count = useRef();
  const [len, setLen] = useState(0);
  const progress = useRef({ v: 0 });

  useEffect(() => {
    setLen(path.current.getTotalLength());
  }, []);

  // Yükleme bitene kadar %90'a yavaşça yaklaşır; hazır olunca tamamlanır
  useGSAP(
    () => {
      if (!len) return;
      gsap.set(path.current, { strokeDasharray: len, strokeDashoffset: len });
      const render = () => {
        const v = progress.current.v;
        path.current.style.strokeDashoffset = String(len * (1 - v));
        count.current.textContent = String(Math.round(v * 100)).padStart(2, "0");
      };
      gsap.to(progress.current, {
        v: 0.9,
        duration: reduced ? 0.4 : 2.2,
        ease: "power2.out",
        onUpdate: render,
      });
    },
    { dependencies: [len], scope: root },
  );

  useGSAP(
    () => {
      if (!ready || !len) return;
      const render = () => {
        path.current.style.strokeDashoffset = String(len * (1 - progress.current.v));
        count.current.textContent = String(Math.round(progress.current.v * 100)).padStart(2, "0");
      };
      gsap
        .timeline({ delay: reduced ? 0 : 0.5, onComplete: onDone })
        .to(progress.current, {
          v: 1,
          duration: reduced ? 0.2 : 0.7,
          ease: "power2.inOut",
          onUpdate: render,
          overwrite: true,
        })
        .to("[data-anim='preloader-copy']", {
          opacity: 0,
          y: reduced ? 0 : -12,
          duration: 0.4,
          ease: "power2.in",
        })
        .to(
          "[data-anim='preloader-disc']",
          reduced
            ? { opacity: 0, duration: 0.4 }
            : { scale: 1.6, opacity: 0, duration: 1.1, ease: "power3.in" },
          "<",
        )
        .to(
          root.current,
          { opacity: 0, duration: reduced ? 0.3 : 0.6, ease: "power1.out" },
          "-=0.4",
        );
    },
    { dependencies: [ready, len], scope: root },
  );

  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-oxblood text-paper"
    >
      <div className="flex flex-col items-center gap-10">
        <svg
          data-anim="preloader-disc"
          viewBox="0 0 200 200"
          className="w-[min(70vw,22rem)]"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="98" fill="#1a0709" />
          <circle cx="100" cy="100" r="98" fill="none" stroke="#3a1418" strokeWidth="1" />
          <path
            ref={path}
            d={spiral}
            fill="none"
            stroke="#ede6da"
            strokeOpacity="0.55"
            strokeWidth="0.45"
          />
          <circle cx="100" cy="100" r="32" fill="#f0b429" />
          <circle cx="100" cy="100" r="2.4" fill="#2a0d10" />
        </svg>
        <p data-anim="preloader-copy" className="flex items-baseline gap-3 font-display text-small">
          <span>Cutting the lacquer</span>
          <span ref={count} className="w-[2ch] tabular-nums">
            00
          </span>
        </p>
      </div>
    </div>
  );
}
