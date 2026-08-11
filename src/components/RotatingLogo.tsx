"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import "./RotatingLogo.css";

/**
 * Hallmark · top-right rotating logo (page chrome).
 *
 * Client component. Loads /logos/ec-logo.glb and overrides every mesh's
 * material with a "liquid metal" chrome MeshPhysicalMaterial — the 3D
 * analogue of the hero's white-on-white LiquidMetal shader:
 *   metalness: 1.0           — fully metallic
 *   roughness: 0.1          — near-mirror surface
 *   clearcoat: 1.0          — wet liquid gloss
 *   envMapIntensity: 3.5    — strong chrome reflections
 *
 * drei's <Environment preset="studio" /> provides the IBL the chrome needs —
 * the bright studio boxes are what give the surface its white, liquid-metal
 * sheen (matching the hero's white-on-white LiquidMetal shader) instead of
 * the dark reflections a city/night map would smear across it.
 * Canvas is transparent (alpha: true) — the page bg shows behind the model.
 *
 * Perf: no transmission pass (unlike the previous glass look), so the
 * material is cheap; DPR stays capped at 1.
 *
 * Mobile perf — the footer logo is the page's biggest GPU/network drain,
 * and it sits BELOW the fold:
 *
 *   • The whole <Canvas> is lazy-mounted. IntersectionObserver with a
 *     1200px approach margin mounts it only when the footer is near —
 *     until then there is no WebGL context at all and, crucially, no
 *     fetch of the 47.5 MB /logos/ec-logo.glb (drei's useGLTF starts the
 *     download on mount). Visitors who never reach the footer pay
 *     nothing; on a slow mobile connection the model has a 1200px head
 *     start to download before it scrolls into view.
 *   • Scroll back out past the margin and the canvas unmounts again —
 *     the r3f render loop (frameloop="always") otherwise redraws the
 *     chrome material + IBL reflections EVERY frame, all session, even
 *     while the footer is off-screen. drei caches the parsed GLB in JS
 *     memory, so re-entering the footer re-mounts without re-fetching.
 *
 * Static 35° tilt on X + slow continuous Y rotation; pointer-events:none
 * on the wrapper so it never blocks hero clicks.
 */

const MODEL_URL = "/logos/ec-logo.glb";

function ChromeLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const gltf = useGLTF(MODEL_URL);

  // Clone + center + scale-to-fit + swap the imported material for the
  // liquid-metal chrome. Done once per GLB load.
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    cloned.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // 1.5 world units + camera at z=2.6 with FOV 35 → visible height ≈
    // 1.65 world units, so the wide-and-flat EC mark fits with a hair
    // of margin instead of clipping the canvas edges.
    const target = 1.5;
    cloned.scale.setScalar(target / maxDim);

    // Override every mesh's material with a "liquid metal" chrome look
    // (the 3D analogue of the hero's white-on-white LiquidMetal shader):
    // fully metallic, near-mirror surface with a wet clearcoat gloss.
    // The IBL does the heavy lifting — the city env map's sharp
    // reflections are what sell the liquid chrome read.
    //
    //   metalness: 1.0         — fully metallic (no diffuse colour)
    //   roughness: 0.1         — near-mirror, slightly softened
    //   clearcoat: 1.0         — wet gloss layer on top of the metal
    //   envMapIntensity: 3.5   — strong chrome reflections off the IBL
    //
    // No transmission / dispersion / iridescence: those are the glass
    // look (transmission) and a rainbow fringe (iridescence). Liquid
    // chrome is monochrome, matching the hero's white-on-white shader.
    // Dropping the transmission pass also removes the dominant shader
    // cost — the renderer no longer needs transmissionResolutionScale.
    const chrome = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 3.5,
      side: THREE.DoubleSide,
    });

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = chrome;
      }
    });

    return cloned;
  }, [gltf]);

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

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
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

    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }

    const io = new IntersectionObserver(
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
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 4, 3]} intensity={0.6} />
          <Suspense fallback={null}>
            <Environment preset="studio" background={false} environmentIntensity={2} />
            <ChromeLogo />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default RotatingLogo;