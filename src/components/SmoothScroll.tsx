"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    /* Touch detection at mount — drives the touch-optimised Lenis
     * config below. Lenis's v1.3 default already keeps touch native
     * (no `smoothTouch` flag in this version), but the desktop
     * `wheelMultiplier: 0.82` and default `touchMultiplier: 1` make
     * touch feel sticky: Lenis fights the OS's native momentum. The
     * recommended mobile config is shorter duration and a
     * `touchMultiplier` closer to 1.4 so it tracks the user's finger
     * without fighting it. Desktop behaviour is unchanged. */
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
