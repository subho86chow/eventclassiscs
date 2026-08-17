import "./FinalCta.css";

/**
 * Hallmark · "Final CTA" section.
 *
 * A short editorial close before the footer. Mirrors the voice of the
 * hero's pitch and Statement section: short, declarative lines stacked
 * on a dark canvas, ending with the primary CTA (which links back up
 * to the contact / closing motion). The CTA re-uses the
 * `.m-hero__cta` class for visual continuity with the hero's pill.
 */

interface FinalCtaProps {
  /** Three editorial lines stacked above the CTA. */
  lines?: ReadonlyArray<string>;
  /** CTA label + href. */
  cta?: { label: string; href: string };
}

export function FinalCta({
  lines = [
    "Your business has already done the hard part.",
    "You've built something worth noticing.",
    "Now make sure the market sees it.",
  ],
  cta = { label: "Let's close the gap", href: "#book" },
}: FinalCtaProps) {
  return (
    <section className="final-cta" id="final-cta">
      <div className="final-cta__inner">
        <p className="final-cta__copy">
          {lines.map((line, i) => (
            <span key={i} className="final-cta__line">
              {line}
            </span>
          ))}
        </p>

        <p className="final-cta__kicker">Start a conversation</p>

        <a className="m-hero__cta final-cta__button" href={cta.href}>
          <span className="m-hero__cta-label">{cta.label}</span>
          <span className="m-hero__cta-arrow" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}

export default FinalCta;