"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero wordmark — large `eventclassics` display type that lives at the
 * bottom of the hero, and scrolls/transforms into the top-left corner
 * of the viewport to become the sticky "header" wordmark.
 *
 * Animation strategy — for 60fps smoothness, ONLY compositor-friendly
 * properties are animated:
 *   • position:  transform: translate(x, y)   — no `top`/`left`/margin
 *   • size:      transform: scale(s)          — no `font-size` (would reflow)
 *
 * The element is `position: fixed; transform-origin: 0 0` (top-left)
 * so x/y always position the top-left corner of the glyph row. Initial
 * state sits at bottom-centre of the viewport (set by CSS); final state
 * sits at the top-left of the sticky nav (its padding-left/top, read at
 * setup time).
 *
 * Smoothness tuning (the difference between "feels good" and "jittery"):
 *   • `force3D: true` on both set and to — keeps the element on its own
 *     GPU composite layer via translate3d() so the compositor doesn't
 *     have to promote/demote on every frame.
 *   • `scrub: true` — direct 1:1 mapping of scroll position to animation
 *     progress, no smoothing window. `scrub: 0.1` felt like 100 ms of
 *     perceptible lag; the GPU layer absorbs any micro-jitter the wheel
 *     or trackpad introduces, so direct mapping reads as smooth.
 *   • NO `invalidateOnRefresh` — that re-measures the wordmark on every
 *     ScrollTrigger refresh() and forces a synchronous layout, which is
 *     the #1 source of scroll-driven jank on real devices. We handle
 *     resize explicitly instead.
 *   • NO CSS `will-change: transform` — GSAP's own Top 5 ScrollTrigger
 *     Mistakes article explicitly warns that it "can force excessive
 *     layer creation and eat up memory/GPU bandwidth." `force3D: true`
 *     already promotes the element for the duration of the tween, so
 *     a permanent will-change hint is redundant overhead.
 *   • `gsap.ticker.lagSmoothing()` configured once — if the browser
 *     drops a frame (tab in background, heavy GC, etc.), GSAP catches
 *     up smoothly instead of letting the animation freeze-and-jump.
 *   • Measurements are read once during setup (not on every frame) and
 *     the result is baked into the tween's static values.
 *   • Resize handler is rAF-debounced so bursts collapse to one
 *     recomputation per frame.
 *   • No explicit `ScrollTrigger.refresh()` after setup — GSAP refreshes
 *     on its own when needed; forcing it adds work.
 */

const HEADER_PAD_X_FALLBACK = 20; // px — fallback if nav padding can't be read
const HEADER_PAD_Y_FALLBACK = 16; // px — fallback if nav padding can't be read
const TARGET_FONT_SIZE = 24; // px — final wordmark size (≈ header-logo scale)

/** Fallback bottom offset (vw) used only if the CSS
 *  --wordmark-bottom-offset custom property can't be read at setup
 *  time (very old browser, JIT race, etc.). The actual per-breakpoint
 *  values live in MonologHero.css — 5 vw on mobile (≤ 768 px), 2.5 vw
 *  on desktop and tablet (> 768 px). Mirrors the mobile value the hero
 *  uses for its horizontal padding (the "90 vw content area"). */
const INITIAL_BOTTOM_PADDING_VW = 5;

// Adaptive frame-rate handling. If the gap between rAF ticks exceeds
// 500 ms we assume a tab-switch and stop compensating (don't fast-forward
// the wordmark on tab return). Gaps under 33 ms are ignored as noise.
gsap.ticker.lagSmoothing(500, 33);

interface HeroWordmarkProps {
  text: string;
}

