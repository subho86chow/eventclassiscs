"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Gap.css";

/**
 * Hallmark · "We close that gap" section.
 *
 * The display line is split into two phrases — "WE CLOSE" sticky to the
 * left edge of the viewport (with overflow), "THE GAP" sticky to the
 * right (with overflow). As the section scrolls, the two phrases
 * slide horizontally toward each other; by the time the section's
 * mid hits the viewport's mid, the phrases meet in the centre with a
 * real word-space between them — reading as "WE CLOSE THE GAP" like
 * a normal sentence. The image and supporting copy sit below the
 * sticky wrapper and come into view after the closure completes.
 *
 * Math
 *   Let:
 *     W  = viewport width
 *     W1 = left-phrase rendered width ("WE CLOSE")
 *     W2 = right-phrase rendered width ("THE GAP")
 *     S  = word-space width at the display's font-size (≈ 0.3 em)
 *     O  = overflow offset on each side at the start (8 vw)
 *
 *   The wrappers carry the overflow via CSS (left: -8vw / right: -8vw)
 *   so the inner phrases naturally start off-screen on each side. GSAP
 *   animates only the inner span's x — the wrapper's vertical-centring
 *   transform is untouched.
 *
 *   Final viewport x positions for the phrases' LEFT edges:
 *     left  = (W − W1 − S − W2) / 2
 *     right = (W + W1 + S − W2) / 2
 *   With those two values, the gap between the inner edges of the
 *   phrases equals S — exactly one word-space.
 *
 *   Because the inner span's x is GSAP-local (relative to its parent
 *   wrapper), the actual GSAP targets are:
 *     leftTargetX  = leftFinalX  + O
 *     rightTargetX = rightFinalX − (W − W2) − O
 *
 *   useLayoutEffect (not useEffect) so GSAP runs before first paint —
 *   avoids any flash of the phrases at the edges before the overflow
 *   offset is applied.
 */

interface GapProps {
  copy?: string;
}

const DEFAULT_COPY =
  "Your website is where ideal customers decide if you're worth their time. We take what makes you irreplaceable, shape the entire experience around it, and make sure they feel that before they read another word.";

/* How much each phrase overflows the viewport edge at the start, as a
 * fraction of viewport width. 8 vw gives a clearly off-screen feel
 * without losing so much that the text becomes unreadable. Must match
 * the CSS left/right offsets in Gap.css. */
const OVERFLOW_RATIO = 0.08;

/* Width of a word-space glyph at the current font-size, in em. 0.3 em
 * is a reasonable approximation for a proportional sans (Geist). */
const SPACE_EM = 0.3;

