import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { scene, live } from "../lib/store";
import { FINISHES } from "../content/tracks";
import { needleDropSound, updateSound } from "../lib/sound";
import {
  recordTexture,
  grooveAnisotropyMap,
  woodTexture,
  strobeTexture,
  brushedRoughness,
  feltTexture,
} from "./textures";

// Geometri sabitleri — 1 birim ≈ 10 cm
const PLATE_Y = 0.45;
const CENTER = new THREE.Vector2(-0.5, 0);
const PIVOT = new THREE.Vector2(1.55, -1.15);
const ARM_L = CENTER.distanceTo(PIVOT);
const PSI_CENTER = Math.atan2(-(CENTER.y - PIVOT.y), CENTER.x - PIVOT.x);
const NOMINAL_RPM = 33.333;

/** İğnenin plak merkezine uzaklığından kol açısı (kosinüs teoremi) */
const thetaFor = (r) => Math.acos(THREE.MathUtils.clamp(1 - (r * r) / (2 * ARM_L * ARM_L), -1, 1));

const finishById = Object.fromEntries(FINISHES.map((f) => [f.id, f]));
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);

function PartLabel({ position, children, from = 0.55, align = "right", show = true }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.style.opacity = smooth(from, from + 0.3, scene.explode);
  });
  // Etiketler yalnızca masaüstünde; mobilde liste zaten metinde
  if (!show) return null;
  return (
    <Html position={position} zIndexRange={[5, 0]} className="pointer-events-none hidden md:block">
      <div
        ref={ref}
        aria-hidden="true"
        className={`flex items-center gap-2 font-display text-small whitespace-nowrap text-ink opacity-0 ${
          align === "left" ? "-translate-x-full flex-row-reverse" : ""
        }`}
      >
        <span className="h-px w-10 bg-ink/60" />
        {children}
      </div>
    </Html>
  );
}

