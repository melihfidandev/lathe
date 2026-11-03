import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scene, live } from "../lib/store";

import { AXIS, TOP, BOTTOM } from "./constants";

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform float uSize;
  uniform vec3 uAxis;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.07 + aSeed * 40.0;
    p.x += sin(t * 1.3 + aSeed * 7.0) * 0.3;
    p.z += cos(t * 1.1 + aSeed * 5.0) * 0.3;
    // çok yavaş süzülerek iner, tepeye sarar
    p.y = ${BOTTOM.toFixed(2)} + mod(p.y - ${BOTTOM.toFixed(2)} - uTime * 0.025 * (0.4 + aSeed), ${(TOP - BOTTOM - 0.4).toFixed(2)});

    // iğne inişi: plağın yüzeyinden yukarı doğru bir nefes
    vec3 fromRecord = p - vec3(uAxis.x, ${BOTTOM.toFixed(2)}, uAxis.z);
    float near = exp(-length(fromRecord) * 0.9);
    p += normalize(fromRecord + vec3(0.0, 0.4, 0.0)) * uBurst * 1.4 * near;

    float h = clamp((${TOP.toFixed(1)} - p.y) / ${(TOP - BOTTOM).toFixed(2)}, 0.0, 1.0);
    float coneR = mix(0.12, 2.0, h);
    float rr = length(p.xz - uAxis.xz);
    float inBeam = 1.0 - smoothstep(coneR * 0.55, coneR * 1.05, rr);
    vAlpha = (0.08 + 0.92 * inBeam) * (0.55 + 0.45 * sin(uTime * 1.7 + aSeed * 50.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.45 + aSeed * 0.9) / -mv.z;
  }
`;

const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(vNormalV, vViewDir));
    float edge = pow(facing, 2.2);
    float fall = smoothstep(0.0, 0.25, vUv.y) * (0.35 + 0.65 * vUv.y);
    gl_FragColor = vec4(uColor, edge * fall * uOpacity);
  }
`;

/** Toz zerreleri: deterministik (tohumlu) rastgelelik, render saf kalsın diye bileşen dışında */
function dustGeometry(count) {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 2.4;
    pos[i * 3] = AXIS.x + Math.cos(a) * r;
    pos[i * 3 + 1] = BOTTOM + rnd() * (TOP - BOTTOM);
    pos[i * 3 + 2] = AXIS.z + Math.sin(a) * r;
    seeds[i] = rnd();
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return g;
}

export function Dust({ count = 700 }) {
  const geometry = useMemo(() => dustGeometry(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBurst: { value: 0 },
      uSize: { value: 70 },
      uAxis: { value: AXIS },
      uColor: { value: new THREE.Color("#ffe2a8") },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock, gl }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uBurst.value = live.burst;
    uniforms.uSize.value = 70 * gl.getPixelRatio();
    // toz sadece patlatılmış görünümde ve huzme kısıkken söner
    uniforms.uOpacity.value = scene.beam * (1 - scene.explode * 0.7);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Beam() {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color("#ffd9a0") }, uOpacity: { value: 0 } }),
    [],
  );
  useFrame(() => {
    uniforms.uOpacity.value = 0.11 * scene.beam * (1 - scene.explode * 0.8);
  });
  const h = TOP - BOTTOM;
  return (
    <mesh position={[AXIS.x, BOTTOM + h / 2, AXIS.z]} renderOrder={2}>
      <cylinderGeometry args={[0.1, 2.05, h, 64, 1, true]} />
      <shaderMaterial
        vertexShader={beamVertex}
        fragmentShader={beamFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
