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
     * Touch is deliberately left NATIVE (syncTouch: false, the default).
     * Native touch scrolls on the compositor thread, so the page stays
     * smooth even though the main thread is busy every frame (WebGL hero
     * shader + difference-blend groups + ScrollTrigger scrubs). Enabling
     * syncTouch moves scrolling onto that busy main thread and the whole
     * page goes choppy on mobile — the regression we hit.
     *
     * The hero wordmark's scroll jitter is handled at the text level
     * (HeroWordmark.tsx) instead, so we never need to hijack touch. */
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const lenis = new Lenis({
      duration: isTouch ? 0.65 : 1.05,
      wheelMultiplier: isTouch ? 1 : 0.82,
      touchMultiplier: isTouch ? 1.4 : 1,
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
