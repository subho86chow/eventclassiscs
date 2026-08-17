"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Global ScrollTrigger behaviour (one place, applied to every trigger
 * on the page):
 *
 *   • `ignoreMobileResize: true` — vertical resizes on touch devices
 *     (address-bar hide/show) no longer trigger a refresh() that
 *     re-measures every start/end mid-scroll and jumps the page
 *     (GSAP added this exactly for the "page shifts when the URL bar
 *     collapses" problem).
 *   • `autoRefreshEvents: "DOMContentLoaded,resize"` — drop `load` from
 *     the default ("visibilitychange,DOMContentLoaded,load,resize").
 *     On Vercel `load` fires late (fonts, images, the 47 MB GLB) —
 *     sometimes while the user is already scrolling — and a refresh at
 *     that point moves every trigger and visibly shifts the page.
 *     Fonts are the only genuinely layout-changing late asset; their
 *     refresh is handled explicitly once after document.fonts.ready
 *     below (all triggers exist by then), so positions stay accurate.
 *
 * Client-only: this file is SSR'd for the initial HTML, and config()
 * touches browser APIs — guard against the prerender pass. */
if (typeof window !== "undefined") {
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "DOMContentLoaded,resize",
  });
}

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
 * Coordinate-system contract (mobile scroll-stability fix):
 *
 *   The CSS transform uses the stable small viewport (`svh`), so mobile
 *   browser chrome can open or close without moving the initial anchor.
 *   We read that position once and rebuild only when viewport width changes.
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
 *   • The root SmoothScroll controller owns GSAP's ticker so Lenis and
 *     every ScrollTrigger update on the same frame.
 *   • Measurements are read once during setup (not on every frame) and
 *     the result is baked into the tween's static values.
 *   • Resize handler is rAF-debounced so bursts collapse to one
 *     recomputation per frame.
 *   • No explicit `ScrollTrigger.refresh()` after setup — GSAP refreshes
 *     on its own when needed; forcing it adds work.
 */

const HEADER_PAD_X_FALLBACK = 20; // px — fallback if nav padding can't be read
const HEADER_TARGET_Y_FALLBACK = 16; // px — fallback if nav can't be measured
const TARGET_FONT_SIZE = 24; // px — final wordmark size (≈ header-logo scale)
const BLUR_OVERSCAN = 12; // px — keeps the initial filter bloom inside the blend group

interface HeroWordmarkProps {
  text: string;
}

