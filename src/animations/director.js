import { gsap, ScrollTrigger } from "../lib/gsap";
import { scene, setUI } from "../lib/store";
import { POSES } from "./poses";
import { TRACKS } from "../content/tracks";

const ARM_KEYS = ["needle", "armLift"];
const EARLY_KEYS = ["explode"];

const DARK = { "--stage": "#2a0d10", "--ink": "#ede6da" };
const LIGHT = { "--stage": "#d8d6d0", "--ink": "#2a0d10" };

const pick = (pose, keys) => Object.fromEntries(keys.map((k) => [k, pose[k]]));
const omit = (pose, keys) =>
  Object.fromEntries(Object.entries(pose).filter(([k]) => !keys.includes(k)));

/**
 * Bir pozdan diğerine geçiş. Kol gerçek bir pikap gibi davranır:
 * kalkacaksa önce kalkar sonra döner; inecekse önce yerine döner sonra iner.
 */
function poseTween(tl, from, to, at = 0, span = 1) {
  const skip = [...ARM_KEYS, ...EARLY_KEYS];
  tl.fromTo(
    scene,
    omit(from, skip),
    { ...omit(to, skip), duration: span, ease: "power2.inOut", immediateRender: false },
    at,
  );
  // Katmanlar kamera yaklaşmadan önce birleşir; aksi hâlde kamera gövdenin içinden geçer
  const collapsing = to.explode < from.explode;
  tl.fromTo(
    scene,
    { explode: from.explode },
    {
      explode: to.explode,
      duration: collapsing ? span * 0.45 : span,
      ease: "power2.inOut",
      immediateRender: false,
    },
    at,
  );
  const raising = to.armLift > from.armLift;
  const lowering = to.armLift < from.armLift;
  const lift = { duration: span * 0.3, ease: "power1.inOut", immediateRender: false };
  const swing = {
    duration: lowering || raising ? span * 0.7 : span,
    ease: "power2.inOut",
    immediateRender: false,
  };
  if (raising) {
    tl.fromTo(scene, { armLift: from.armLift }, { armLift: to.armLift, ...lift }, at);
    tl.fromTo(scene, { needle: from.needle }, { needle: to.needle, ...swing }, at + span * 0.3);
  } else if (lowering) {
    tl.fromTo(scene, { needle: from.needle }, { needle: to.needle, ...swing }, at);
    tl.fromTo(scene, { armLift: from.armLift }, { armLift: to.armLift, ...lift }, at + span * 0.7);
  } else {
    tl.fromTo(scene, pick(from, ARM_KEYS), { ...pick(to, ARM_KEYS), ...swing }, at);
  }
  return tl;
}

/** Azaltılmış hareket: kamera uçmaz, sahne kısa bir karartmayla yeni poza geçer */
function crossfade(tl, to, extra) {
  const stage = document.getElementById("stage");
  tl.to(stage, { opacity: 0, duration: 0.25, ease: "power1.in" });
  tl.set(scene, { ...to });
  if (extra) tl.set(document.documentElement, extra);
  tl.to(stage, { opacity: 1, duration: 0.35, ease: "power1.out" });
  return tl;
}

/** A3: pikap scroll'la katmanlarına ayrılır */
function buildInside({ reduced }) {
  if (reduced) {
    const tl = gsap.timeline({ paused: true });
    crossfade(tl, POSES.insideOpen);
    ScrollTrigger.create({
      trigger: "#inside",
      start: "top top",
      onEnter: () => tl.play(),
      onLeaveBack: () => {
        tl.pause(0);
        gsap.set(scene, POSES.inside);
      },
    });
  } else {
    gsap
      .timeline({
        scrollTrigger: { trigger: "#inside", start: "top top", end: "bottom bottom", scrub: true },
      })
      .fromTo(
        scene,
        { explode: 0, yaw: POSES.inside.yaw },
        {
          explode: 1,
          yaw: POSES.insideOpen.yaw,
          duration: 0.8,
          ease: "power2.inOut",
          immediateRender: false,
        },
      )
      .to({}, { duration: 0.2 });
  }
}

