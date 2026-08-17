"use client";

import { motion, useReducedMotion } from "motion/react";
import { LiquidMetalBg } from "./LiquidMetalBg";
import { HeroWordmark } from "./HeroWordmark";
import "./MonologHero.css";

/**
 * Hallmark · atmospheric · studied DNA from Monolog.
 *
 * Client component — framer-motion drives the load-in entrance.
 * Three vertical regions:
 *   1. edge-aligned nav (wordmark left, links centre, sound + CTA right)
 *   2. centred pitch (small wireframe mic icon + a single prose paragraph)
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
  /** Headline paragraph. */
  para1?: string;
  /** Right-side CTA copy + href. */
  cta?: { label: string; href: string };
}

const DEFAULT_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Work", href: "#success-stories" },
  { label: "Services", href: "#services" },
  { label: "FAQ", href: "#faq" },
] as const;

export function MonologHero({
  brand = "eventclassics.in",
  navLinks = DEFAULT_LINKS,
  para1 = "We design change-making website experiences for brands whose reputation has outgrown their digital presence.",
  cta = { label: "Start a project", href: "#start" },
}: MonologHeroProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <>
      <section className="m-hero" id="home">
        {/* Shader background — pinned to the hero's bounding box
         * (position: absolute via .liquid-metal-bg), sits at z-index: -1
         * so the fixed nav (200) and wordmark (300) both render above it
         * while every in-flow descendant (the pitch) still paints above
         * the shader within the section's stacking context. */}
        <LiquidMetalBg />

        <div className="m-hero__pitch">
          {/* <svg
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
          </svg> */}

          <motion.p
            className="m-hero__para"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: "easeInOut" }}
          >
            {para1}
          </motion.p>
        </div>

        {/* In-flow spacer only — reserves the hero's bottom row height.
         * The actual fixed wordmark lives in .m-hero__wordmark-blend
         * below (outside the section) so its difference blend group
         * participates in the ROOT stacking context, not the hero's
         * (z-index: 10) — a blend group trapped inside the hero would
         * only ever invert against the hero's own interior. */}
        <div className="m-hero__wordmark-bar" aria-hidden="true" />
      </section>

      {/* Fixed nav — rendered OUTSIDE the hero section on purpose. The
       * nav is a container-level mix-blend-mode: difference group, and
       * a blend group blends only with the content behind it inside the
       * SAME stacking context. Kept inside .m-hero (z-index: 10) its
       * backdrop would be the hero's interior alone — the nav would
       * render raw white over every section past the hero. As a body
       * child it participates in the root stacking context, so the
       * header inverts against whichever section is actually behind it. */}
      <nav className="m-hero__nav" aria-label="Primary">
        {/* Left spacer — keeps the links visually centred in the
         * viewport between the fixed wordmark (left overlay) and the
         * actions (right). aria-hidden because the wordmark itself is
         * decorative (the page title conveys the brand). */}
        <div className="m-hero__nav-brand" aria-hidden="true" />

        <ul className="m-hero__links" role="list">
          {navLinks.map((link, i) => (
            <motion.li
              key={link.label}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{
                delay: 0.55 + i * 0.07,
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              <a href={link.href}>{link.label}</a>
            </motion.li>
          ))}
        </ul>

        <div className="m-hero__actions" />
      </nav>

      {/* Primary CTA — fixed, OUTSIDE the nav so its complete pill can
       * difference-blend as one group against the current section.
       * Position mirrors the nav band: top matches the nav's
       * padding-block, right matches its padding-inline.
       *
       * Also deliberately outside <section class="m-hero">: the hero sets
       * z-index: 10, which would cap this element's own z-index: 200
       * inside that stacking context and let the nav (200) and pinned
       * section visuals (e.g. .gap__display) paint over the pill. As a
       * body-level sibling it keeps its true 200. The mobile layout in
       * MonologHero.css repositions it without reparenting. */}
      <motion.a
        className="m-hero__cta"
        href={cta.href}
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.6, ease: "easeInOut" }}
      >
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
      </motion.a>

      {/* Fixed full-viewport blend group for the wordmark — rendered
       * outside the hero section for the same stacking-context reason
       * as the nav above (see .m-hero__wordmark-blend in
       * MonologHero.css for the blend/transform rationale). */}
      <div className="m-hero__wordmark-blend" aria-hidden="true">
        <HeroWordmark text={brand} />
      </div>
    </>
  );
}

export default MonologHero;
