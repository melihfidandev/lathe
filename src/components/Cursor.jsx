import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../lib/gsap";
import { useFinePointer, useReducedMotion } from "../hooks/useMediaQuery";
import { live, useUI } from "../lib/store";

/**
 * İmleç bir iğne ucu gibi: nokta anında takip eder, halka gecikmeyle gelir.
 * [data-cursor] olan elemanlarda halka büyür ve ne olacağını söyler.
 */
export default function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const menuOpen = useUI((s) => s.menuOpen);
  const dot = useRef();
  const ring = useRef();
  const label = useRef();

  useEffect(() => {
    const onMove = (e) => {
      live.clientX = e.clientX;
      live.clientY = e.clientY;
      live.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      live.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // menuOpen değişince imleç yeni kaba taşınır (yeni DOM düğümleri) → yeniden bağlanır
  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");
    // Ortalama GSAP yüzdeleriyle: CSS translate'i GSAP piksele sabitler, halka büyüyünce merkez kayardı
    gsap.set([dot.current, ring.current], {
      xPercent: -50,
      yPercent: -50,
      x: live.clientX,
      y: live.clientY,
      opacity: live.clientX < 0 ? 0 : 1,
    });
    gsap.set(ring.current, { borderColor: menuOpen ? "var(--color-paper)" : "var(--ink)" });
    const lag = reduced ? 0.01 : 0.55;
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(ring.current, "x", { duration: lag, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: lag, ease: "power3" });
    let active = null;

    const move = (e) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3, overwrite: "auto" });
    };
    const over = (e) => {
      const el = e.target.closest("[data-cursor], a, button, label, input");
      if (el === active) return;
      active = el;
      const text = el?.getAttribute("data-cursor") || "";
      // Parça listesinin zemini her zaman koyu; sayfanın ink rengi B yüzünde koyu olabilir
      const idle = e.target.closest("dialog") ? "var(--color-paper)" : "var(--ink)";
      label.current.textContent = text;
      gsap.to(ring.current, {
        width: el ? (text ? 88 : 52) : 34,
        height: el ? (text ? 88 : 52) : 34,
        backgroundColor: text ? "var(--color-label)" : "rgba(0,0,0,0)",
        borderColor: text ? "var(--color-label)" : idle,
        duration: 0.45,
        ease: "expo.out",
      });
      gsap.to(label.current, { opacity: text ? 1 : 0, duration: 0.25 });
      gsap.to(dot.current, { scale: el ? 0 : 1, duration: 0.3 });
    };
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 });
    const down = () => gsap.to(ring.current, { scale: 0.82, duration: 0.15 });
    const up = () =>
      gsap.to(ring.current, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [fine, reduced, menuOpen]);

  if (!fine) return null;

  /*
   * Parça listesi <dialog showModal> ile tarayıcının "top layer"ına çıkar; z-index ne olursa olsun
   * sayfadaki her şeyin üstündedir. Liste açıkken imleç dialog'un içine taşınır ki görünsün.
   */
  const container = (menuOpen && document.querySelector("dialog[open]")) || document.body;

  return createPortal(
    <div aria-hidden="true" data-cursor-root className="pointer-events-none fixed inset-0 z-[70]">
      <div
        ref={ring}
        className="fixed top-0 left-0 grid size-[34px] place-items-center rounded-full border border-ink opacity-0"
      >
        <span
          ref={label}
          className="font-display text-[0.8125rem] font-[600] text-oxblood opacity-0"
        />
      </div>
      <div ref={dot} className="fixed top-0 left-0 size-1.5 rounded-full bg-label opacity-0" />
    </div>,
    container,
  );
}
