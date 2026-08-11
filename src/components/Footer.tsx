import { RotatingLogo } from "./RotatingLogo";
import "./Footer.css";

/**
 * Hallmark · site footer.
 *
 * Two-region layout on a dark canvas:
 *   left column  · large editorial nav list (About, Work, Process,
 *                 Services, Resources, Contact) with hairline dividers.
 *   right column · 3D rotating logo on top, then "(STUDIO DETAILS)" and
 *                 "(SOCIALS)" stacked side-by-side on desktop and
 *                 collapsing to a single column on mobile.
 */

const NAV_ITEMS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "About",     href: "#about" },
  { label: "Work",      href: "#work" },
  { label: "Process",   href: "#process" },
  { label: "Services",  href: "#services" },
  { label: "Resources", href: "#resources" },
  { label: "Contact",   href: "#contact" },
];

const SOCIAL_ITEMS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "YouTube",   href: "#" },
  { label: "LinkedIn",  href: "#" },
  { label: "Instagram", href: "#" },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* ───── Nav (left column) ───── */}
        <nav className="footer__nav-col" aria-label="Site navigation">
          <header className="footer__nav-header">
            <span className="footer__dot" aria-hidden="true" />
            <span className="footer__nav-label">Navigation</span>
          </header>

          <ul className="footer__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="footer__nav-item">
                <a className="footer__nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ───── Right column: 3D on top, Details + Socials below ───── */}
        <div className="footer__right-col">
          {/* 3D object */}
          <div className="footer__threed-wrap" aria-hidden="true">
            <RotatingLogo />
          </div>

          {/* Studio details + Socials side by side */}
          <div className="footer__details-socials">
            <div className="footer__details">
              <span className="footer__micro-label">(STUDIO DETAILS)</span>

              <a
                className="footer__email"
                href="mailto:hello@eventclassics.com"
              >
                <span className="footer__email-icon" aria-hidden="true">@</span>
                <span className="footer__email-text">hello@eventclassics.com</span>
              </a>

              <p className="footer__location">
                Based in Kolkata, India
                <br />
                Working Worldwide.
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
    </footer>
  );
}

export default Footer;