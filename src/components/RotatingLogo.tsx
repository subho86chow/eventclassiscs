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
 * Footer EC mark rendered as neutral reflective glass.
 *
 * The authored GLB transform is baked into a centred 1.5-unit geometry so the
 * mark rotates around its visible centre. A high-resolution transmission pass
 * supplies refraction and volume; a neutral local studio environment supplies
 * the reflections. There is deliberately no coloured surface shader or
 * physical iridescence — the body stays clear, smoky and genuinely reflective.
 *
 * The HTML footer cannot be sampled by a WebGL transmission material, so a
 * monochrome studio backdrop is provided only to the material's refraction
 * pass. The WebGL canvas itself remains transparent over the footer.
 *
 * The canvas is mounted only while the footer is approaching. This avoids the
 * GLB download, WebGL context and continuous render loop for visitors who never
 * reach the footer, while still giving the model a 1200px loading head start.
 */

const MODEL_URL = "/logos/3D-EC-Logo.glb";

/** Neutral high-contrast backdrop sampled only through the glass volume. */
function createGlassBackdrop() {
  const width = 512;
  const height = 512;
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);

      const broadFill = Math.exp(
        -(Math.pow(u - 0.48, 2) + Math.pow(v - 0.5, 2)) / 0.34,
      );
      const whiteSweep = Math.exp(
        -Math.pow(u + v * 0.3 - 0.72, 2) / 0.0065,
      );
      const softSweep = Math.exp(
        -Math.pow(u - v * 0.22 - 0.25, 2) / 0.028,
      );
      const lowerGlow = Math.exp(
        -(Math.pow(u - 0.68, 2) + Math.pow(v - 0.82, 2)) / 0.07,
      );

      const value = Math.min(
        232,
        5 + broadFill * 8 + whiteSweep * 148 + softSweep * 18 + lowerGlow * 8,
      );
      const index = (y * width + x) * 4;

      // Equal RGB channels keep the refraction completely neutral.
      pixels[index] = value;
      pixels[index + 1] = value;
      pixels[index + 2] = value;
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
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function ReflectiveGlassLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const motionRef = useRef(0);
  const { camera, gl, size } = useThree();
  const gltf = useGLTF(MODEL_URL);
  const glassBackdrop = useMemo(() => createGlassBackdrop(), []);
  const transmissionResolution = Math.min(
    1536,
    Math.max(
      768,
      Math.ceil(Math.max(size.width, size.height) * gl.getPixelRatio()),
    ),
  );

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
      glassBackdrop.dispose();
    };
  }, [geometry, glassBackdrop]);

  useEffect(() => {
    camera.position.set(0, 0.2, 2.6);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      motionRef.current += delta;
      // A slow ±30° turn keeps the thin mark readable while still letting the
      // environment glide across the glass. A full spin becomes a hairline.
      groupRef.current.rotation.y =
        -0.28 + Math.sin(motionRef.current * 0.55) * 0.52;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} rotation={[-0.1, -0.28, 0]}>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          background={glassBackdrop}
          backside
          backsideThickness={0.08}
          backsideResolution={Math.min(768, transmissionResolution)}
          backsideEnvMapIntensity={2}
          resolution={transmissionResolution}
          samples={6}
          transmission={1}
          thickness={0.1}
          roughness={0.02}
          ior={1.5}
          chromaticAberration={0}
          anisotropicBlur={0}
          distortion={0}
          temporalDistortion={0}
          attenuationColor="#ffffff"
          attenuationDistance={Infinity}
          clearcoat={1}
          clearcoatRoughness={0.025}
          specularIntensity={1}
          specularColor="#ffffff"
          envMapIntensity={3}
          color="#ffffff"
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

/** Px of scroll room around the viewport in which the logo is approaching. */
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
          dpr={[2, 3]}
          gl={{
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            precision: "highp",
            powerPreference: "high-performance",
          }}
          onCreated={({ gl: renderer }) => {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.08;
          }}
        >
          <Suspense fallback={null}>
            <Environment
              resolution={512}
              frames={1}
              background={false}
              environmentIntensity={1.1}
            >
              <Lightformer
                form="rect"
                color="#bdbdbd"
                intensity={0.4}
                position={[0, 0, 4]}
                scale={[7, 5, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#ffffff"
                intensity={6}
                position={[0.65, 2.2, 2.4]}
                scale={[4.8, 0.42, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#ffffff"
                intensity={4.5}
                position={[-2.2, 0.15, 1.8]}
                scale={[0.42, 4, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="ring"
                color="#ffffff"
                intensity={2.5}
                position={[2.2, -0.4, 1.3]}
                scale={1.8}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#777777"
                intensity={2.2}
                position={[0, -1, -4]}
                scale={[5, 3, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                color="#eeeeee"
                intensity={2}
                position={[0, 4, 0]}
                scale={[4, 1, 1]}
                target={[0, 0, 0]}
              />
            </Environment>
            <ReflectiveGlassLogo />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

export default RotatingLogo;
