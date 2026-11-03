import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./lib/gsap";
import { scene, setUI, useUI } from "./lib/store";
import { startLenis, getLenis, scrollToTarget } from "./lib/lenis";
import { POSES } from "./animations/poses";
import { buildDirector } from "./animations/director";
import { useIsMobile, useReducedMotion } from "./hooks/useMediaQuery";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import NeedleNav from "./components/NeedleNav";
import Cursor from "./components/Cursor";
import Hero from "./sections/Hero";
import Platter from "./sections/Platter";
import Inside from "./sections/Inside";
import Arm from "./sections/Arm";
import Finishes from "./sections/Finishes";
import Flip from "./sections/Flip";
import LinerNotes from "./sections/LinerNotes";
import Preorder from "./sections/Preorder";
import Runout from "./sections/Runout";

const Scene = lazy(() => import("./three/Scene"));

const ARM = ["needle", "armLift", "lift"];
const omit = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

export default function App() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const introDone = useUI((s) => s.introDone);
  const [fontsReady, setFontsReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [preloaderGone, setPreloaderGone] = useState(false);
  const [introStart, setIntroStart] = useState(false);

  // Plak etiketi canvas'a yazıldığı için 3D, fontlar yüklenmeden kurulmaz
  useEffect(() => {
    Promise.all([
      document.fonts.load('750 100px "Bricolage Grotesque Variable"'),
      document.fonts.load('500 100px "Bricolage Grotesque Variable"'),
    ]).finally(() => setFontsReady(true));
  }, []);

  // Smooth scroll — azaltılmış harekette yerel scroll
  useEffect(() => {
    if (reduced) return;
    const stop = startLenis();
    getLenis().stop();
    return stop;
  }, [reduced]);

  // İntro bitene kadar scroll kilitli
  useEffect(() => {
    document.documentElement.style.overflow = introDone ? "" : "hidden";
    if (!introDone) return;
    getLenis()?.start();
    // /#pre-order gibi derin linkler (404 sayfasındaki parçalar): iğne indikten sonra o parçaya git
    const target = window.location.hash && document.querySelector(window.location.hash);
    if (target) setTimeout(() => scrollToTarget(target, { duration: 2.4 }), 400);
  }, [introDone]);

  const onSceneReady = useCallback(() => setSceneReady(true), []);

  /**
   * İntro: preloader'daki disk, tepeden görülen gerçek plağa dönüşür.
   * Plak tablaya süzülür, kamera geri çekilir, kol döner ve iğne iner.
   * App'in kendi context'inde kurulur — preloader unmount olunca geri alınmasın diye.
   */
  const onPreloaderDone = useCallback(() => {
    setPreloaderGone(true);
    setIntroStart(true);
  }, []);

  useGSAP(
    () => {
      if (!introStart) return;
      if (reduced) {
        gsap
          .timeline({ onComplete: () => setUI({ introDone: true }) })
          .set(scene, POSES.hero)
          .fromTo("#stage", { opacity: 0 }, { opacity: 1, duration: 0.5 });
        return;
      }
      const hero = POSES.hero;
      gsap
        .timeline()
        .to(scene, { ...omit(hero, ARM), duration: 3, ease: "power3.inOut" }, 0)
        .to(scene, { lift: 0, duration: 2.1, ease: "power2.inOut" }, 0.15)
        .to(scene, { needle: hero.needle, duration: 1.1, ease: "power2.inOut" }, 2.0)
        .to(scene, { armLift: 0, duration: 0.55, ease: "power2.in" }, 3.05)
        .add(() => setUI({ introDone: true }), 3.55);
    },
    { dependencies: [introStart] },
  );

  // Scroll koreografisi intro bittikten sonra kurulur
  useGSAP(
    () => {
      if (!introDone) return;
      buildDirector({ reduced });
      ScrollTrigger.refresh();
    },
    { dependencies: [introDone, reduced], revertOnUpdate: true },
  );

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] rounded-full bg-label px-4 py-2 font-display text-oxblood focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <div id="stage" className="pointer-events-none fixed inset-0 z-0 overflow-clip">
        {fontsReady && (
          <Suspense fallback={null}>
            <Scene
              onReady={onSceneReady}
              reduced={reduced}
              mobile={mobile}
              paused={sceneReady && !introStart}
            />
          </Suspense>
        )}
      </div>
      {/* Mobilde metin 3D'nin altında okunabilsin diye işlevsel bir zemin */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] h-[62svh] bg-linear-to-t from-stage from-35% via-stage/85 to-transparent md:hidden"
      />

      <Header />
      <main id="main" className="relative z-10">
        <Hero />
        <Platter />
        <Inside />
        <Arm />
        <Finishes />
        <Flip />
        <LinerNotes />
        <Preorder />
      </main>
      <div className="relative z-10">
        <Runout />
      </div>

      <NeedleNav />
      <Cursor />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-60 overflow-clip">
        <div className="grain" />
      </div>
      {!preloaderGone && (
        <Preloader ready={sceneReady} reduced={reduced} onDone={onPreloaderDone} />
      )}
    </>
  );
}
