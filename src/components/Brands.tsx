import "./Brands.css";

/**
 * Hallmark · "Brands we've helped" section.
 *
 * Two rows of four client logos with hairline rules between, on a white
 * surface — sits after the MonologHero. The logo cells render each
 * brand's wordmark as a styled text placeholder; drop real SVGs into
 * `src/components/brand-logos/` and swap the wordmark string for an
 * `<Image>` / inline `<svg>` when you have them.
 *
 * Layout (top → bottom):
 *   1. Header label        — sticks to the left edge (no offset)
 *   2. Hairline rule       — full section width
 *   3. Row 1               — offset 30 vw from left on desktop+tablet
 *   4. Hairline rule       — full section width
 *   5. Row 2               — offset 30 vw from left on desktop+tablet
 *   6. Hairline rule       — full section width
 *
 * The 30 vw offset on the rows gives the section an editorial,
 * right-anchored feel; the header label stays flush left so it reads as
 * a label for what follows.
 */

interface BrandSlot {
  /** Mono caption shown below the logo. */
  name: string;
  /** Wordmark rendered as the placeholder logo. */
  wordmark: string;
  /** Visual variant — different weight/case so the row reads varied. */
  variant: "serif" | "italic" | "condensed" | "monogram" | "wide";
}

const ROW_1: ReadonlyArray<BrandSlot> = [
  { name: "Vinamilk", wordmark: "Vinamilk", variant: "italic" },
  { name: "Moc Chau Creamery", wordmark: "MOC CHÂU", variant: "condensed" },
  { name: "University of Sydney", wordmark: "THE UNIVERSITY OF SYDNEY", variant: "wide" },
  { name: "OH Architecture", wordmark: "OH", variant: "monogram" },
];

const ROW_2: ReadonlyArray<BrandSlot> = [
  { name: "Supersolid Agency", wordmark: "Supersolid", variant: "serif" },
  { name: "Slik Agency", wordmark: "SLIK", variant: "condensed" },
  { name: "Mammoth Murals", wordmark: "MAMMOTH", variant: "wide" },
  { name: "Backhouse", wordmark: "BACKHOUSE", variant: "monogram" },
];

function Logo({ wordmark, variant }: { wordmark: string; variant: BrandSlot["variant"] }) {
  return (
    <div className={`brands__logo brands__logo--${variant}`}>
      <span className="brands__wordmark">{wordmark}</span>
    </div>
  );
}

function BrandCell({ slot }: { slot: BrandSlot }) {
  return (
    <div className="brands__cell">
      <Logo wordmark={slot.wordmark} variant={slot.variant} />
      <span className="brands__name">{slot.name}</span>
    </div>
  );
}

export function Brands() {
  return (
    <section className="brands" id="work">
      {/* Header label — sticks to the left, no offset, no hairline
       * directly below it (the hairlines belong to the rows div, not the
       * label div). */}
      <div className="brands__top">
        <header className="brands__header">
          <span className="brands__dot" aria-hidden="true" />
          <span className="brands__label">Brands we've helped</span>
        </header>
      </div>

      {/* Row 1 — offset 30 vw from left on desktop+tablet */}
      <div className="brands__inner">
        <div className="brands__row" role="list">
          {ROW_1.map((slot) => (
            <BrandCell key={slot.name} slot={slot} />
          ))}
        </div>
      </div>

      {/* Full-width hairline (boundary of the rows div, between rows) */}
      <hr className="brands__rule" />

      {/* Row 2 — offset 30 vw from left on desktop+tablet */}
      <div className="brands__inner">
        <div className="brands__row" role="list">
          {ROW_2.map((slot) => (
            <BrandCell key={slot.name} slot={slot} />
          ))}
        </div>
      </div>

      {/* Full-width hairline (boundary of the rows div, at bottom) */}
      <hr className="brands__rule" />
    </section>
  );
}

export default Brands;