export function Gap({ copy = DEFAULT_COPY }: GapProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPhraseRef = useRef<HTMLSpanElement>(null);
  const rightPhraseRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const leftPhrase = leftPhraseRef.current;
    const rightPhrase = rightPhraseRef.current;
    if (!section || !leftPhrase || !rightPhrase) return;

    gsap.registerPlugin(ScrollTrigger);

    /* Measure everything once. */
    const measure = () => {
      const vw = window.innerWidth;
      const lw = leftPhrase.offsetWidth;
      const rw = rightPhrase.offsetWidth;
      const fs = parseFloat(getComputedStyle(leftPhrase).fontSize);
      const S = (isFinite(fs) && fs > 0 ? fs : 1) * SPACE_EM;
      const O = vw * OVERFLOW_RATIO;

      /* Final viewport x for each phrase's LEFT edge. */
      const leftFinalX = (vw - lw - S - rw) / 2;
      const rightFinalX = (vw + lw + S - rw) / 2;

      /* Convert viewport coords to GSAP-local x (which is relative to
       * the parent's CSS position — left wrapper at left: -O, right
       * wrapper at right: -O). */
      const leftTargetX = leftFinalX + O;
      const rightTargetX = rightFinalX - (vw - rw) - O;

      return { leftTargetX, rightTargetX };
    };

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      /* Snap both phrases to their closed position with the word-space
       * intact — the user still reads "WE CLOSE THE GAP" as a sentence. */
      const { leftTargetX, rightTargetX } = measure();
      gsap.set(leftPhrase, { x: leftTargetX, force3D: true });
      gsap.set(rightPhrase, { x: rightTargetX, force3D: true });
      return;
    }

    let timeline: gsap.core.Timeline | null = null;
    let resizeRaf = 0;

    const setupAnimation = () => {
      if (timeline) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        timeline = null;
      }

      const { leftTargetX, rightTargetX } = measure();

      /* Reset to the starting position (no GSAP transform on the inner
       * spans; the wrappers' CSS offset is what places them off-screen). */
      gsap.set(leftPhrase, { x: 0, force3D: true });
      gsap.set(rightPhrase, { x: 0, force3D: true });

      timeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            /* start: viewport bottom hits section top
             *         (the section is just entering the viewport from
             *         below — phrases appear overflowing left + right).
             * end:   section top hits viewport top
             *         (the section has scrolled fully into view — the
             *         sticky wrapper now engages, holding the closed
             *         phrases + image + copy in place for the rest of
             *         the section's scroll).
             *
             * The 100 vh of scroll between start and end is exactly the
             * distance the section travels from "just entered" to
             * "fully in view" — the animation maps cleanly onto the
             * user's perception of the section arriving. */
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        })
        /* Both tweens share the timeline position 0 so they advance in
         * lock-step. Inner-span x only — the wrapper's vertical-centring
         * transform is untouched. */
        .to(
          leftPhrase,
          { x: leftTargetX, ease: "none", force3D: true },
          0,
        )
        .to(
          rightPhrase,
          { x: rightTargetX, ease: "none", force3D: true },
          0,
        );
    };

    setupAnimation();

    /* Rebuild only for real width/orientation changes. Mobile browser
     * chrome fires height-only resize events while scrolling; rebuilding a
     * ScrollTrigger during that gesture is the visible layout jump. */
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
      if (timeline) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="gap" id="approach">
      {/* Sticky wrapper — pins EVERYTHING in this section to the viewport
       * during the closure animation. height: 100vh; the wrapper fills
       * the viewport while stuck. Contains:
       *   • the two phrases (top region — they overflow left/right and
       *     animate toward each other on scroll)
       *   • the product image + supporting copy (bottom region — they
       *     stay vertically centred until the animation completes)
       * Both regions release together when sticky ends, which is
       * exactly when the animation reaches its final state — so the
       * section never scrolls past while the closure is still in flight.
       * z-index: 10 keeps the wrapper above subsequent sections. */}
      <div className="gap__sticky">
        {/* Top region — phrases area. flex: 0 0 auto with a fixed-ish
         * height; phrases are absolutely positioned inside, vertically
         * centred within the region. */}
        <div className="gap__display">
          {/* Each phrase-wrap carries the off-screen overflow via CSS
           * (left: -8vw / right: -8vw) AND owns the vertical-centring
           * transform. GSAP only animates the inner `.gap__phrase`'s
           * x — so the wrapper's transform is preserved through the
           * tween, and the overflow is in place from first paint. */}
          <span className="gap__phrase-wrap gap__phrase-wrap--left">
            <span ref={leftPhraseRef} className="gap__phrase">
              WE CLOSE
            </span>
          </span>
          <span className="gap__phrase-wrap gap__phrase-wrap--right">
            <span ref={rightPhraseRef} className="gap__phrase">
              THE GAP
            </span>
          </span>
        </div>

        {/* Bottom region — image + supporting copy, vertically centred.
         * Stays put (no animation) until the sticky releases at the
         * end of the section. */}
        <div className="gap__below">
          <div className="gap__image" aria-hidden="true">
            <Image
              src="/gap.png"
              alt=""
              fill
              sizes="(max-width: 768px) 60vw, 22vw"
              className="gap__image-img"
            />
          </div>

          <p className="gap__copy">{copy}</p>
        </div>
      </div>
    </section>
  );
}

export default Gap;
