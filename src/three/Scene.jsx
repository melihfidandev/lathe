import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { scene, live } from "../lib/store";
import Turntable from "./Turntable";
import { Beam, Dust } from "./Atmosphere";
import { AXIS, TOP } from "./constants";

function CameraRig({ parallax }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    const aspect = size.width / size.height;
    const portrait = aspect < 1;
    // Dar ekranda kamera geri çekilir ki pikap sığsın
    const k = portrait
      ? 1 + THREE.MathUtils.clamp((1 - aspect) / 0.55, 0, 1) * 1.2
      : aspect < 1.35
        ? 1.18
        : // Geniş ama alçak ekranlar (laptop + dock): HTML katmanı yer kaplar, sahne biraz geri çekilir
          THREE.MathUtils.clamp(860 / size.height, 1, 1.3);

    target.set(scene.tx, scene.ty, scene.tz);
    pos.set(scene.cx, scene.cy, scene.cz).sub(target).multiplyScalar(k).add(target);

    if (parallax) {
      const p = pointer.current;
      p.x += (live.pointerX - p.x) * (1 - Math.exp(-dt * 3));
      p.y += (live.pointerY - p.y) * (1 - Math.exp(-dt * 3));
      pos.x += p.x * 0.45;
      pos.y += p.y * 0.25;
    }

    camera.position.copy(pos);
    camera.lookAt(target);

    const sx = portrait ? 0 : scene.sx;
    const sy = portrait ? scene.sy : 0;
    camera.setViewOffset(
      size.width,
      size.height,
      -sx * size.width,
      sy * size.height,
      size.width,
      size.height,
    );
  });
  return null;
}

// Runout halkası: SVG'de metin yarıçapı 170, genişlik 400
const RING_RATIO = 170 / 400;
const PLINTH_CORNERS = [
  [-2.4, 0.45, -1.8],
  [2.4, 0.45, -1.8],
  [-2.4, 0.45, 1.8],
  [2.4, 0.45, 1.8],
];

/**
 * Runout'taki dönen yazı halkası HTML'de, pikap 3D'de. Halka her karede pikabın
 * ekrandaki gerçek merkezine ve boyutuna oturur — her ekran oranında tam ortada.
 */
function RunoutRing() {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const ring = document.querySelector("[data-anim='ring']");
    if (!ring) return;
    const box = ring.parentElement.getBoundingClientRect();
    if (box.top > size.height || box.bottom < 0) return;

    camera.updateMatrixWorld();
    const toScreen = (x, y, z) => {
      v.set(x, y, z).project(camera);
      return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height];
    };
    const [cx, cy] = toScreen(0, 0.3, 0);
    let radius = 0;
    for (const [x, y, z] of PLINTH_CORNERS) {
      const [px, py] = toScreen(x, y, z);
      radius = Math.max(radius, Math.hypot(px - cx, py - cy));
    }
    // translate yerine doğrudan sol üst köşe: GSAP'in giriş animasyonu translate'i piksele sabitliyor
    const width = (radius * 1.12) / RING_RATIO;
    ring.style.width = `${width}px`;
    ring.style.left = `${cx - box.left - width / 2}px`;
    ring.style.top = `${cy - box.top - width / 2}px`;
  });
  return null;
}

function Lights({ shadows }) {
  const spot = useRef();
  const rim = useRef();
  const { scene: three } = useThree();

  useEffect(() => {
    spot.current.target.position.set(AXIS.x, 0.4, 0);
    three.add(spot.current.target);
  }, [three]);

  useFrame(() => {
    spot.current.intensity = 46 * scene.beam + 5;
    rim.current.intensity = 2.2 + scene.beam * 1.4;
  });

  return (
    <>
      <ambientLight intensity={0.18} color="#ffe9d6" />
      <spotLight
        ref={spot}
        position={[AXIS.x, TOP, 0.35]}
        angle={0.46}
        penumbra={0.85}
        decay={2}
        color="#ffe3b8"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight ref={rim} position={[-4, 3, -6]} color="#ffb070" />
      <directionalLight position={[5, 2, 4]} intensity={0.35} color="#c9d6ff" />
    </>
  );
}

