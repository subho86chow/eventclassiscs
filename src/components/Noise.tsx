"use client";

import { useRef, useEffect } from "react";
import "./Noise.css";

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

const Noise = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
}: NoiseProps) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId: number;
    /* 512² on phones (≤768px) — the grain is upscaled to 100vw × 100vh
     * either way, and 512² is 4× less random-noise fill work per frame
     * than 1024² (the old universal size was the single biggest
     * main-thread cost in the Success Stories section on mobile). */
    const canvasSize = window.matchMedia("(max-width: 768px)").matches
      ? 512
      : 1024;
    let visible = true;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      /* Skip the grain regeneration while the section is off-screen —
       * the rAF callback stays scheduled (cheap) but the ~1M-iteration
       * fill loop only runs when the noise is actually visible. */
      if (visible && frame % patternRefreshInterval === 0) {
        drawGrain();
      }
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(canvas);

    resize();
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      io.disconnect();
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      className="noise-overlay"
      ref={grainRef}
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default Noise;