import { Fragment } from "react";
import Noise from "./Noise";
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
}

const PROJECTS: ReadonlyArray<Project> = [
  {
    title: "OH Architecture",
    description:
      "Brand refresh and website for a practice with a decade of crafting high-end homes for Australian families.",
    stat: "21%",
    statCaption:
      "Increase in conversions with projects starting from $2M+",
  },
  {
    title: "Lighthouse Studios",
    description:
      "Brand identity and event microsite for an independent film studio launching its first feature-length documentary.",
    stat: "3.4×",
    statCaption:
      "Increase in inbound enquiries during the film's festival run",
  },
  {
    title: "Halcyon Events",
    description:
      "Brand system, website, and on-site signage programme for a boutique event studio launching its first hotel residency.",
    stat: "47%",
    statCaption:
      "Lift in direct booking conversions in the first quarter post-launch",
  },
  {
    title: "Verdant Group",
    description:
      "End-to-end brand and digital identity for a sustainability consultancy entering its first public-funding round.",
    stat: "1.8×",
    statCaption:
      "Increase in qualified investor meetings booked in the first 60 days",
  },
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function SuccessStories() {
  const total = PROJECTS.length;

  return (
    <section className="success-stories" id="success-stories">
      {/* Subtle film-grain noise over the whole section. Pinned absolutely,
       * pointer-events:none so it never blocks clicks. The .noise-overlay
       * styles (100vw × 100vh) will overflow horizontally — clip it on the
       * section so we don't trigger horizontal scroll. */}
      <div className="success-stories__noise">
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={12}
        />
      </div>

      <div className="success-stories__inner">
        {/* Col 1 — sticky label only. Spans every row in the section so
         * the label stays in view for the entire section's scroll height
         * (project rows + divider rows). `1 / -1` spans from row 1 to the
         * last auto-generated row. */}
        <div
          className="success-stories__label-col"
          style={{ gridColumn: 1, gridRow: "1 / -1" }}
        >
          <span className="success-stories__dot" aria-hidden="true" />
          <span className="success-stories__label">Success Stories</span>
        </div>

        {/* Col 2 + Col 3 — every project's image and text share a row,
         * separated from the previous project by a divider row that spans
         * only cols 2 + 3 (the label column stays clear). Project rows
         * are odd (1, 3, 5, 7); divider rows are even (2, 4, 6). */}
        {PROJECTS.map((project, i) => (
          <Fragment key={project.title}>
            {i > 0 && (
              <div
                className="success-stories__divider"
                aria-hidden="true"
                style={{ gridColumn: "2 / 4", gridRow: i * 2 }}
              />
            )}
            <figure
              className="success-stories__image-figure"
              style={{ gridColumn: 2, gridRow: i * 2 + 1 }}
            >
              {/* Placeholder. Drop a real <Image src="..." fill sizes="..."
               * className="success-stories__image" /> here once the asset
               * is ready. */}
              <div className="success-stories__image" aria-hidden="true">
                <span className="success-stories__image-label">
                  {project.title}
                </span>
              </div>
            </figure>

            <article
              className="success-stories__text-block"
              style={{ gridColumn: 3, gridRow: i * 2 + 1 }}
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