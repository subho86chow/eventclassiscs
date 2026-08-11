"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./KeepScrolling.css";

/* Adaptive frame-rate handling — shared across all components that use
 * GSAP. If the gap between rAF ticks exceeds 500 ms we assume a
 * tab-switch and stop compensating (don't fast-forward on tab return).
 * Gaps under 33 ms are ignored as noise. */
gsap.ticker.lagSmoothing(500, 33);

/**
 * Hallmark · "Keep scrolling" kicker section.
 *
 * Pinned near-black stage. A uniform grid of capsule outlines frames a
 * pill-sized "stadium" that reads as one more grid pill — distinguished
 * only by the `KEEP SCROLLING • ` text marching around its perimeter
 * (textPath + SMIL startOffset — it keeps marching through the whole
 * sequence). While scrolling, the grid columns drift vertically in
 * alternating directions (even up, odd down; the centre column stays
 * fixed), then a GSAP timeline scrubs: the grid fades, the stadium floods
 * white, and a whiteout veil lands the stage on pure white exactly as the
 * pin releases — a clean handoff into Success Stories.
 */

const REPEAT = "KEEP SCROLLING • "; // "•"
const SCROLL_TEXT = REPEAT.repeat(10);

/* Stadium geometry — identical to a grid pill (100 × 200, corner radius
 * 50). Centred at (600, 400) so it sits cleanly in row 2 of the grid and
 * reads as one more pill — distinguished only by the marching "KEEP
 * SCROLLING • " text on its perimeter. */
const STADIUM_PATH =
  "M 550,350 A 50,50 0 0 1 650,350 L 650,450 A 50,50 0 0 1 550,450 Z";
const STADIUM_CX = 600;
const STADIUM_CY = 400;

/* Bounds of the stadium at start — used to filter out the grid pill
 * the stadium replaces. */
const STADIUM_BOUNDS = {
  x: 550,
  y: 300,
  w: 100,
  h: 200,
};

/* Final zoom factor. Puts the text columns at ~15% / ~85% of the viewBox
 * width while the white stadium body covers everything but the far edges —
 * the whiteout layer finishes the job. */
const ZOOM_FINAL = 7;

/* ---------- Capsule grid ----------
 * Uniform grid: every pill is the same size, horizontal gap = vertical
 * gap = 50 px. Half-period stagger alternates the columns up/down — even
 * cols (including centre col 4) sit at the base y, odd cols shift down by
 * HALF_PERIOD. The stadium takes the centre cell and replaces one bg pill.
 * Two extra bleed rows top and bottom keep every edge covered through the
 * full ±DRIFT column drift. */
const PILL_W = 100;
const PILL_H = 200;
const PILL_R = 50;
const COL_STEP = 150; // 100 wide + 50 gap
const ROW_STEP = 250; // 200 tall + 50 gap
const HALF_PERIOD = ROW_STEP / 2; // 125 — col-to-col vertical offset
const COL_COUNT = 10;
const CENTER_COL = 4; // x 550–650, centre 600 — fixed while the others drift
const DRIFT = ROW_STEP; // one full period up/down across approach + pin

interface GridColumn {
  col: number;
  pills: { x: number; y: number }[];
}

const GRID_COLS: GridColumn[] = [];
for (let col = 0; col < COL_COUNT; col++) {
  const x = -50 + col * COL_STEP;
  // Even cols (incl. centre col 4) stay at base y. Odd cols shift down by
  // HALF_PERIOD so adjacent cols read as a brick pattern.
  const y0 = col % 2 === 0 ? -200 : -200 + HALF_PERIOD;
  const pills: { x: number; y: number }[] = [];
  for (let row = -2; row <= 5; row++) {
    const py = y0 + row * ROW_STEP;

    // Skip any pill whose rect overlaps the stadium's start bounds — the
    // stadium takes that single cell, every other pill stays in the grid.
    const overlaps =
      x < STADIUM_BOUNDS.x + STADIUM_BOUNDS.w &&
      x + PILL_W > STADIUM_BOUNDS.x &&
      py < STADIUM_BOUNDS.y + STADIUM_BOUNDS.h &&
      py + PILL_H > STADIUM_BOUNDS.y;
    if (overlaps) continue;

    pills.push({ x, y: py });
  }
  GRID_COLS.push({ col, pills });
}

