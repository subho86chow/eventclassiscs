import { LiquidMetalBg } from "./LiquidMetalBg";
import { HeroWordmark } from "./HeroWordmark";
import "./MonologHero.css";

/**
 * Hallmark · atmospheric · studied DNA from Monolog.
 *
 * Server component. Three vertical regions:
 *   1. edge-aligned nav (wordmark left, links centre, sound + CTA right)
 *   2. centred pitch (small wireframe mic icon + two prose paragraphs)
 *   3. massive cropped wordmark bleeding off viewport edges
 *
 * Copy & link labels mirror the Monolog reference verbatim per the user's
 * brief — only the bottom wordmark text swaps to "eventclassics".
 *
 * The bottom wordmark is a `<HeroWordmark>` (client component). As the
 * hero scrolls out, it transforms from bottom-centre → top-left of the
 * viewport and becomes the sticky header wordmark.
 */

interface MonologHeroProps {
  /** Brand text used for both the nav wordmark and the bottom wordmark. */
  brand?: string;
  /** Nav centre links (defaults to the Monolog reference order). */
  navLinks?: ReadonlyArray<{ label: string; href: string }>;
  /** Headline paragraph 1. */
  para1?: string;
  /** Headline paragraph 2. */
  para2?: string;
  /** Right-side CTA copy + href. */
  cta?: { label: string; href: string };
}

const DEFAULT_LINKS = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
] as const;

export function MonologHero({
  brand = "eventclassics",
  navLinks = DEFAULT_LINKS,
  para1 = "We design change-making website experiences that finally reflect what you've actually built.",
  para2 = "For established brands whose reputation has outgrown their digital presence.",
  cta = { label: "Start a project", href: "#start" },
}: MonologHeroProps) {
  return (
    <section className="m-hero">
      {/* Shader background — pinned to the hero's bounding box
       * (position: absolute via .liquid-metal-bg), sits at z-index: -1
       * so the fixed nav (200) and wordmark (300) both render above it
       * while every in-flow descendant (the pitch) still paints above
       * the shader within the section's stacking context. */}
      <LiquidMetalBg />

      <nav className="m-hero__nav" aria-label="Primary">
        {/* Left spacer — keeps the links visually centred in the
         * viewport between the fixed wordmark (left overlay) and the
         * actions (right). aria-hidden because the wordmark itself is
         * decorative (the page title conveys the brand). */}
        <div className="m-hero__nav-brand" aria-hidden="true" />

        <ul className="m-hero__links" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="m-hero__actions">
          <button
            type="button"
            className="m-hero__toggle"
            aria-label="Toggle sound"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </button>
          <a className="m-hero__cta" href={cta.href}>
            <span>{cta.label}</span>
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
          </a>
        </div>
      </nav>

      <div className="m-hero__pitch">
        <svg
          className="m-hero__icon"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="18" y="4" width="12" height="22" rx="6" />
          <line x1="24" y1="26" x2="24" y2="40" />
          <line x1="14" y1="14" x2="10" y2="14" />
          <line x1="34" y1="14" x2="38" y2="14" />
          <line x1="14" y1="20" x2="10" y2="20" />
          <line x1="34" y1="20" x2="38" y2="20" />
          <line x1="12" y1="34" x2="36" y2="34" />
        </svg>

        <p className="m-hero__para">{para1}</p>
        <p className="m-hero__para">{para2}</p>
      </div>

      <div className="m-hero__wordmark-bar" aria-hidden="true">
        <HeroWordmark text={brand} />
      </div>
    </section>
  );
}

export default MonologHero;