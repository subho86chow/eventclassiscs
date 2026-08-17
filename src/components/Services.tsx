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
  description: string;
  /** Placeholder image background (used until a real asset lands). */
  imageFrom: string;
  imageTo: string;
  imageLabel: string;
}

const SERVICES: ReadonlyArray<Service> = [
  {
    name: "Brand Strategy",
    description: "A clear position, story, and roadmap that gives every brand decision a purpose.",
    imageFrom: "oklch(35% 0.04 30)",
    imageTo: "oklch(15% 0.04 20)",
    imageLabel: "BRAND STRATEGY",
  },
  {
    name: "Visual Identity",
    description: "A distinctive visual system built to stay recognisable, flexible, and consistent.",
    imageFrom: "oklch(35% 0.04 90)",
    imageTo: "oklch(15% 0.04 70)",
    imageLabel: "VISUAL IDENTITY",
  },
  {
    name: "Website Strategy",
    description: "A focused digital plan that turns audience needs into a clear, persuasive journey.",
    imageFrom: "oklch(35% 0.04 200)",
    imageTo: "oklch(15% 0.04 180)",
    imageLabel: "WEBSITE STRATEGY",
  },
  {
    name: "Website Design",
    description: "Thoughtful interfaces that make complex ideas simple, useful, and memorable.",
    imageFrom: "oklch(35% 0.04 260)",
    imageTo: "oklch(15% 0.04 240)",
    imageLabel: "WEBSITE DESIGN",
  },
  {
    name: "3D Development",
    description: "Immersive 3D experiences that add depth, motion, and character without sacrificing performance.",
    imageFrom: "oklch(35% 0.04 60)",
    imageTo: "oklch(15% 0.04 40)",
    imageLabel: "3D DEVELOPMENT",
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
          <p className="services__description" aria-live="polite">
            <strong>{SERVICES[selectedService].name}.</strong>{" "}
            {SERVICES[selectedService].description}
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
                background: `linear-gradient(135deg, ${service.imageFrom}, ${service.imageTo})`,
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