export function KeepScrolling() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;

    /* Reduced motion: freeze the SMIL text march, skip the pin/drift —
     * the section renders as its static initial frame. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* Pause the SMIL text march while the section is off-screen. The 22 s
     * startOffset animation runs on the document timeline continuously —
     * main-thread SVG animation on mobile Safari — even when the pinned
     * stage is far from the viewport. The march resumes the moment the
     * section approaches. */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      },
      { rootMargin: "150px 0px" },
    );
    io.observe(section);

    /* Resolve every animated element ONCE up front — direct node refs
     * sidestep selector-scoping entirely and are faster than string
     * lookups on every tween build. */
    const grid = section.querySelector("[data-ks-grid]");
    const fill = section.querySelector("[data-ks-fill]");
    const stroke = section.querySelector("[data-ks-stroke]");
    const text = section.querySelector("[data-ks-text]");
    const zoom = section.querySelector("[data-ks-zoom]");
    const whiteout = section.querySelector("[data-ks-whiteout]");

    let mm: gsap.MatchMedia | null = null;

    const ctx = gsap.context(() => {
      mm = gsap.matchMedia(section);

      const buildStage = ({
        pinEnd,
        zoomStart,
        whiteoutStart,
        whiteoutDuration,
        driftEnd,
      }: {
        pinEnd: string;
        zoomStart: number;
        whiteoutStart: number;
        whiteoutDuration: number;
        driftEnd: string;
      }) => {
        const tl = gsap.timeline({
          defaults: { ease: "none", force3D: true },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: pinEnd,
            pin: true,
            /* The root <body> is `flex flex-col`, and ScrollTrigger
             * auto-disables pin spacing under a flex parent — which would
             * leave zero scroll room for the scrub. Force it back on. */
            pinSpacing: true,
            /* Direct 1:1 mapping of scroll → timeline progress. `scrub: 0.75`
             * was a 750 ms catch-up window — exactly the perceived lag the
             * user felt in the wordmark animation. Same fix here. */
            scrub: true,
            /* Pre-pin the layout by 1 px on fast scroll so the pin doesn't
             * visibly snap on trackpad flicks. */
            anticipatePin: 1,
          },
        });

        tl
          /* Phase 1 — flood: grid recedes, stadium fills white, ink turns
           * grey. (GSAP's colour parser wants hex/rgb, not oklch.) Faster
           * than before so the stadium lands white quickly and the user gets
           * a beat to read the marching text before the magnify. */
          .to(grid, { opacity: 0, duration: 0.18, force3D: true }, 0.05)
          .to(fill, { fillOpacity: 1, duration: 0.15, force3D: true }, 0.07)
          .to(stroke, { opacity: 0, duration: 0.12, force3D: true }, 0.09)
          .to(text, { fill: "#8a8a8a", duration: 0.15, force3D: true }, 0.07)
          /* Phase 2 — zoom from the stadium centre; the perimeter text
           * becomes the giant left/right columns. On mobile the zoom is
           * parked LATER (0.4 → 0.8 instead of 0.32 → 0.72): the zoomed
           * white stadium covers a narrow phone viewport much sooner than
           * a desktop one, which used to leave a long white tail before
           * the pin released (the mobile white-scroll bug). Starting
           * later + a shorter pinned span (200 %) cuts that tail to ~a
           * third of its old length. */
          .to(
            zoom,
            {
              scale: ZOOM_FINAL,
              svgOrigin: `${STADIUM_CX} ${STADIUM_CY}`,
              duration: 0.4,
              ease: "power2.inOut",
              force3D: true,
            },
            zoomStart,
          )
          /* Phase 3 — whiteout veil matches the next section's bg colour
           * (Success Stories = oklch(99% 0.005 240)), so when the pin
           * releases the section exits on pure white and the transition is
           * seamless. Starts just before the zoom completes so the stadium
           * and the surrounding grid merge into one continuous white.
           * Mobile: 0.82 → 0.98 (desktop: 0.8 → 1.0), so the veil lands
           * exactly as the pin releases and the white tail ends with the
           * section. */
          .to(whiteout, { opacity: 1, duration: whiteoutDuration, force3D: true }, whiteoutStart);

        /* Column drift — its own trigger so it also runs while the section
         * scrolls into view, not just while pinned.
         *
         * ONE timeline + ONE trigger for ALL columns (the old build had 9
         * parallel triggers, each reading scroll progress every frame — on
         * mobile that's 9x the per-frame progress math while scrubbing
         * SVG groups). A single trigger reads the scroll position once per
         * frame and the tween updates are pure transform writes. */
        const drift = gsap.timeline({
          defaults: { ease: "none", force3D: true },
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: driftEnd,
            scrub: true,
          },
        });

        section.querySelectorAll<SVGGElement>("[data-ks-col]").forEach((colEl) => {
          const col = Number(colEl.dataset.ksCol);
          if (col === CENTER_COL) return; // centre column stays fixed
          drift.to(colEl, { y: col % 2 === 0 ? -DRIFT : DRIFT }, 0);
        });
      };

      /* Mobile: shorter pinned span + later zoom + later whiteout (see the
       * Phase 2 comment). Desktop: the original timing. */
      mm.add("(max-width: 768px)", () => {
        buildStage({ pinEnd: "+=200%", zoomStart: 0.4, whiteoutStart: 0.82, whiteoutDuration: 0.16, driftEnd: "+=300%" });
      });

      mm.add("(min-width: 769px)", () => {
        buildStage({ pinEnd: "+=300%", zoomStart: 0.32, whiteoutStart: 0.8, whiteoutDuration: 0.2, driftEnd: "+=400%" });
      });
    }, section);

    return () => {
      io.disconnect();
      mm?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="keep-scrolling" aria-label="Keep scrolling">
      <svg
        ref={svgRef}
        className="keep-scrolling__art"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* ---------- Capsule grid (bg), grouped per column for drift ---------- */}
        <g
          className="keep-scrolling__grid"
          data-ks-grid
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {GRID_COLS.map(({ col, pills }) => (
            <g key={col} data-ks-col={col}>
              {pills.map((p, i) => (
                <rect
                  key={i}
                  x={p.x}
                  y={p.y}
                  width={PILL_W}
                  height={PILL_H}
                  rx={PILL_R}
                  ry={PILL_R}
                />
              ))}
            </g>
          ))}
        </g>

        {/* ---------- Stadium + marching text ---------- */}
        <defs>
          <path id="keep-scrolling-stadium" d={STADIUM_PATH} />
        </defs>

        <g className="keep-scrolling__zoom" data-ks-zoom>
          <use
            href="#keep-scrolling-stadium"
            className="keep-scrolling__stadium-fill"
            data-ks-fill
            stroke="none"
          />
          <use
            href="#keep-scrolling-stadium"
            className="keep-scrolling__stadium-stroke"
            data-ks-stroke
            fill="none"
          />

          {/* dy seats the glyphs *inside* the stadium outline: textPath
            * parks them outside a clockwise path by default, so we pull
            * them across the stroke by ~0.9em. (`side="right"` would be
            * the clean way, but Chrome still doesn't render it.) */}
          <text className="keep-scrolling__text" data-ks-text dy="-15">
            <textPath href="#keep-scrolling-stadium" startOffset="0%">
              {SCROLL_TEXT}
              {/* March the text around the stadium loop indefinitely.
                * -100% lands on the start of the next repetition, making
                * the loop seamless. Untouched by GSAP — it keeps marching
                * through the flood and the whiteout. */}
              <animate
                attributeName="startOffset"
                from="0%"
                to="-100%"
                dur="22s"
                repeatCount="indefinite"
              />
            </textPath>
          </text>
        </g>
      </svg>

      {/* Whiteout veil — *above* the SVG (DOM order) so it covers the
       * marching text and stadium too as it fades in, landing the stage on
       * pure white exactly when the pin releases. */}
      <div className="keep-scrolling__whiteout" data-ks-whiteout aria-hidden="true" />
    </section>
  );
}

export default KeepScrolling;