export function HeroWordmark({ text }: HeroWordmarkProps) {
  const wordmarkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wordmark = wordmarkRef.current;
    if (!wordmark) return;

    // Honour the OS reduced-motion preference: keep the wordmark at its
    // CSS-defined initial position. No animation, no sticky header swap.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let tween: gsap.core.Tween | null = null;
    let resizeRaf = 0;

    const setupAnimation = () => {
      // Tear down any previous tween + its scrollTrigger before rebuilding.
      if (tween) {
        tween.scrollTrigger?.kill();
        tween.kill();
        tween = null;
      }

      // Cache every measurement once. The tween uses these as static
      // values for its whole lifetime; the next setup (on resize) will
      // re-measure. This is intentional — invalidateOnRefresh would
      // re-read these on every ScrollTrigger.refresh() and force a
      // synchronous layout on every refresh, which is the single biggest
      // cause of scroll-driven jank.
      const initialFontSize = parseFloat(getComputedStyle(wordmark).fontSize);
      if (!isFinite(initialFontSize) || initialFontSize <= 0) return;
      const targetScale = TARGET_FONT_SIZE / initialFontSize;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = wordmark.offsetWidth;
      const elementHeight = wordmark.offsetHeight;

      // Read the actual rendered padding of the sticky nav so the
      // wordmark's final position aligns with the nav's left edge and
      // top edge. This keeps it visually anchored to the header band
      // regardless of viewport (the nav uses vw-based padding that
      // varies with viewport width).
      const nav = document.querySelector<HTMLElement>(".m-hero__nav");
      let headerPadX = HEADER_PAD_X_FALLBACK;
      let headerPadY = HEADER_PAD_Y_FALLBACK;
      if (nav) {
        const navStyle = getComputedStyle(nav);
        const navPadLeft = parseFloat(navStyle.paddingLeft);
        const navPadTop = parseFloat(navStyle.paddingTop);
        if (isFinite(navPadLeft)) headerPadX = navPadLeft;
        if (isFinite(navPadTop)) headerPadY = navPadTop;
      }

      // Initial visual position: bottom-centre of viewport with
      // --wordmark-bottom-offset (5 vw on mobile, 2.5 vw on
      // desktop/tablet) of breathing room below the glyph row. Read
      // the value from the wordmark's computed style so the CSS
      // media query and the JS stay in lockstep — the resize handler
      // below re-reads it on every viewport change, so the value
      // tracks breakpoint crossings in real time.
      // force3D: true pins translate3d() so the compositor keeps this
      // element on its own GPU layer for the entire animation. The
      // bottom-padding value is computed in CSS pixels because GSAP's
      // y is a length, not a viewport-relative unit.
      const offsetStr = getComputedStyle(wordmark)
        .getPropertyValue("--wordmark-bottom-offset")
        .trim();
      const offsetVw =
        parseFloat(offsetStr) || INITIAL_BOTTOM_PADDING_VW;
      const bottomPaddingPx = (offsetVw / 100) * viewportWidth;
      gsap.set(wordmark, {
        x: viewportWidth / 2 - elementWidth / 2,
        y: viewportHeight - elementHeight - bottomPaddingPx,
        scale: 1,
        force3D: true,
      });

      const hero = document.querySelector<HTMLElement>(".m-hero");
      if (!hero) return;

      tween = gsap.to(wordmark, {
        x: headerPadX,
        y: headerPadY,
        scale: targetScale,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          // 1:1 scroll mapping. The user complained "slightly laggy"
          // and 100 ms of intentional smoothing was exactly what they
          // were feeling. With force3D: true the compositor absorbs any
          // micro-jitter the wheel / trackpad introduces, so direct
          // mapping reads as smooth without the perceptible delay.
          scrub: true,
        },
      });
    };

    // Wait for the webfont to settle so offsetWidth/offsetHeight/fontSize
    // reflect the actual glyph metrics (Geist swaps in after first paint
    // and would otherwise throw off the initial baseline measurement).
    const fontsReady =
      typeof document !== "undefined" && document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(setupAnimation);
    } else {
      setupAnimation();
    }

    // rAF-debounced resize: collapse bursts of resize events to a
    // single recomputation per animation frame.
    const handleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        setupAnimation();
        resizeRaf = 0;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (tween) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
    };
  }, []);

  return (
    <span ref={wordmarkRef} className="m-hero__wordmark-display">
      {text}
    </span>
  );
}

export default HeroWordmark;