export function HeroWordmark({ text }: HeroWordmarkProps) {
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Once the letter-stagger entry finishes, drop the per-letter
   * transform/transition so the wordmark is a single rasterized text run
   * again. The retained `translateY(0)` on every letter otherwise leaves
   * ~N transformed inline-block layers, which shimmer under the parent's
   * force3D scale during scroll. Reduced-motion reaches the same
   * end-state via CSS. */
  useEffect(() => {
    if (!isActive) return;
    const settleMs = text.length * 20 + 250;
    const timer = setTimeout(() => setSettled(true), settleMs);
    return () => clearTimeout(timer);
  }, [isActive, text]);

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

      // Read the sticky nav so the wordmark shares the exact horizontal
      // edge and vertical centre used by the menu and CTA.
      const nav = document.querySelector<HTMLElement>(".m-hero__nav");
      let headerPadX = HEADER_PAD_X_FALLBACK;
      let headerTargetY = HEADER_TARGET_Y_FALLBACK;
      if (nav) {
        const navStyle = getComputedStyle(nav);
        const navPadLeft = parseFloat(navStyle.paddingLeft);
        if (isFinite(navPadLeft)) headerPadX = navPadLeft;

        const navHeight = nav.getBoundingClientRect().height;
        const finalWordmarkHeight = wordmark.offsetHeight * targetScale;
        if (isFinite(navHeight) && navHeight > 0) {
          headerTargetY = Math.max(
            0,
            (navHeight - finalWordmarkHeight) / 2,
          );
        }
      }

      // Initial visual position: bottom-centre of viewport, with 5 vw
      // of breathing room below the glyph row on mobile, 2.5 vw on
      // desktop / tablet. The transform ITSELF is owned by CSS
      // (translate3d(50vw - 50%, 100svh - 100% - 5vw, 0) on mobile;
      // overridden per-breakpoint in MonologHero.css) — we read that
      // live CSS-anchored position via getBoundingClientRect() and
      // align GSAP's transform with it. The handoff from CSS to JS is
      // seamless (no flicker on mount). The svh anchor is stable during
      // mobile browser chrome changes, so there is no height snapshot to
      // reconcile during scrolling.
      //
      // force3D: true pins translate3d() so the compositor keeps this
      // element on its own GPU layer for the entire animation.
      const startRect = wordmark.getBoundingClientRect();
      gsap.set(wordmark, {
        x: startRect.left,
        y: startRect.top,
        scale: 1,
        force3D: true,
      });

      const hero = document.querySelector<HTMLElement>(".m-hero");
      if (!hero) return;

      // Mobile native touch scroll fires scroll events in uneven
      // increments, so a direct 1:1 scrub maps that jitter straight onto
      // the wordmark and makes it wiggle at medium scroll speed. A short
      // smoothing window (0.2s) damps the jitter without the perceptible
      // catch-up lag a longer window introduces. Desktop keeps the direct
      // mapping (wheel/trackpad events are smooth on their own).
      // Re-evaluated on width change because setupAnimation() is rebuilt
      // by the resize handler below when the breakpoint is crossed.
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      tween = gsap.to(wordmark, {
        x: headerPadX,
        y: headerTargetY,
        scale: targetScale,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: isMobile ? 0.2 : true,
        },
      });

      /* Scope the wordmark's difference-blend group to the glyphs'
       * travel ENVELOPE instead of the full viewport. The group must
       * cover both the start box (bottom-centre, scale 1) and the end
       * box (top-left, scale targetScale) — blend + transform on the
       * SAME element is the documented crop bug, so the group stays a
       * static wrapper, but its bounds can shrink from inset: 0 to the
       * union of the two boxes. The compositor's per-frame blend cost
       * scales with the group's area, so this trims the full-screen
       * re-blend (with a 120 Hz display the budget is 8.3 ms/frame).
       * Sizing runs only on setup/resize — never per frame. */
      const sizeBlendGroup = () => {
        const group = document.querySelector<HTMLElement>(
          ".m-hero__wordmark-blend",
        );
        if (!group || !wordmark.isConnected) return;
        const w = wordmark.offsetWidth;
        const h = wordmark.offsetHeight;
        // Start bounds are the wordmark's actual rendered rect (which is
        // wherever the svh-anchored CSS transform put it), NOT a JS
        // snapshot of viewportHeight from setup. End bounds are the
        // header corner. Both are invariant under URL-bar changes once
        // GSAP takes over the transform (the wordmark doesn't drift
        // with the bar — GSAP's transform is fixed at setup time, and
        // both endpoints shifted together at the moment of capture).
        const rect = wordmark.getBoundingClientRect();
        const startX = rect.left;
        const startY = rect.top;
        const finalW = w * targetScale;
        const finalH = h * targetScale;
        const left = Math.max(0, Math.min(startX, headerPadX) - BLUR_OVERSCAN);
        const top = Math.max(
          0,
          Math.min(startY, headerTargetY) - BLUR_OVERSCAN,
        );
        const right = Math.max(startX + w, headerPadX + finalW) + BLUR_OVERSCAN;
        const bottom =
          Math.max(startY + h, headerTargetY + finalH) + BLUR_OVERSCAN;
        group.style.left = `${left}px`;
        group.style.top = `${top}px`;
        group.style.width = `${Math.max(1, right - left)}px`;
        group.style.height = `${Math.max(1, bottom - top)}px`;
      };
      sizeBlendGroup();

    };

    // Wait for the webfont to settle so offsetWidth/offsetHeight/fontSize
    // reflect the actual glyph metrics (Geist swaps in after first paint
    // and would otherwise throw off the initial baseline measurement).
    //
    // The explicit ScrollTrigger.refresh() after setup is the ONE
    // controlled refresh for late-loading fonts (we removed `load` from
    // autoRefreshEvents in ScrollTrigger.config above). Every other
    // trigger on the page (KeepScrolling pin, Statement reveal,
    // parallax…) was measured with pre-font metrics; this single
    // refresh re-measures them all once, at load time, before the user
    // can meaningfully scroll — instead of a refresh firing mid-scroll
    // whenever `load` happened to complete.
    const fontsReady =
      typeof document !== "undefined" && document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(() => {
        setupAnimation();
        ScrollTrigger.refresh();
      });
    } else {
      setupAnimation();
    }

    // rAF-debounced resize: collapse bursts of resize events to a
    // single recomputation per animation frame. Rebuild only on WIDTH
    // changes — a height-only resize (mobile address-bar hide/show)
    // must not tear down and recreate the ScrollTrigger mid-gesture,
    // which is exactly the "page jumps when the URL bar collapses"
    // failure. Wordmark metrics only depend on width.
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (window.innerWidth !== lastWidth) {
          lastWidth = window.innerWidth;
          setupAnimation();
        }
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
    <div ref={wordmarkRef} className="m-hero__wordmark-display">
      <span className="m-hero__wordmark-load" aria-label={text}>
        {Array.from(text).map((character, index) => (
          <span
            key={`${character}-${index}`}
            aria-hidden="true"
            className={`m-hero__wordmark-letter${isActive ? " m-hero__wordmark-letter--active" : ""}${settled ? " m-hero__wordmark-letter--settled" : ""}`}
            style={{ transitionDelay: isActive ? `${index * 20}ms` : "0ms" }}
          >
            {character === " " ? "\u00a0" : character}
          </span>
        ))}
      </span>
    </div>
  );
}

export default HeroWordmark;
