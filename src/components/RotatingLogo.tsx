"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import "./RotatingLogo.css";

/**
 * Hallmark · top-right rotating logo (page chrome).
 *
 * Client component. Loads /logos/ec-logo.glb and overrides every mesh's
 * material with a "liquid glass" MeshPhysicalMaterial:
 *   transmission: 1.0       — see-through
 *   thickness / ior         — refractive volume (tuned between water & glass)
 *   iridescence: 0.4       — prismatic edge shimmer (subtle, not loud)
 *   envMapIntensity: 2.0    — strong Fresnel reflection
 *
 * drei's <Environment preset="city" /> provides the IBL the glass needs.
 * Canvas is transparent (alpha: true) — the page bg shows behind the model.
 *
 * Perf: transmissionResolutionScale = 0.5 (set on onCreated) halves the
 * transmission render resolution. The transmission pass is the dominant
 * shader cost; halving it gives ~4× cheaper on that pass with almost no
 * visible quality loss on a smooth surface. DPR is capped at 1.
 *
 * Static 35° tilt on X + slow continuous Y rotation; pointer-events:none
 * on the wrapper so it never blocks hero clicks.
 */

const MODEL_URL = "/logos/ec-logo.glb";

function GlassLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const gltf = useGLTF(MODEL_URL);

  // Clone + center + scale-to-fit + swap the imported material for a real
  // glass. Done once per GLB load.
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

    // Override every mesh's material with the original "Monolog glass"
    // look the user keeps asking for: see-through + Fresnel reflection +
    // iridescent thin-film shimmer + chromatic dispersion at the edges.
    //
    //   transmission: 1.0       — see-through
    //   thickness: 0.4         — refractive volume
    //   ior: 1.45              — liquid-glass sweet spot
    //   roughness: 0.02        — very smooth
    //   iridescence: 0.4       — rainbow shimmer on the surface
    //   dispersion: 1.0        — RGB channels refract separately →
    //                            prismatic fringing at edges (the
    //                            signature look from Image #9)
    //   envMapIntensity: 2.0   — strong Fresnel reflection off the IBL
    //
    // Dispersion is the most expensive feature — it adds an RGB-channel
    // offset pass to the transmission render. We compensate by keeping
    // transmissionResolutionScale = 0.5 (renderer-level) and dpr = [1, 1].
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 1.0,
      thickness: 0.4,
      ior: 1.45,
      iridescence: 0.4,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [200, 200],
      dispersion: 1.0,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide,
    });

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = glass;
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

export function RotatingLogo() {
  return (
    <div aria-hidden="true" className="rotating-logo">
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
          // transmissionResolutionScale = 0.5 renders the transmission
          // pass at half-res and upscales. ~4× cheaper on the dominant
          // pass for very little visible quality loss on a smooth surface.
          gl.transmissionResolutionScale = 0.5;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 4, 3]} intensity={0.6} />
        <Suspense fallback={null}>
          <Environment preset="city" background={false} />
          <GlassLogo />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default RotatingLogo;