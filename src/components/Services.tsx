"use client";

import { useLayoutEffect, useRef, useState } from "react";
import "./Services.css";

/**
 * Hallmark · "What we can help with" services section.
 *
 * Three-column layout:
 *   col 1 (left)  · active service description.
 *   col 2 (middle) · "● What we can help with" header + services list.
 *                   Each row is dim by default; on hover it goes full
 *                   opacity and reveals a floating image to the right of
 *                   the list, vertically aligned to the hovered row.
 *   col 3 (right) · image for the active service.
 */

interface Service {
  name: string;
  /** Short tagline that sits between the name and the description. */
  kicker: string;
  description: string;
  /** Small practice-area tags shown below the description. */
  subItems: ReadonlyArray<string>;
  /** Background image served from /public/services/. */
  image: string;
  imageLabel: string;
}

const SERVICES: ReadonlyArray<Service> = [
  {
    name: "Brand Identity & Positioning",
    kicker: "Be known for something.",
    description:
      "Defining what you own, who it matters to and why anyone should choose you.",
    subItems: ["Research", "Position", "Identity", "Brand System"],
    image: "/services/brand-identity.png",
    imageLabel: "BRAND IDENTITY",
  },
  {
    name: "Growth Strategy & Market Intelligence",
    kicker: "Stop guessing.",
    description:
      "Turning audience behavior, competitor movements and market signals into decisions you can actually execute.",
    subItems: ["Research", "Intelligence", "Roadmap", "Execution"],
    image: "/services/growth-strategy.png",
    imageLabel: "GROWTH STRATEGY",
  },
  {
    name: "Social Media & Audience Growth",
    kicker: "Attention is not the goal.",
    description:
      "Building content and campaigns that turn attention into audience, audience into action and action into growth.",
    subItems: ["Content", "Distribution", "Campaigns", "Performance"],
    image: "/services/social-media.png",
    imageLabel: "SOCIAL MEDIA",
  },
  {
    name: "Content Creation & Production",
    kicker: "Short. Crisp. Raw.",
    description:
      "Turning strategy into content that feels relevant to the platform and different from everything around it.",
    subItems: ["Intelligence", "Concept", "Production", "Optimisation"],
    image: "/services/content-creation.png",
    imageLabel: "CONTENT CREATION",
  },
];

export function Services() {
  const [selectedService, setSelectedService] = useState(0);

  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const descriptionColRef = useRef<HTMLDivElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);

  /* Keep the description and image centred on the active service row.
   * offsetTop is layout-based, so transforms never feed back into the next
   * measurement. */
  useLayoutEffect(() => {
    const descriptionCol = descriptionColRef.current;
    const imageCol = imageColRef.current;
    if (!descriptionCol || !imageCol) return;

    const alignActiveContent = () => {
      const item = itemRefs.current[selectedService];
      if (!item) return;

      const itemCenter = item.offsetTop + item.offsetHeight / 2;
      const centerOnItem = (element: HTMLElement, property: string) => {
        const y = itemCenter - element.offsetTop - element.offsetHeight / 2;
        element.style.setProperty(property, `${y}px`);
      };

      centerOnItem(descriptionCol, "--services-description-y");
      centerOnItem(imageCol, "--services-image-y");
    };

    alignActiveContent();

    const observer = new ResizeObserver(alignActiveContent);
    observer.observe(descriptionCol);
    observer.observe(imageCol);
    const item = itemRefs.current[selectedService];
    if (item) observer.observe(item);

    return () => observer.disconnect();
  }, [selectedService]);

  return (
    <section className="services" id="services">
      <div className="services__inner">
        {/* ───── Col 1 — active service description ───── */}
        <div ref={descriptionColRef} className="services__left">
          {/* Section-level intro — constant across services, sets the
           * "we connect, not sell" framing. Lives above the per-service
           * description block and reads as the section's positioning
           * statement. */}
          <p className="services__intro">
            We don&rsquo;t sell services.
            <br />
            We connect the pieces that make a brand work.
          </p>

          <p className="services__description" aria-live="polite">
            <strong>{SERVICES[selectedService].name}.</strong>
            <em className="services__kicker">
              {SERVICES[selectedService].kicker}
            </em>
            <span className="services__description-body">
              {SERVICES[selectedService].description}
            </span>
            <span className="services__subitems">
              {SERVICES[selectedService].subItems.join(" · ")}
            </span>
          </p>
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
                  selectedService === i ? "services__item--active" : ""
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={selectedService === i}
                onMouseEnter={() => setSelectedService(i)}
                onClick={() => setSelectedService(i)}
                onFocus={() => setSelectedService(i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedService(i);
                  }
                }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        {/* ───── Col 3 — image aligned to the hovered service ───── */}
        <div ref={imageColRef} className="services__image-col" aria-hidden="true">
          {SERVICES.map((service, i) => (
            <div
              key={service.name}
              className={`services__hover-image ${
                selectedService === i ? "services__hover-image--active" : ""
              }`}
              style={{
                backgroundImage: `url(${service.image})`,
              }}
            >
              <span className="services__hover-image-label">
                {service.imageLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
