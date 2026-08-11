"use client";

import { LiquidMetal } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import "./LiquidMetalBg.css";

/**
 * Hallmark · hero background using @paper-design/shaders-react's
 * LiquidMetal shader.
 *
 * Component contract:
 *   • Wraps the third-party <LiquidMetal> in a div sized to the hero
 *     section. The shader's own width/height props are inline CSS
 *     dimensions — we pass "100%" / "100%" so the canvas always fills
 *     the wrapper, and the shader manages the device-pixel-ratio
 *     internally.
 *   • Pointer events disabled so the shader never blocks hero clicks.
 *   • All shader prop values mirror the user's reference snippet
 *     verbatim — `shape="metaballs"`, the `repetition` / `softness` /
 *     dispersion / distortion / contour / angle / scale / offsetY`
 *     dials, and the white-on-white colour pair. No `image` prop is
 *     passed: the shader treats `image` as a mask that overrides
 *     `shape` when both are set, so leaving `image` out is what
 *     actually causes the metaballs preset to render.
 *
 * Performance design:
 *
 * The hero runs a continuously-rendering WebGL shader AND a scroll-
 * driven wordmark transform (HeroWordmark.tsx, force3D: true). Both
 * want GPU time every frame. Letting the shader run at full quality
 * while the wordmark scrubs under ScrollTrigger is what caused the
 * jittery scroll the user reported.
 *
 * Fragment-shader cost is roughly proportional to the render-target
 * pixel count; the wordmark's transform cost is fixed (one
 * translate3d + scale on a fixed-size layer). So the right lever is
 * the shader's resolution, not its time axis — keep the animation
 * alive, shrink the render target while the GPU is busy serving the
 * wordmark.
 *
 *   • `minPixelRatio={1}` — paper-design defaults to 2, which forces
 *     the shader to render at 2× the CSS pixels even on standard-DPI
 *     displays. Capping to 1 makes the canvas pixel-dim equal to its
 *     CSS size; the metaballs effect is soft / non-text, so the
 *     resolution loss is invisible.
 *
 *   • `maxPixelCount` — paper-design's default cap is
 *     1920 × 1080 × 4 ≈ 8.3 M pixels. We cap the IDLE budget at
 *     1.5 M (~1300 × 1150 backing buffer, plenty for a soft
 *     background) and the SCROLLING budget at 500 K (~700 × 700).
 *     That ~3× drop in fragment work per frame is what frees the
 *     GPU for the wordmark's compositor transform. The metaballs
 *     keep moving the whole time at the original `speed={1}`.
 *
 *   • `speed={1}` — ALWAYS 1. The animation must never pause
 *     (pausing reads as dead, per the user). Only the render target
 *     changes during scroll.
 *
 * Scroll detection: passive `window.scroll` listener with a 100 ms
 * resume debounce. The handler is O(1) — set a state flag, reset a
 * timer — so it never blocks the scroll thread.
 *
 * Trade-off: during an active scroll, the metaballs render at a
 * lower resolution (~700 px square backing buffer instead of
 * ~1300 px). On a soft, organic noise pattern the visible delta is
 * "slightly softer edges for the scroll duration" rather than
 * "frozen frame" — and the user's attention is on the wordmark
 * transition during scroll, not the background.
 *
 * Why no `will-change` on the canvas: HeroWordmark's own code
 * documents why this hurts — "can force excessive layer creation
 * and eat up memory/GPU bandwidth." See LiquidMetalBg.css.
 */

const MIN_PIXEL_RATIO = 1;

/** Render-target cap while idle — the visible-quality budget.
 *  1.5 M pixels ≈ 1300 × 1150 backing buffer. */
const MAX_PIXEL_COUNT_IDLE = 1_500_000;

/** Render-target cap while actively scrolling — the GPU-headroom
 *  budget. 500 K pixels ≈ 700 × 700 backing buffer. ~3× less
 *  fragment work per frame than IDLE, which is the GPU time the
 *  wordmark's force3D transform needs. */
const MAX_PIXEL_COUNT_SCROLLING = 500_000;

/** ms to wait after the last scroll event before resuming the shader.
 *  Long enough to cover a one-frame scroll gap; short enough that
 *  resuming doesn't feel laggy when the user stops scrolling. */
const SCROLL_RESUME_DELAY_MS = 100;

export function LiquidMetalBg() {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    // Passive listener — does NOT call preventDefault, so the scroll
    // thread isn't blocked. The handler itself is O(1) (set a state
    // flag + reset a timer); no layout or paint work happens here.
    const handleScroll = () => {
      setIsScrolling(true);
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
      }
      resumeTimer = setTimeout(() => {
        setIsScrolling(false);
        resumeTimer = null;
      }, SCROLL_RESUME_DELAY_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (resumeTimer !== null) {
        clearTimeout(resumeTimer);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="liquid-metal-bg">
      <LiquidMetal
        width="100%"
        height="100%"
        colorBack="#ffffff"
        colorTint="#ffffff"
        shape="metaballs"
        repetition={2}
        softness={0.1}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.07}
        contour={0.4}
        angle={70}
        // Always 1 — the metaballs keep moving at full speed during
        // scroll. Only the render target's pixel count drops during
        // scroll (see maxPixelCount below); the simulation clock and
        // animation never pause.
        speed={1}
        scale={1.36}
        offsetY={-0.42}
        fit="contain"
        minPixelRatio={MIN_PIXEL_RATIO}
        maxPixelCount={
          isScrolling ? MAX_PIXEL_COUNT_SCROLLING : MAX_PIXEL_COUNT_IDLE
        }
      />
    </div>
  );
}

export default LiquidMetalBg;
