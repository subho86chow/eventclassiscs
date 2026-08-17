"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    /* Touch detection at mount — drives the touch-optimised Lenis
     * config below.
     *
     * syncTouch: true on touch is what feeds ScrollTrigger a smooth,
     * frame-consistent scroll position on mobile. With touch left
     * native (syncTouch: false, the default), the scroll position
     * reaches the main thread in uneven increments and every
     * scrub-driven transform (the hero wordmark's scroll-to-header
     * move) jitters at medium scroll speed. Driving touch through
     * Lenis instead — finger tracked 1:1 while dragging, then smooth
     * rAF-driven momentum on release — gives ScrollTrigger even deltas,
     * so the wordmark follows without shimmer.
     *
     * Touch-feel knobs (tune on device if it feels off):
     *   • touchMultiplier — drag speed vs the finger (1.4 = ~40% faster;
     *     drop toward 1 if it reads as slippery).
     *   • syncTouchLerp (default 0.075) — momentum smoothing on release.
     *   • touchInertiaExponent (default 1.7) — release inertia strength.
     * Desktop (wheel) behaviour is unchanged. */
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const lenis = new Lenis({
      duration: isTouch ? 0.65 : 1.05,
      wheelMultiplier: isTouch ? 1 : 0.82,
      touchMultiplier: isTouch ? 1.4 : 1,
      syncTouch: isTouch,
      anchors: {
        duration: 1.6,
        easing: (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        offset: -72,
      },
      stopInertiaOnNavigate: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return children;
}
