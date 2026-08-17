"use client";

import { useState } from "react";
import "./FAQ.css";

/**
 * Hallmark · FAQ section.
 *
 * Two-column layout:
 *   col 1 (left)  · "● FAQs" label, photo placeholder, CTA card with
 *                   "Got more questions? Chat with Huy." and a Book-a-call
 *                   button.
 *   col 2 (right) · Big editorial headline + accordion of questions.
 *                   Clicking a question expands its answer with CSS.
 *                   Opening one closes any other that's already open —
 *                   classic single-open accordion.
 *
 * prefers-reduced-motion snaps the open/close instantly (CSS handles it).
 */

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: ReadonlyArray<FAQItem> = [
  {
    question: "Who actually works on our project?",
    answer:
      "A small senior team. The people who work are the people who build it.",
  },
  {
    question: "How long does the work take?",
    answer:
      "Brand work typically takes 4–6 weeks. Larger brand-and-digital engagements run 8–12 weeks. Bigger problems are scoped in phases. You start seeing progress before everything is executed.",
  },
  {
    question: "How do you work with client teams?",
    answer:
      "Weekly working sessions. Synchronized communication. You always know what's happening, what's blocked and what needs to be done next.",
  },
  {
    question: "What do you need from us?",
    answer:
      "A clear brief or one honest conversation. We'll ask the questions from there. By the end of the first week, the direction, scope and next steps should be clear.",
  },
  {
    question: "Do you only provide strategy?",
    answer: "No. We build it, execute it, measure it and improve it.",
  },
  {
    question: "Can you work with our existing team?",
    answer:
      "Yes. We can work alongside founders, internal teams and existing partners. The objective isn't to replace people. It's to make the whole system work better together.",
  },
  {
    question: "What happens after the project?",
    answer:
      "We can stay. For growth, optimization, content, new initiatives or ongoing strategic support. Or we can hand everything over with the systems and documentation your team needs. Either way, the work should continue working.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Every business starts from a different problem. So we scope the problem before pricing the solution. No packaged work for the sake of a package. No surprise scope.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((current) => (current === i ? null : i));
  };

  return (
    <section className="faq" id="faq">
      <div className="faq__inner">
        <header className="faq__label-row">
          <span className="faq__dot" aria-hidden="true" />
          <span className="faq__label">FAQs</span>
        </header>

        <aside className="faq__support">
          <div
            className=""
            role="img"
            aria-label="Photo of Huy"
          />

          <div className="faq__cta">
            <h3 className="faq__cta-heading">
              Still have questions?
              <br />
              Chat with us
            </h3>
            <a className="m-hero__cta faq__cta-button" href="#book">
              <span className="m-hero__cta-label">Book a call with us</span>
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
        </aside>

        {/* ───── Col 2 — headline + accordion ───── */}
        <div className="faq__right">
          <h2 className="faq__headline">
            Here&apos;s what you should know before working with us.
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
                    className="faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => toggle(i)}
                  >
                    <span className="faq__question-text">
                      {faq.question}
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${i}`}
                    className="faq__answer"
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <p className="faq__answer-text">
                      {faq.answer}
                    </p>
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
