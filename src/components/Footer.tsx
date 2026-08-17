import { MagneticButton } from "@/components/ui/magnetic-button";
import "./Footer.css";

/**
 * Hallmark · site footer.
 *
 * Two-region layout on a dark canvas:
 *   left column  · large editorial nav list (About, Work, Process,
 *                 Services, Resources, Contact) with hairline dividers.
 *   right column · looping logo video on top, then "(STUDIO DETAILS)" and
 *                 "(SOCIALS)" stacked side-by-side on desktop and
 *                 collapsing to a single column on mobile.
 */

const NAV_ITEMS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "About",    href: "#about" },
  { label: "Work",     href: "#success-stories" },
  { label: "Services", href: "#services" },
  { label: "Process",  href: "#process" },
  { label: "Resources", href: "#resources" },
  { label: "Contact",  href: "#contact" },
];

const SOCIAL_ITEMS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Facebook", href: "https://www.facebook.com/EventClassics" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/eventclassics.in/",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@EventClassics",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/event-classics-in/?viewAsMember=true",
  },
  { label: "Twitter/X", href: "https://x.com/EventClassicsIN" },
];

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        {/* ───── Nav (left column) ───── */}
        <nav className="footer__nav-col" aria-label="Site navigation">
          {/* Compact brand: lowercase "eventclassics.in" wordmark sits
           * above a single subdued line of brand copy. Keeps the
           * mark small and quiet so the nav list dominates. */}
          <div className="footer__brand">
            <div className="footer__brand-name">eventclassics.in</div>
            <div className="footer__brand-tagline">
              Build something worth remembering.
            </div>
          </div>

          <ul className="footer__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="footer__nav-item">
                <a className="footer__nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            className="footer__magnetic-zone"
            href="mailto:event.classics12@gmail.com"
          >
            <span className="footer__talk-link">
              Let&apos;s Talk <span aria-hidden="true">→</span>
            </span>

            <MagneticButton>
              <span
                className="m-hero__cta footer__contact-button"
              >
                <span>View Contact</span>
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
            </MagneticButton>
          </a>
        </nav>

        {/* ───── Right column: logo on top, Details + Socials below ───── */}
        <div className="footer__right-col">
          <div className="footer__logo-wrap" aria-hidden="true">
            <video
              className="footer__logo-video"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source
                src="/videos/footer-logo-magnific.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          {/* Studio details + Socials side by side */}
          <div className="footer__details-socials">
            <div className="footer__details">
              <span className="footer__micro-label">(STUDIO DETAILS)</span>

              <a
                className="footer__email"
                href="mailto:event.classics12@gmail.com"
              >
                <span className="footer__email-icon" aria-hidden="true">@</span>
                <span className="footer__email-text">event.classics12@gmail.com</span>
              </a>

              <p className="footer__location">
                Based in Kolkata, India
                <br />
                Working worldwide.
              </p>
            </div>

            <div className="footer__socials">
              <span className="footer__micro-label">(SOCIALS)</span>
              <ul className="footer__socials-list">
                {SOCIAL_ITEMS.map((item) => (
                  <li key={item.label} className="footer__socials-item">
                    <a
                      className="footer__socials-link"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="footer__socials-label">{item.label}</span>
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <p className="footer__copyright">
        © Event Classics
      </p>
    </footer>
  );
}

export default Footer;