/**
 * Stüdyo ortamı: birkaç parlak panelden PMREM ile yansıma haritası.
 * drei'nin Environment'ı HDR yükleyicilerini de paketliyor; bizim dosyamız yok, gerek yok.
 */
function StudioEnvironment() {
  const { gl, scene: three } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new THREE.Scene();
    const panel = (w, h, position, rotation, color, intensity) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      room.add(mesh);
    };
    panel(8, 3, [0, 6, 0], [Math.PI / 2, 0, 0], "#fff4e6", 1.3);
    panel(6, 1, [-6, 2, 2], [0, Math.PI / 2, 0], "#ffd2a1", 0.8);
    panel(6, 0.6, [6, 1.5, -2], [0, -Math.PI / 2, 0], "#ffffff", 0.9);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 48),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffe8cc").multiplyScalar(0.7),
        side: THREE.DoubleSide,
      }),
    );
    ring.position.set(0, 3, -6);
    room.add(ring);

    const target = pmrem.fromScene(room, 0.04);
    three.environment = target.texture;
    return () => {
      three.environment = null;
      target.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    };
  }, [gl, three]);
  return null;
}

/**
 * Shader'lar ilk karede ana thread'de sırayla derlenirse açılışta uzun bir takılma olur.
 * compileAsync, KHR_parallel_shader_compile ile derlemeyi tarayıcının arka plan iş parçacıklarına verir;
 * bitene kadar render döngüsü kapalı tutulur (frameloop="never").
 */
function Precompile({ onDone }) {
  const { gl, scene: three, camera } = useThree();
  useEffect(() => {
    let alive = true;
    const done = () => alive && onDone();
    if (gl.compileAsync) gl.compileAsync(three, camera).then(done, done);
    else done();
    return () => {
      alive = false;
    };
  }, [gl, three, camera, onDone]);
  return null;
}

function ReadySignal({ onReady }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) onReady?.();
  });
  return null;
}

// Otomatik kalite: kare hızı düşerse çözünürlük kademeli iner; hâlâ yetmezse toz kapanır
const MAX_DPR = { mobile: 1.6, desktop: 2 };

export default function Scene({ onReady, reduced, mobile, paused }) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, mobile ? MAX_DPR.mobile : MAX_DPR.desktop);
  const [dpr, setDpr] = useState(maxDpr);
  const [lowPower, setLowPower] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const onCompiled = useMemo(() => () => setCompiled(true), []);

  // Derleme bitene kadar ve preloader sahneyi örterken çizim yok (pil + açılış akıcılığı).
  // Sekme arka plandayken tarayıcı rAF'ı zaten durdurur.
  const frameloop = !compiled || paused ? "never" : "always";

  return (
    <Canvas
      className="!fixed inset-0 !h-svh !w-full"
      frameloop={frameloop}
      dpr={dpr}
      shadows={mobile ? false : "percentage"}
      camera={{ fov: 30, near: 0.1, far: 80, position: [scene.cx, scene.cy, scene.cz] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <CameraRig parallax={!reduced && !mobile} />
      <RunoutRing />
      <Lights shadows={!mobile} />
      <StudioEnvironment />

      <Turntable quality={mobile ? "low" : "high"} labels={!mobile} />
      <Beam />
      <Dust count={reduced || lowPower ? 0 : mobile ? 260 : 700} />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.121} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.45} color="#0d0304" />
      </mesh>

      <Precompile onDone={onCompiled} />
      <ReadySignal onReady={onReady} />
      <PerformanceMonitor
        bounds={() => [45, 58]}
        flipflops={3}
        // 0.25'lik kademeler: her küçük dalgalanmada canvas yeniden boyutlanmasın
        onChange={({ factor }) => setDpr(Math.round((1 + (maxDpr - 1) * factor) * 4) / 4)}
        onFallback={() => {
          setDpr(1);
          setLowPower(true);
        }}
      />
    </Canvas>
  );
}