/** ↻ Plağı çevir: kalkar, havada döner, kamera etrafından dolaşır, sahne açık renge geçer */
function buildFlip({ reduced, root }) {
  const flipCard = document.querySelector("[data-anim='flip-card']");
  if (reduced) {
    const tl = gsap.timeline({ paused: true });
    crossfade(tl, POSES.flipped, LIGHT);
    tl.set(flipCard, { rotateX: 180 }, 0.25);
    ScrollTrigger.create({
      trigger: "#flip",
      start: "top top",
      onEnter: () => tl.play(),
      onLeaveBack: () => {
        tl.pause(0);
        gsap.set(scene, POSES.flip);
        gsap.set(root, DARK);
        gsap.set(flipCard, { rotateX: 0 });
      },
    });
  } else {
    const ni = { immediateRender: false };
    gsap
      .timeline({
        scrollTrigger: { trigger: "#flip", start: "top top", end: "bottom bottom", scrub: true },
      })
      .fromTo(scene, { lift: 0 }, { lift: 1.9, duration: 0.3, ease: "power2.out", ...ni }, 0)
      .fromTo(scene, { flip: 0 }, { flip: 1, duration: 0.4, ease: "power2.inOut", ...ni }, 0.25)
      .fromTo(scene, { lift: 1.9 }, { lift: 0, duration: 0.3, ease: "power2.in", ...ni }, 0.62)
      .fromTo(
        scene,
        { cx: POSES.flip.cx },
        { cx: POSES.flipped.cx, duration: 0.8, ease: "power1.inOut", ...ni },
        0.1,
      )
      .fromTo(
        flipCard,
        { rotateX: 0 },
        { rotateX: 180, duration: 0.4, ease: "power2.inOut", ...ni },
        0.25,
      )
      .fromTo(root, DARK, { ...LIGHT, duration: 0.2, ease: "none", ...ni }, 0.4)
      .to({}, { duration: 0.08 });
  }
}

// Sayfa sırasıyla — sıra önemli: atlamalı scroll'da sonra oluşturulan tetikleyici kazanır
const STEPS = [
  { trigger: "#platter", from: "hero", to: "platter" },
  { trigger: "#inside", from: "platter", to: "inside" },
  { build: buildInside },
  { trigger: "#the-arm", from: "insideOpen", to: "arm" },
  { trigger: "#finishes", from: "arm", to: "finishes" },
  { trigger: "#flip", from: "finishes", to: "flip" },
  { build: buildFlip },
  { trigger: "#liner-notes", from: "flipped", to: "liner" },
  { trigger: "#pre-order", from: "liner", to: "preorder" },
  { trigger: "#runout", from: "preorder", to: "runout", colors: [LIGHT, DARK] },
];

export function buildDirector({ reduced }) {
  const root = document.documentElement;

  STEPS.forEach(({ trigger, from, to, colors, build }) => {
    if (build) return build({ reduced, root });
    if (reduced) {
      const tl = gsap.timeline({ paused: true });
      crossfade(tl, POSES[to], colors?.[1]);
      ScrollTrigger.create({
        trigger,
        start: "top 60%",
        onEnter: () => tl.play(),
        onLeaveBack: () => {
          tl.pause(0);
          gsap.set(scene, POSES[from]);
          if (colors) gsap.set(root, colors[0]);
        },
      });
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: { trigger, start: "top bottom", end: "top top", scrub: true },
    });
    poseTween(tl, POSES[from], POSES[to]);
    if (colors)
      tl.fromTo(root, colors[0], { ...colors[1], duration: 0.5, immediateRender: false }, 0.3);
  });

  // Hangi parçadayız? (iğne navigasyonu için)
  TRACKS.forEach(({ id }) => {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setUI({ track: id }),
    });
  });
  ScrollTrigger.create({
    trigger: "#flip",
    start: "top 55%",
    end: "bottom 55%",
    onToggle: (self) => self.isActive && setUI({ track: "flip" }),
  });
  ScrollTrigger.create({
    trigger: "#runout",
    start: "top 55%",
    onToggle: (self) => self.isActive && setUI({ track: "runout" }),
  });
}
