"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import "./RotatingLogo.css";

/**
 * Hallmark · top-right rotating logo (page chrome).
 *
 * Client component. Loads /logos/3D-EC-Logo.glb, bakes the authored mesh
 * transform into a centred 1.5-unit geometry, and renders it with drei's
 * refractive MeshTransmissionMaterial. Chromatic aberration, gentle animated
 * distortion, volume thickness, and clearcoat give the mark a liquid-glass
 * surface instead of a smoky transparent fill.
 *
 * Reflections come from local Lightformers and refraction samples a generated
 * ice-blue backdrop that is visible only to the material's transmission pass.
 * Nothing is fetched from an external HDR service and the WebGL canvas itself
 * remains transparent over the footer.
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
 *     liquid-glass material EVERY frame, all session, even
 *     while the footer is off-screen. drei caches the parsed GLB in JS
 *     memory, so re-entering the footer re-mounts without re-fetching.
 *
 * Static tilt on X + slow continuous Y rotation; pointer-events:none
 * on the wrapper so it never blocks hero clicks.
 */

const MODEL_URL = "/logos/3D-EC-Logo.glb";

function createLiquidBackdrop() {
  const width = 192;
  const height = 192;
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const diagonal = Math.exp(-Math.pow((u + v * 0.42) - 0.72, 2) / 0.012);
      const coolGlow = Math.exp(
        -(Math.pow(u - 0.78, 2) + Math.pow(v - 0.3, 2)) / 0.055,
      );
      const softGlow = Math.exp(
        -(Math.pow(u - 0.24, 2) + Math.pow(v - 0.78, 2)) / 0.075,
      );
      const index = (y * width + x) * 4;

      pixels[index] = Math.min(255, 8 + diagonal * 112 + softGlow * 35);
      pixels[index + 1] = Math.min(
        255,
        12 + diagonal * 142 + coolGlow * 76 + softGlow * 24,
      );
      pixels[index + 2] = Math.min(
        255,
        18 + diagonal * 170 + coolGlow * 118 + softGlow * 68,
      );
      pixels[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    pixels,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function LiquidGlassLogo() {
  const meshRef = useRef<THREE.Mesh>(null);
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

  const liquidBackdrop = useMemo(createLiquidBackdrop, []);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      liquidBackdrop.dispose();
    };
  }, [geometry, liquidBackdrop]);

  useEffect(() => {
    camera.position.set(0, 0.2, 2.6);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4; // ≈ 23°/s — slow, deliberate
    }
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-0.1, -0.28, 0]}>
      <MeshTransmissionMaterial
        background={liquidBackdrop}
        backside
        backsideThickness={0.42}
        backsideResolution={192}
        resolution={256}
        samples={6}
        transmission={1}
        thickness={0.36}
        roughness={0.08}
        ior={1.28}
        chromaticAberration={0.075}
        anisotropy={0.18}
        distortion={0.22}
        distortionScale={0.58}
        temporalDistortion={0.08}
        attenuationColor="#c3edff"
        attenuationDistance={1.25}
        clearcoat={1}
        clearcoatRoughness={0.045}
        specularIntensity={1}
        specularColor="#ffffff"
        envMapIntensity={2.25}
        color="#e8f8ff"
      />
    </mesh>
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
            intensity={5}
            distance={7}
            decay={2}
            color="#78cbff"
          />

          <Suspense fallback={null}>
            <Environment
              resolution={128}
              frames={1}
              background={false}
              environmentIntensity={1.35}
            >
              <Lightformer
                form="rect"
                color="#ffffff"
                intensity={7}
                position={[0, 2, 2]}
                scale={[4, 0.65, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#9bdcff"
                intensity={4.5}
                position={[-2, 0, 1.5]}
                scale={[0.7, 3, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="ring"
                color="#fff4e8"
                intensity={3}
                position={[2, -0.4, 1.2]}
                scale={1.8}
                target={[0, 0, 0]}
              />
            </Environment>
            <LiquidGlassLogo />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default RotatingLogo;