export default function Turntable({ quality = "high", labels = true }) {
  const root = useRef();
  const groups = {
    slab: useRef(),
    wood: useRef(),
    motor: useRef(),
    bearing: useRef(),
    platter: useRef(),
    mat: useRef(),
    record: useRef(),
    recordSpin: useRef(),
    arm: useRef(),
    armYaw: useRef(),
    armLift: useRef(),
    led: useRef(),
  };
  const spin = useRef({ platter: 0, record: 0, recordRpm: 0, wasDown: false });

  const mats = useMemo(() => {
    const aluminum = new THREE.MeshStandardMaterial({
      color: "#b4b3af",
      metalness: 1,
      roughness: 0.44,
      envMapIntensity: 0.7,
      roughnessMap: brushedRoughness(),
    });
    const polished = new THREE.MeshStandardMaterial({
      color: "#cfceca",
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 0.85,
    });
    const strobe = new THREE.MeshStandardMaterial({
      map: strobeTexture(),
      metalness: 0.85,
      roughness: 0.3,
    });
    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture(),
      color: FINISHES[0].color,
      roughness: FINISHES[0].rough,
    });
    const slab = new THREE.MeshStandardMaterial({ color: "#1f1614", roughness: 0.92 });
    // Standart materyal: clearcoat'lu physical shader'ı bu boyuttaki parçada fark yaratmıyordu, derlemesi ağırdı
    const carbon = new THREE.MeshStandardMaterial({
      color: "#121212",
      roughness: 0.22,
      metalness: 0.2,
    });
    const felt = new THREE.MeshStandardMaterial({
      map: feltTexture(),
      color: "#5a1f25",
      roughness: 1,
    });
    const aniso = grooveAnisotropyMap();
    const vinyl = (side) =>
      new THREE.MeshPhysicalMaterial({
        map: recordTexture(side),
        roughness: 0.3,
        metalness: 0,
        specularIntensity: 0.35,
        envMapIntensity: 0.14,
        anisotropy: 0.9,
        anisotropyMap: aniso,
      });
    const edge = new THREE.MeshStandardMaterial({ color: "#070707", roughness: 0.4 });
    const led = new THREE.MeshStandardMaterial({
      color: "#f0b429",
      emissive: "#f0b429",
      emissiveIntensity: 0,
    });
    const motor = new THREE.MeshStandardMaterial({
      color: "#2b2b2b",
      metalness: 0.7,
      roughness: 0.45,
    });
    return {
      aluminum,
      polished,
      strobe,
      wood,
      slab,
      carbon,
      felt,
      edge,
      led,
      motor,
      sideA: vinyl("A"),
      sideB: vinyl("B"),
    };
  }, []);

  const targetColor = useMemo(() => new THREE.Color(), []);
  const segs = quality === "high" ? 128 : 72;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const e = scene.explode;
    const s = spin.current;

    if (root.current) root.current.rotation.y = scene.yaw;

    // Patlatılmış görünüm: her katman kendi yüksekliğine çıkar
    groups.slab.current.position.y = 0.35 * e;
    groups.wood.current.position.y = 0.95 * e;
    groups.motor.current.position.set(0.35 * e, 1.6 * e, 0.2 * e);
    groups.bearing.current.position.y = 2.05 * e;
    groups.platter.current.position.y = 2.5 * e;
    groups.mat.current.position.y = 3.0 * e;
    groups.arm.current.position.set(PIVOT.x + 0.55 * e, PLATE_Y + 1.45 * e, PIVOT.y);

    // Tabla: ağırdır, scroll hızına geç ve yumuşak tepki verir
    // Yukarı scroll = elle geri sarma: plak anında ters döner (scratch).
    // Bırakınca ağır tabla yavaşça 33⅓'e döner.
    const reversing = live.velocity < -0.5;
    const target = reversing
      ? THREE.MathUtils.clamp(live.velocity * 6, -160, 0)
      : THREE.MathUtils.clamp(NOMINAL_RPM + live.velocity * 1.5, 0, 140);
    live.rpm += (target - live.rpm) * (1 - Math.exp(-dt * (reversing ? 10 : 2.4)));
    const omega = (live.rpm / 60) * Math.PI * 2;
    s.platter -= omega * dt;
    groups.platter.current.rotation.y = s.platter;
    groups.mat.current.rotation.y = s.platter;

    // Plak: tablaya oturmuşsa onunla döner, kaldırılınca yavaşlar
    const seated = scene.lift < 0.03;
    s.recordRpm +=
      ((seated ? live.rpm : 0) - s.recordRpm) * (1 - Math.exp(-dt * (seated ? 6 : 1.5)));
    const flipSign = scene.flip > 0.5 ? -1 : 1;
    s.record -= (s.recordRpm / 60) * Math.PI * 2 * dt * flipSign;
    groups.recordSpin.current.rotation.y = s.record;
    const rec = groups.record.current;
    rec.position.y = PLATE_Y + 0.189 + scene.lift + 3.55 * e;
    rec.rotation.x = Math.PI * scene.flip;
    rec.rotation.z = Math.sin(Math.PI * scene.flip) * 0.12;

    // Kol: iğne yarıçapından açı, kaldırma ayrı eksende
    groups.armYaw.current.rotation.y = PSI_CENTER + thetaFor(scene.needle);
    groups.armLift.current.rotation.z = 0.1 * scene.armLift;

    // İğne plağa değdi mi?
    const down = scene.armLift < 0.04 && seated && scene.needle < 1.5 && e < 0.04;
    if (down && !s.wasDown) {
      live.burst = 1;
      needleDropSound();
    }
    s.wasDown = down;
    live.needleDown = down;
    live.burst *= Math.exp(-dt * 1.6);
    mats.led.emissiveIntensity += ((down ? 2.4 : 0.25) - mats.led.emissiveIntensity) * 0.08;

    const v = live.velocity;
    updateSound({ rate: live.rpm / NOMINAL_RPM, needleDown: down, reverse: v < -2 ? -v / 6 : 0 });

    // Konfigüratör: kaplama rengi yumuşakça geçer
    const f = finishById[live.finish];
    targetColor.set(f.color);
    mats.wood.color.lerp(targetColor, 0.06);
    mats.wood.roughness += (f.rough - mats.wood.roughness) * 0.06;
  });

  const cast = { castShadow: true, receiveShadow: true };

  return (
    <group ref={root}>
      {/* Ayaklar */}
      {[
        [-2.05, 1.42],
        [2.05, 1.42],
        [-2.05, -1.42],
        [2.05, -1.42],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -0.06, z]} material={mats.aluminum} {...cast}>
          <cylinderGeometry args={[0.24, 0.18, 0.12, 40]} />
        </mesh>
      ))}
      <PartLabel show={labels} position={[2.5, -0.06, 1.42]} from={0.75}>
        Spiked aluminum feet
      </PartLabel>

      {/* Sönümleme katmanı */}
      <group ref={groups.slab}>
        <mesh position={[0, 0.06, 0]} material={mats.slab} {...cast}>
          <boxGeometry args={[4.7, 0.12, 3.5]} />
        </mesh>
        <PartLabel show={labels} position={[2.55, 0.06, 0]} from={0.7}>
          12 mm damping slab
        </PartLabel>
      </group>

      {/* Ahşap gövde + alüminyum üst plaka + kontroller */}
      <group ref={groups.wood}>
        <RoundedBox
          args={[4.8, 0.3, 3.6]}
          radius={0.035}
          smoothness={4}
          position={[0, 0.27, 0]}
          material={mats.wood}
          {...cast}
        />
        <mesh position={[0, 0.435, 0]} material={mats.aluminum} {...cast}>
          <boxGeometry args={[4.62, 0.03, 3.42]} />
        </mesh>
        <mesh position={[-1.95, 0.475, 1.38]} material={mats.polished} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 48]} />
        </mesh>
        <mesh position={[-1.6, 0.47, 1.38]} material={mats.polished} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 40]} />
        </mesh>
        <mesh position={[-2.2, 0.46, 1.6]} material={mats.led}>
          <sphereGeometry args={[0.025, 16, 16]} />
        </mesh>
        <PartLabel show={labels} position={[2.6, 0.3, 0.4]} from={0.65}>
          Solid wood plinth
        </PartLabel>
      </group>

      {/* Motor */}
      <group ref={groups.motor}>
        <mesh position={[-1.85, 0.27, -1.2]} material={mats.motor} {...cast}>
          <cylinderGeometry args={[0.3, 0.3, 0.32, 48]} />
        </mesh>
        <mesh position={[-1.85, 0.47, -1.2]} material={mats.polished} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 32]} />
        </mesh>
        <PartLabel show={labels} position={[-2.2, 0.3, -1.2]} from={0.6} align="left">
          24-pole motor
        </PartLabel>
      </group>

      {/* Alt tabla ve yatak */}
      <group ref={groups.bearing}>
        <mesh position={[-0.5, 0.5, 0]} material={mats.polished} {...cast}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 64]} />
        </mesh>
        <PartLabel show={labels} position={[-1.1, 0.5, 0]} from={0.55} align="left">
          Sub-platter on an inverted bearing
        </PartLabel>
      </group>

      {/* Tabla */}
      <group ref={groups.platter} position-x={-0.5}>
        <mesh
          position={[0, 0.54, 0]}
          material={[mats.strobe, mats.aluminum, mats.aluminum]}
          {...cast}
        >
          <cylinderGeometry args={[1.55, 1.55, 0.14, segs]} />
        </mesh>
        <mesh position={[0, 0.7, 0]} material={mats.polished} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 16]} />
        </mesh>
      </group>
      <group position={[-0.5, 2.5, 0]}>
        <PartLabel show={labels} position={[1.65, 0.54, 0]} from={0.5}>
          4.2 kg platter with strobe ring
        </PartLabel>
      </group>

      {/* Keçe mat */}
      <group ref={groups.mat} position-x={-0.5}>
        <mesh position={[0, 0.62, 0]} material={mats.felt} receiveShadow>
          <cylinderGeometry args={[1.47, 1.47, 0.02, segs]} />
        </mesh>
      </group>
      <group position={[-0.5, 3.0, 0]}>
        <PartLabel show={labels} position={[1.55, 0.62, 0]} from={0.45}>
          Wool felt mat
        </PartLabel>
      </group>

      {/* Plak */}
      <group ref={groups.record} position={[-0.5, PLATE_Y + 0.189, 0]}>
        <group ref={groups.recordSpin}>
          <mesh material={[mats.edge, mats.sideA, mats.sideB]} {...cast}>
            <cylinderGeometry args={[1.5, 1.5, 0.018, segs]} />
          </mesh>
        </group>
        <PartLabel show={labels} position={[1.6, 0, 0]} from={0.4}>
          180 g record
        </PartLabel>
      </group>

      {/* Kol */}
      <group ref={groups.arm} position={[PIVOT.x, PLATE_Y, PIVOT.y]}>
        <mesh position={[0, 0.06, 0]} material={mats.polished} {...cast}>
          <cylinderGeometry args={[0.24, 0.26, 0.12, 48]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={mats.aluminum} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.24, 32]} />
        </mesh>
        <group ref={groups.armYaw} position={[0, 0.33, 0]}>
          <mesh material={mats.polished} castShadow>
            <sphereGeometry args={[0.1, 32, 16]} />
          </mesh>
          <group ref={groups.armLift}>
            {/* karbon tüp */}
            <mesh
              position={[(ARM_L - 0.2) / 2, 0, 0]}
              rotation-z={Math.PI / 2}
              material={mats.carbon}
              castShadow
            >
              <cylinderGeometry args={[0.028, 0.032, ARM_L - 0.2, 24]} />
            </mesh>
            {/* karşı ağırlık */}
            <mesh
              position={[-0.32, 0, 0]}
              rotation-z={Math.PI / 2}
              material={mats.polished}
              castShadow
            >
              <cylinderGeometry args={[0.12, 0.12, 0.24, 40]} />
            </mesh>
            {/* kafa ve kartuş */}
            <mesh position={[ARM_L - 0.1, -0.02, 0]} material={mats.aluminum} castShadow>
              <boxGeometry args={[0.3, 0.025, 0.15]} />
            </mesh>
            <mesh position={[ARM_L - 0.06, -0.075, 0]} material={mats.carbon} castShadow>
              <boxGeometry args={[0.18, 0.085, 0.1]} />
            </mesh>
            <mesh
              position={[ARM_L - 0.001, -0.125, 0]}
              rotation-z={Math.PI}
              material={mats.polished}
            >
              <coneGeometry args={[0.012, 0.03, 8]} />
            </mesh>
            {/* parmak kaldıracı */}
            <mesh
              position={[ARM_L - 0.12, 0.0, 0.13]}
              rotation-x={Math.PI / 2}
              material={mats.polished}
            >
              <cylinderGeometry args={[0.01, 0.01, 0.14, 8]} />
            </mesh>
          </group>
        </group>
        <PartLabel show={labels} position={[-0.15, 0.45, 0]} from={0.6} align="left">
          9 in carbon arm
        </PartLabel>
      </group>
    </group>
  );
}
