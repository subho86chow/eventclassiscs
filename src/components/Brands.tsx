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
 * Desktop uses a 30/70 editorial split: the section label occupies the
 * left column while both logo rows occupy the right column. Their outer
 * top edges share one grid row; mobile stacks the label above the logos.
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
      <div className="brands__layout">
        <header className="brands__header">
          <span className="brands__dot" aria-hidden="true" />
          <span className="brands__label">Brands we&apos;ve helped</span>
        </header>

        <div className="brands__rows">
          <div className="brands__row" role="list">
            {ROW_1.map((slot) => (
              <BrandCell key={slot.name} slot={slot} />
            ))}
          </div>

          <hr className="brands__rule" />

          <div className="brands__row" role="list">
            {ROW_2.map((slot) => (
              <BrandCell key={slot.name} slot={slot} />
            ))}
          </div>

          <hr className="brands__rule" />
        </div>
      </div>
    </section>
  );
}

export default Brands;
