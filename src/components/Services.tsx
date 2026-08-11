"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./Services.css";

// Unused — kept around in case row-aligned re-introduction is wanted.
// (Referenced via `useRef` only; the import satisfies strict TS but the
// variable could be removed without runtime impact.)

/**
 * Hallmark · "What we can help with" / testimonials section.
 *
 * Two-column layout:
 *   col 1 (left)  · pager + (REAL CLIENT STORIES) + rotating testimonial
 *                   with a CSS-animated progress bar, plus byline + avatar.
 *                   Every 15 s the active testimonial crossfades to the
 *                   next; the progress bar resets in lock-step.
 *   col 2 (right) · "● What we can help with" header + services list.
 *                   Each row is dim by default; on hover it goes full
 *                   opacity and reveals a floating image to the right of
 *                   the list, vertically aligned to the hovered row.
 *
 * prefers-reduced-motion disables both the carousel and the hover image.
 */

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  /** Background for the avatar circle placeholder. */
  avatarFrom: string;
  avatarTo: string;
}

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  {
    quote:
      "For years, our website struggled to showcase our work effectively and attract the right clients. Within just 30 days of launching the new site with eventclassics, we generated $100k in new sales and receive 2-3 qualified inquiries every week.",
    author: "Andrew Tynes",
    role: "Owner, Mammoth Murals",
    avatarFrom: "oklch(60% 0.10 40)",
    avatarTo: "oklch(40% 0.08 25)",
  },
  {
    quote:
      "eventclassics rebuilt our entire brand presence in six weeks. Their team translated our operational complexity into a site investors actually understand — and the inbound shifted within a quarter.",
    author: "Priya Anand",
    role: "Co-founder, Verdant Group",
    avatarFrom: "oklch(60% 0.10 240)",
    avatarTo: "oklch(40% 0.08 200)",
  },
  {
    quote:
      "We were shipping great events and a website that read like a brochure. eventclassics found the through-line — every page, every deck, every email now carries the same argument.",
    author: "Huy Nguyen",
    role: "Founder, eventclassics",
    avatarFrom: "oklch(60% 0.10 90)",
    avatarTo: "oklch(40% 0.08 60)",
  },
];

interface Service {
  name: string;
  /** Placeholder image background (used until a real asset lands). */
  imageFrom: string;
  imageTo: string;
  imageLabel: string;
}

const SERVICES: ReadonlyArray<Service> = [
  { name: "Brand Strategy",       imageFrom: "oklch(35% 0.04 30)",  imageTo: "oklch(15% 0.04 20)",  imageLabel: "BRAND STRATEGY" },
  { name: "Visual Identity",      imageFrom: "oklch(35% 0.04 90)",  imageTo: "oklch(15% 0.04 70)",  imageLabel: "VISUAL IDENTITY" },
  { name: "Website Strategy",     imageFrom: "oklch(35% 0.04 200)", imageTo: "oklch(15% 0.04 180)", imageLabel: "WEBSITE STRATEGY" },
  { name: "Website Design",       imageFrom: "oklch(35% 0.04 260)", imageTo: "oklch(15% 0.04 240)", imageLabel: "WEBSITE DESIGN" },
  { name: "3D Development",       imageFrom: "oklch(35% 0.04 60)",  imageTo: "oklch(15% 0.04 40)",  imageLabel: "3D DEVELOPMENT" },
];

const ROTATION_INTERVAL_MS = 15000;

export function Services() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /* Refs for each services row (kept for any future row-aligned effect;
   * the image column itself is now in normal grid flow). */
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  /* Carousel — advances every 15 s. Skipped under prefers-reduced-motion.
   * The progress bar is a CSS animation that runs in lock-step (see
   * .services__progress-bar in Services.css). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  /* Reset the progress bar's CSS animation whenever the testimonial
   * changes (either from the 15 s tick or from a manual click), so the
   * bar always starts filling from 0 % for the freshly-active card. */
  useLayoutEffect(() => {
    const bar = document.querySelector<HTMLElement>(
      `[data-progress-bar-for="${activeIndex}"]`,
    );
    if (!bar) return;
    bar.style.animation = "none";
    // Force a reflow so the animation restart actually retriggers.
    void bar.offsetWidth;
    bar.style.animation = "";
  }, [activeIndex]);

  /* The image column always shows a tile — either the hovered service's
   * gradient or a "hover a service" placeholder. */
  const hoverImage = hoveredIndex !== null ? SERVICES[hoveredIndex] : null;

  return (
    <section className="services" id="services">
      <div className="services__inner">
        {/* ───── Col 1 — testimonial carousel ───── */}
        <div className="services__left">
          <header className="services__header-row">
            <div
              className="services__pager"
              aria-label="Section navigation"
            >
              <button
                type="button"
                className="services__arrow"
                aria-label="Previous testimonial"
                disabled={activeIndex === 0}
                onClick={() =>
                  setActiveIndex((i) => Math.max(0, i - 1))
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="20" y1="12" x2="4" y2="12" />
                  <polyline points="10 18 4 12 10 6" />
                </svg>
              </button>
              <button
                type="button"
                className="services__arrow"
                aria-label="Next testimonial"
                onClick={() =>
                  setActiveIndex((i) => (i + 1) % TESTIMONIALS.length)
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <polyline points="14 6 20 12 14 18" />
                </svg>
              </button>
              <span className="services__pager-count" aria-hidden="true">
                {String(activeIndex + 1).padStart(2, "0")}/
                {String(TESTIMONIALS.length).padStart(2, "0")}
              </span>
            </div>
          </header>

          <p className="services__label">(REAL CLIENT STORIES)</p>

          <div className="services__quote-area">
            {TESTIMONIALS.map((t, i) => (
              <article
                key={t.author}
                className={`services__quote ${
                  i === activeIndex ? "services__quote--active" : ""
                }`}
                aria-hidden={i !== activeIndex}
              >
                <p className="services__quote-text">&ldquo;{t.quote}&rdquo;</p>

                <div className="services__author">
                  <div
                    className="services__avatar"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg, ${t.avatarFrom}, ${t.avatarTo})`,
                    }}
                  >
                    {(() => {
                      const initials = t.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return initials;
                    })()}
                  </div>
                  <div className="services__author-text">
                    <div className="services__author-name">{t.author}</div>
                    <div className="services__author-role">{t.role}</div>
                  </div>
                </div>

                <div className="services__progress" aria-hidden="true">
                  <div
                    className="services__progress-bar"
                    data-progress-bar-for={i}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ───── Col 2 — services list ───── */}
        <div className="services__right">
          <header className="services__label-row">
            <span className="services__dot" aria-hidden="true" />
            <span className="services__label-text">What we can help with</span>
          </header>

          <ul className="services__list">
            {SERVICES.map((s, i) => (
              <li
                key={s.name}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={`services__item ${
                  hoveredIndex === i ? "services__item--active" : ""
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex(null)}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        {/* ───── Col 3 — image (always visible; updates with hover) ───── */}
        <div className="services__image-col" aria-hidden="true">
          {hoverImage ? (
            <div
              key={hoveredIndex}
              className="services__hover-image"
              style={{
                background: `linear-gradient(135deg, ${hoverImage.imageFrom}, ${hoverImage.imageTo})`,
              }}
            >
              <span className="services__hover-image-label">
                {hoverImage.imageLabel}
              </span>
            </div>
          ) : (
            <div className="services__hover-image services__hover-image--placeholder">
              <span className="services__hover-image-label">
                Hover a service
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Services;