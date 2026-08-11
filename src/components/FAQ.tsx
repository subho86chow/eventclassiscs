"use client";

import { useRef, useState } from "react";
import "./FAQ.css";

/**
 * Hallmark · FAQ section.
 *
 * Two-column layout:
 *   col 1 (left)  · "● FAQs" label, photo placeholder, CTA card with
 *                   "Got more questions? Chat with Huy." and a Book-a-call
 *                   button.
 *   col 2 (right) · Big editorial headline + accordion of questions.
 *                   Clicking a question expands its answer via a CSS
 *                   grid-template-rows transition (0fr → 1fr) — no
 *                   JavaScript-driven height tween, so the browser never
 *                   forces per-frame layout. Opening one closes any
 *                   other that's already open — classic single-open
 *                   accordion.
 *
 * prefers-reduced-motion snaps the open/close instantly (CSS handles it).
 */

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: ReadonlyArray<FAQItem> = [
  {
    question: "Who will actually be working on our project?",
    answer:
      "A small senior team from start to ship. The people scoping your work in the first call are the same people building it — no bait-and-switch.",
  },
  {
    question: "How long do your projects usually take?",
    answer:
      "Brand work runs 4–6 weeks. A full site is 8–12 weeks. Anything larger we scope in phases so you ship value early and keep learning.",
  },
  {
    question: "How do you communicate and manage work?",
    answer:
      "Weekly working sessions + async Looms + a shared Notion board. You always know what's shipping, what's blocked, and what's next — no Friday-afternoon status-deck surprises.",
  },
  {
    question: "What do you need to start working together?",
    answer:
      "Either a clear written brief or a 60-minute scoping call. By the end of the first week you'll know exactly what we're building, when, and for how much.",
  },
  {
    question: "What happens after launch?",
    answer:
      "30 days of in-warranty fixes are included. After that you can roll into a quarterly retainer for ongoing growth work — analytics, experiments, new pages — or hand it back to your in-house team with full documentation.",
  },
  {
    question: "Can you handle branding, design and development?",
    answer:
      "All under one roof — strategy, identity, site, 3D, motion. One team, one point of contact, one shared Notion. No handoffs, no translation tax.",
  },
  {
    question: "What is the project investment?",
    answer:
      "Brand work starts at $30k, full sites at $60k. Final scope sets the final number — we lock the budget before week two and don't issue surprise change orders.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggleRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* Toggle the open question. The expand/collapse is CSS-driven
   * (grid-template-rows: 0fr → 1fr) so there is no GSAP height tween
   * forcing layout every frame — see FAQ.css. Single-open behaviour:
   * clicking any item closes the previously-open one. */
  const toggle = (i: number) => {
    const wasOpen = openIndex === i;
    setOpenIndex(wasOpen ? null : i);
    const toggleBtn = toggleRefs.current[i];
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", wasOpen ? "false" : "true");
    }
  };

  return (
    <section className="faq" id="faq">
      <div className="faq__inner">
        {/* ───── Col 1 — photo + CTA ───── */}
        <div className="faq__left">
          <header className="faq__label-row">
            <span className="faq__dot" aria-hidden="true" />
            <span className="faq__label">FAQs</span>
          </header>

          <div
            className="faq__photo"
            role="img"
            aria-label="Photo of Huy"
          >
            <span className="faq__photo-label">PHOTO</span>
          </div>

          <div className="faq__cta">
            <h3 className="faq__cta-heading">
              Got more questions?
              <br />
              Chat with Huy.
            </h3>
            <a className="faq__cta-button" href="#book">
              <span>Book a call with Huy</span>
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
        </div>

        {/* ───── Col 2 — headline + accordion ───── */}
        <div className="faq__right">
          <h2 className="faq__headline">
            Here&apos;s what you need to consider before partnering with us.
          </h2>

          <ul className="faq__list">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <li
                  key={faq.question}
                  className={`faq__item ${isOpen ? "faq__item--open" : ""}`}
                >
                  <button
                    type="button"
                    ref={(el) => {
                      toggleRefs.current[i] = el;
                    }}
                    className="faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => toggle(i)}
                  >
                    <span className="faq__question-text">
                      {faq.question}
                    </span>
                    <span
                      className="faq__toggle"
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    className="faq__answer"
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <p className="faq__answer-text">{faq.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default FAQ;