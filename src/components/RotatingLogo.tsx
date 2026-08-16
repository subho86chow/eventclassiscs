"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import "./RotatingLogo.css";

/**
 * Hallmark · top-right rotating logo (page chrome).
 *
 * Client component. Loads /logos/3D-EC-Logo.glb, bakes the authored mesh
 * transform into a centred 1.5-unit geometry, and renders it as liquid chrome.
 * A near-mirror MeshPhysicalMaterial supplies the black/white reflection bands
 * while a thin additive Fresnel pass supplies the hero shader's red/cyan colour
 * separation around the contour.
 *
 * The visual translation follows LiquidMetalBg.tsx: its white-on-white palette
 * becomes neutral silver, shiftRed/shiftBlue become the chromatic rim, and its
 * high contour becomes broad bright studio bands over deep black reflections.
 * Local Lightformers provide those bands without an external HDR download.
 *
 * Mobile perf — the footer logo is the page's biggest GPU/network drain,
 * and it sits BELOW the fold:
 *
 *   • The whole <Canvas> is lazy-mounted. IntersectionObserver with a
 *     1200px approach margin mounts it only when the footer is near —
 *     until then there is no WebGL context at all and, crucially, no
 *     fetch of the ~190 KB /logos/3D-EC-Logo.glb (drei's useGLTF starts the
 *     download on mount). Visitors who never reach the footer pay
 *     nothing; on a slow mobile connection the model has a 1200px head
 *     start to download before it scrolls into view.
 *   • Scroll back out past the margin and the canvas unmounts again —
 *     the r3f render loop (frameloop="always") otherwise redraws the
 *     liquid-metal material EVERY frame, all session, even
 *     while the footer is off-screen. drei caches the parsed GLB in JS
 *     memory, so re-entering the footer re-mounts without re-fetching.
 *
 * Static tilt on X + slow continuous Y rotation; pointer-events:none
 * on the wrapper so it never blocks hero clicks.
 */

const MODEL_URL = "/logos/3D-EC-Logo.glb";

const CHROMATIC_RIM_VERTEX = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewNormal = normalize(normalMatrix * normal);
    vViewPosition = viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const CHROMATIC_RIM_FRAGMENT = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  vec3 spectrum(float t) {
    return 0.52 + 0.48 * cos(
      6.2831853 * (t + vec3(0.0, 0.34, 0.67))
    );
  }

  void main() {
    vec3 normal = normalize(vViewNormal);
    normal = gl_FrontFacing ? normal : -normal;

    vec3 viewDirection = normalize(-vViewPosition);
    float facing = clamp(abs(dot(normal, viewDirection)), 0.0, 1.0);
    float rim = smoothstep(0.08, 0.82, pow(1.0 - facing, 3.0));

    float orientation = dot(normal, normalize(vec3(0.66, 0.36, 0.66)));
    vec3 chroma = spectrum(orientation * 0.34 + vViewPosition.y * 0.08);
    vec3 colour = chroma * 1.45 + vec3(0.28) * rim;

    gl_FragColor = vec4(colour, rim * 0.72);
  }
`;

function LiquidMetalLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const gltf = useGLTF(MODEL_URL);

  // The GLB contains one mesh with a large authored node transform. Bake that
  // transform into a private geometry before centring/scaling so subsequent
  // rotation always happens around the visible mark's true centre.
  const geometry = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const source = gltf.scene.getObjectByProperty("type", "Mesh");
    if (!(source instanceof THREE.Mesh)) return null;

    const baked = source.geometry.clone();
    baked.applyMatrix4(source.matrixWorld);
    baked.computeBoundingBox();

    const box = baked.boundingBox;
    if (!box) return null;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // 1.5 world units + camera at z=2.6 with FOV 35 → visible height ≈
    // 1.65 world units, so the wide-and-flat EC mark fits with a hair
    // of margin instead of clipping the canvas edges.
    const target = 1.5;
    const scale = target / maxDim;

    baked.translate(-center.x, -center.y, -center.z);
    baked.scale(scale, scale, scale);
    baked.computeBoundingBox();
    baked.computeBoundingSphere();
    return baked;
  }, [gltf]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    camera.position.set(0, 0.2, 2.6);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4; // ≈ 23°/s — slow, deliberate
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} rotation={[-0.1, -0.28, 0]}>
      <mesh geometry={geometry} renderOrder={1}>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={1}
          roughness={0.085}
          clearcoat={1}
          clearcoatRoughness={0.035}
          envMapIntensity={3.2}
          iridescence={0.28}
          iridescenceIOR={1.18}
          iridescenceThicknessRange={[110, 260]}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={geometry} scale={1.008} renderOrder={2}>
        <shaderMaterial
          vertexShader={CHROMATIC_RIM_VERTEX}
          fragmentShader={CHROMATIC_RIM_FRAGMENT}
          transparent
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Px of scroll room around the viewport in which the footer logo is
 *  considered "approaching". While it's beyond this margin the canvas
 *  stays unmounted — no WebGL context, no GLB fetch, no render loop. */
const APPROACH_MARGIN_PX = 1200;

export function RotatingLogo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const IntersectionObserverConstructor = window.IntersectionObserver;
    if (typeof IntersectionObserverConstructor !== "function") {
      const frame = window.requestAnimationFrame(() => setNear(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const io = new IntersectionObserverConstructor(
      (entries) => {
        setNear(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: `${APPROACH_MARGIN_PX}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="rotating-logo">
      {near && (
        <Canvas
          camera={{ position: [0, 0.2, 2.6], fov: 35 }}
          dpr={[1, 1]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.25;
          }}
        >
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[3, 4, 3]}
            intensity={2.2}
            color="#f1fbff"
          />
          <pointLight
            position={[-2.5, -0.5, 2]}
            intensity={3.5}
            distance={7}
            decay={2}
            color="#ffffff"
          />

          <Suspense fallback={null}>
            <Environment
              resolution={128}
              frames={1}
              background={false}
              environmentIntensity={1.6}
            >
              <Lightformer
                form="rect"
                color="#ffffff"
                intensity={8}
                position={[0.5, 2, 2]}
                scale={[4.5, 0.55, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#ffffff"
                intensity={5}
                position={[-2, 0, 1.5]}
                scale={[0.55, 3.5, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="ring"
                color="#ffffff"
                intensity={4}
                position={[2, -0.4, 1.2]}
                scale={1.8}
                target={[0, 0, 0]}
              />
            </Environment>
            <LiquidMetalLogo />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default RotatingLogo;
