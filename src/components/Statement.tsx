"use client";

import { useEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Statement.css";

/**
 * Hallmark · editorial "Section 01/02" statement.
 *
 * Dark-bg two-column layout that sits after the Brands section. Left
 * column carries pagination + a stat block; right column carries the
 * big editorial copy; bottom-right holds the byline.
 */

interface StatementProps {
  /** Pagination numerator shown next to the arrows (e.g. "01" out of "02"). */
  current?: string;
  /** Pagination denominator. */
  total?: string;
  /** The big numeric stat (e.g. "15+"). */
  stat?: string;
  /** Caption under the stat — what the number counts. */
  statCaption?: string;
  /** Two paragraphs of editorial copy. */
  paragraphs?: ReadonlyArray<string>;
  /** Author byline (display name + role). */
  bylineName?: string;
  bylineRole?: string;
  /** Initial(s) shown in the byline avatar circle when no photo is provided. */
  bylineInitials?: string;
}

export function Statement({
  current = "01",
  total = "02",
  stat = "15+",
  statCaption = "Founder-led brands from disruptive creative agencies to consumer brands",
  paragraphs = [
    "Great founders changing the world deserve a presence as powerful as what they're building. Most founders we work with have built something significant, but their brand doesn't shows it yet.",
    "That gap costs more than revenue. It costs the certainty that your brand is finally being understood.",
  ],
  bylineName = "Huy (By Huy) Nguyen",
  bylineRole = "Founder, eventclassics",
  bylineInitials = "H",
}: StatementProps) {
  /* Scroll-driven letter-by-letter opacity reveal: every character in the
   * editorial copy is wrapped in `.statement__letter` and animated from
   * opacity 0.1 → 1 with a letter-by-letter stagger, scrubbed to scroll
   * position. The reveal completes as the text's top edge passes the
   * viewport midpoint. prefers-reduced-motion skips the GSAP setup. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".statement__letter",
        { opacity: 0.1 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.035,
          scrollTrigger: {
            trigger: ".statement__copy",
            /* start: text top reaches the viewport's vertical midpoint
             *       (already past center, fully in the upper viewport).
             * end:   text top crosses the viewport top edge.
             * The stagger distributes each letter's animation across this
             * shorter scroll range, so letters reveal one after another
             * as the section's midpoint clears the viewport center. */
            start: "top center",
            end: "top top",
            scrub: true,
          },
        },
      );
    }, document.querySelector(".statement") ?? undefined);

    return () => ctx.revert();
  }, []);

  /* Split a paragraph into per-character spans so each letter is its own
   * animated target. Regular spaces preserve normal word wrapping while
   * inline letter spans prevent mobile lines from breaking mid-word. */
  function splitChars(text: string): ReactNode {
    return text.split("").map((char, i) => (
      <span key={i} className="statement__letter">
        {char}
      </span>
    ));
  }

  return (
    <section className="statement" id="statement">
      <div className="statement__inner">
        <div className="statement__left-column">
          {/* Top-left: pagination nav */}
          <nav className="statement__pager" aria-label="Section navigation">
            <div className="statement__arrows">
              <button
                type="button"
                className="statement__arrow"
                aria-label="Previous section"
                disabled
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="20" y1="12" x2="4" y2="12" />
                  <polyline points="10 18 4 12 10 6" />
                </svg>
              </button>
              <button
                type="button"
                className="statement__arrow"
                aria-label="Next section"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <polyline points="14 6 20 12 14 18" />
                </svg>
              </button>
            </div>
            <span className="statement__pager-count" aria-hidden="true">
              {current}/{total}
            </span>
          </nav>

          {/* Left column: stat block */}
          <div className="statement__left">
            <div className="statement__stat">{stat}</div>
            <p className="statement__caption">{statCaption}</p>
          </div>
        </div>

        {/* Right column: editorial copy */}
        <div className="statement__right">
          {paragraphs.map((p, i) => (
            <p key={i} className="statement__copy" aria-label={p}>
              {splitChars(p)}
            </p>
          ))}
        </div>

        {/* Bottom-right: byline */}
        <div className="statement__byline">
          <div className="statement__avatar" aria-hidden="true">
            {bylineInitials}
          </div>
          <div className="statement__byline-text">
            <div className="statement__byline-name">{bylineName}</div>
            <div className="statement__byline-role">{bylineRole}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Statement;
