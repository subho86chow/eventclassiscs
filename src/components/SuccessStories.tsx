"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./SuccessStories.css";

/**
 * Hallmark · "Success Stories" section.
 *
 * White-bg three-column grid:
 *   col 1  · sticky "Success Stories" label, fixed for the section's height
 *   col 2  · stacked project images
 *   col 3  · stacked project text blocks (pager + title + description + stat)
 *
 * CSS Grid auto-flows each project's image and text into the same row, so
 * they scroll past in lock-step as the user moves through the section.
 */

interface Project {
  title: string;
  description: string;
  stat: string;
  statCaption: string;
  image: string;
}

/* Vertical travel of the image inside its frame, as a percentage of the
 * image element's own height. The image is rendered taller than the frame
 * (see PARALLAX_OVERSCAN in the CSS) so this slide never exposes an edge. */
const PARALLAX_SHIFT = 8;

const PROJECTS: ReadonlyArray<Project> = [
  {
    title: "OH Architecture",
    description:
      "Brand refresh and website for a practice with a decade of crafting high-end homes for Australian families.",
    stat: "21%",
    statCaption:
      "Increase in conversions with projects starting from $2M+",
    image: "/services.png",
  },
  {
    title: "Lighthouse Studios",
    description:
      "Brand identity and event microsite for an independent film studio launching its first feature-length documentary.",
    stat: "3.4×",
    statCaption:
      "Increase in inbound enquiries during the film's festival run",
    image: "/services.png",
  },
  {
    title: "Halcyon Events",
    description:
      "Brand system, website, and on-site signage programme for a boutique event studio launching its first hotel residency.",
    stat: "47%",
    statCaption:
      "Lift in direct booking conversions in the first quarter post-launch",
    image: "/services.png",
  },
  {
    title: "Verdant Group",
    description:
      "End-to-end brand and digital identity for a sustainability consultancy entering its first public-funding round.",
    stat: "1.8×",
    statCaption:
      "Increase in qualified investor meetings booked in the first 60 days",
    image: "/services.png",
  },
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function SuccessStories() {
  const total = PROJECTS.length;
  const sectionRef = useRef<HTMLElement>(null);

  /* Parallax — each image slides vertically inside its fixed frame, scrubbed
   * 1:1 to that frame's travel through the viewport.
   *
   * Why GSAP ScrollTrigger and not CSS `animation-timeline: view()`: the CSS
   * scroll-driven timeline is still Chromium-only (Safari and Firefox have no
   * stable support as of 2026), and the section already runs GSAP +
   * ScrollTrigger in KeepScrolling/HeroWordmark, so this adds no new bytes and
   * keeps one scroll-driver authoritative for the whole page.
   *
   * `start: "top bottom"` / `end: "bottom top"` maps the full traversal —
   * frame entering the bottom edge → leaving the top edge — onto the tween,
   * so the drift reads continuously rather than snapping at a boundary. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      section
        .querySelectorAll<HTMLElement>("[data-ss-parallax]")
        .forEach((imageEl) => {
          gsap.fromTo(
            imageEl,
            { yPercent: -PARALLAX_SHIFT },
            {
              yPercent: PARALLAX_SHIFT,
              ease: "none",
              /* Own GPU layer — the per-frame transform writes then never
               * trigger layout or paint on the surrounding grid. */
              force3D: true,
              scrollTrigger: {
                trigger: imageEl.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="success-stories" id="success-stories">
      <div className="success-stories__inner">
        {/* Col 1 — sticky label only. Spans every row in the section so
         * the label stays in view for the entire section's scroll height
         * (project rows + divider rows). Placement lives in CSS so the
         * ≤960px breakpoint can unwind it — see the note on the row vars
         * below. */}
        <div className="success-stories__label-col">
          <span className="success-stories__dot" aria-hidden="true" />
          <span className="success-stories__label">Success Stories</span>
        </div>

        {/* Col 2 + Col 3 — every project's image and text share a row,
         * separated from the previous project by a divider row that spans
         * only cols 2 + 3 (the label column stays clear). Project rows
         * are odd (1, 3, 5, 7); divider rows are even (2, 4, 6).
         *
         * Only the row INDEX is passed inline (as a custom property); the
         * column and row assignment itself is CSS. Inline grid placement
         * would outrank the stacking media query, which is what previously
         * dropped each figure into an implicit content-sized column and
         * collapsed it to height 0 below 960px. */}
        {PROJECTS.map((project, i) => (
          <Fragment key={project.title}>
            {i > 0 && (
              <div
                className="success-stories__divider"
                aria-hidden="true"
                style={{ "--ss-row": i * 2 } as CSSProperties}
              />
            )}
            <figure
              className="success-stories__image-figure"
              style={{ "--ss-row": i * 2 + 1 } as CSSProperties}
            >
              {/* The frame div — not the <Image> — is the parallax target.
               * next/image `fill` injects inline `inset:0; height:100%`, which
               * outranks any class selector, so the overscan has to live on a
               * wrapper the image can fill instead. The wrapper is taller than
               * the figure so it slides without revealing an edge. */}
              <div className="success-stories__image-frame" data-ss-parallax="">
                <Image
                  src={project.image}
                  alt={`${project.title} project imagery`}
                  fill
                  sizes="(max-width: 960px) 100vw, 50vw"
                  className="success-stories__image"
                  priority={i === 0}
                />
              </div>
            </figure>

            <article
              className="success-stories__text-block"
              style={{ "--ss-row": i * 2 + 1 } as CSSProperties}
            >
              <div
                className="success-stories__pager"
                aria-label={`Case ${i + 1} of ${total}`}
              >
                <span className="success-stories__pager-tag">SS</span>
                <span className="success-stories__pager-arrow" aria-hidden="true">
                  →
                </span>
                <span className="success-stories__pager-count">
                  <span className="success-stories__pager-current">
                    {pad2(i + 1)}
                  </span>
                  <span className="success-stories__pager-sep">/</span>
                  <span className="success-stories__pager-total">
                    {pad2(total)}
                  </span>
                </span>
              </div>

              <h2 className="success-stories__title">{project.title}</h2>
              <p className="success-stories__description">
                {project.description}
              </p>

              <div className="success-stories__stat-block">
                <div className="success-stories__stat">{project.stat}</div>
                <p className="success-stories__stat-caption">
                  {project.statCaption}
                </p>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default SuccessStories;