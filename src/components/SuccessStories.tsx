"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./SuccessStories.css";

/**
 * Hallmark · "Success Stories" section.
 *
 * White-bg three-column grid:
 *   col 1  · sticky "Success Stories" label, fixed for the section's height
 *   col 2  · stacked project images
 *   col 3  · stacked project text blocks (pager + title + description + stat)
 *
 * CSS Grid auto-flows each project's image and text into the same row, so
 * they scroll past in lock-step as the user moves through the section.
 */

interface Project {
  title: string;
  description: string;
  stat: string;
  statCaption: string;
  image: string;
}

/* Vertical travel of the image inside its frame, as a percentage of the
 * image element's own height. The image is rendered taller than the frame
 * (see PARALLAX_OVERSCAN in the CSS) so this slide never exposes an edge. */
const PARALLAX_SHIFT = 8;
const SUCCESS_VIDEO = "/videos/success-stories-mammoth.webm";
const DESKTOP_VIDEO_HOVER =
  "(min-width: 901px) and (hover: hover) and (pointer: fine)";

const PROJECTS: ReadonlyArray<Project> = [
  {
    title: "IQVIA",
    description:
      "IQVIA didn't need another efficiency promise. It needed systems that worked around the business. We built customized CRM and ERP solutions around real workflows — supported by strategic and technology-led frameworks designed to reduce friction across teams.",
    stat: "—",
    statCaption: "Making complex workflow better.",
    image: "/services.png",
  },
  {
    title: "Manipal Hospitals",
    description:
      "Healthcare is full of information. But people don't remember information — they remember how a brand made them feel. We shaped storytelling, branding campaigns and strategic communication around a clearer idea of trust — making the brand more human, recognizable and relevant to the people it serves.",
    stat: "—",
    statCaption: "Making trust easier to feel.",
    image: "/services.png",
  },
  {
    title: "Redmonk Wellness",
    description:
      "Wellness brands don't need more content. They need content that feels worth stopping for. We built a sharper content approach around short, crisp and raw communication — designed for the way people actually consume information today.",
    stat: "—",
    statCaption: "Turning attention into action.",
    image: "/services.png",
  },
  {
    title: "Team Taurus",
    description:
      "Real estate is often reduced to location, price and square feet. People don't buy spaces like spreadsheets. They imagine what it will feel like to live there. We helped sharpen the brand narrative around the experience behind the spaces — making the communication more distinctive, considered and relevant to the people it was built for.",
    stat: "—",
    statCaption: "Spaces that feel lived in.",
    image: "/services.png",
  },
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function SuccessStories() {
  const total = PROJECTS.length;
  const sectionRef = useRef<HTMLElement>(null);

  /* Desktop uses one stable cursor plane: the left 20% pauses playback and
   * the right 80% plays whichever story is most visible. Mobile keeps the
   * visibility-only behaviour. Moving through the image/text gap therefore
   * never interrupts playback, and pausing preserves the current frame. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const videos = Array.from(
      section.querySelectorAll<HTMLVideoElement>("[data-ss-video]"),
    );
    const visibility = new Map(videos.map((video) => [video, 0]));
    const desktopQuery = window.matchMedia(DESKTOP_VIDEO_HOVER);
    let pointerX = -1;
    let pointerCanPlay = false;

    const setVideoVisible = (video: HTMLVideoElement, visible: boolean) => {
      video.classList.toggle("success-stories__video--playing", visible);
      video
        .closest(".success-stories__image-figure")
        ?.classList.toggle(
          "success-stories__image-figure--video-playing",
          visible,
        );
    };

    const pauseVideo = (video: HTMLVideoElement, reset = false) => {
      video.pause();
      setVideoVisible(video, false);
      if (reset) video.currentTime = 0;
    };

    const playVideo = (video: HTMLVideoElement) => {
      if (!video.paused) return;
      void video.play().catch(() => undefined);
    };

    const updatePlayback = () => {
      if (!desktopQuery.matches) {
        videos.forEach((video) => {
          if ((visibility.get(video) ?? 0) >= 0.45) playVideo(video);
          else pauseVideo(video);
        });
        return;
      }

      let focusedVideo: HTMLVideoElement | null = null;
      let focusedRatio = 0;
      visibility.forEach((ratio, video) => {
        if (ratio > focusedRatio) {
          focusedRatio = ratio;
          focusedVideo = video;
        }
      });

      const target = pointerCanPlay && focusedRatio >= 0.15 ? focusedVideo : null;
      videos.forEach((video) => {
        if (video === target) playVideo(video);
        else pauseVideo(video);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          visibility.set(video, entry.intersectionRatio);
          if (!entry.isIntersecting) pauseVideo(video, true);
        });
        updatePlayback();
      },
      { threshold: [0.1, 0.5, 0.9] },
    );

    const showVideo = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      setVideoVisible(video, true);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      const nextCanPlay = pointerX > window.innerWidth * 0.2;
      if (nextCanPlay === pointerCanPlay) return;
      pointerCanPlay = nextCanPlay;
      updatePlayback();
    };

    const onWindowBlur = () => {
      pointerCanPlay = false;
      updatePlayback();
    };

    const onModeChange = () => {
      pointerCanPlay =
        desktopQuery.matches && pointerX > window.innerWidth * 0.2;
      updatePlayback();
    };

    videos.forEach((video) => {
      video.addEventListener("playing", showVideo);
      observer.observe(video);
    });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onWindowBlur);
    desktopQuery.addEventListener("change", onModeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onWindowBlur);
      desktopQuery.removeEventListener("change", onModeChange);
      videos.forEach((video) => {
        video.pause();
        video
          .closest(".success-stories__image-figure")
          ?.classList.remove("success-stories__image-figure--video-playing");
        video.removeEventListener("playing", showVideo);
      });
    };
  }, []);

  /* Parallax — each image slides vertically inside its fixed frame, scrubbed
   * 1:1 to that frame's travel through the viewport.
   *
   * Why GSAP ScrollTrigger and not CSS `animation-timeline: view()`: the CSS
   * scroll-driven timeline is still Chromium-only (Safari and Firefox have no
   * stable support as of 2026), and the section already runs GSAP +
   * ScrollTrigger in KeepScrolling/HeroWordmark, so this adds no new bytes and
   * keeps one scroll-driver authoritative for the whole page.
   *
   * `start: "top bottom"` / `end: "bottom top"` maps the full traversal —
   * frame entering the bottom edge → leaving the top edge — onto the tween,
   * so the drift reads continuously rather than snapping at a boundary. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const frames = Array.from(
        section.querySelectorAll<HTMLElement>("[data-ss-parallax]"),
      );
      if (frames.length === 0) return;

      /* One timeline + ONE scrollTrigger for all four frames (the old
       * build had 4 parallel triggers, each reading scroll progress
       * every frame — on a 120 Hz display that's 4× the per-frame
       * progress math, and every one of those triggers re-measures on
       * refresh). The section-level trigger maps the section's full
       * traversal onto a 0…1 timeline; each frame's tween is placed at
       * the fraction of the section where that frame enters the
       * viewport and spans exactly its own height fraction — provably
       * identical to the old per-frame mapping, with one progress
       * calculation per frame instead of four.
       *
       * Positions are baked from layout, so a window resize rebuilds
       * the timeline via the ScrollTrigger "refresh" event (the same
       * event per-frame triggers used to self-correct on). */
      let tl: gsap.core.Timeline | null = null;

      const buildTimeline = () => {
        const sectionH = section.offsetHeight || 1;
        tl = gsap.timeline({
          defaults: { ease: "none", force3D: true },
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
        frames.forEach((imageEl) => {
          const a = imageEl.offsetTop; // offset within the section
          const h = imageEl.offsetHeight;
          tl!.fromTo(
            imageEl,
            { yPercent: -PARALLAX_SHIFT },
            {
              yPercent: PARALLAX_SHIFT,
              duration: h / sectionH,
              ease: "none",
              force3D: true,
            },
            a / sectionH,
          );
        });
      };

      buildTimeline();

      const onRefresh = () => {
        tl?.kill();
        tl = null;
        buildTimeline();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      return () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        tl?.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="success-stories" id="success-stories">
      <div className="success-stories__inner">
        {/* Col 1 — sticky label only. Spans every row in the section so
         * the label stays in view for the entire section's scroll height
         * (project rows + divider rows). Placement lives in CSS so the
         * ≤960px breakpoint can unwind it — see the note on the row vars
         * below. */}
        <div className="success-stories__label-col">
          <span className="success-stories__dot" aria-hidden="true" />
          <span className="success-stories__label">Success Stories</span>
        </div>

        {/* Col 2 + Col 3 — every project's image and text share a row,
         * separated from the previous project by a divider row that spans
         * only cols 2 + 3 (the label column stays clear). Project rows
         * are odd (1, 3, 5, 7); divider rows are even (2, 4, 6).
         *
         * Only the row INDEX is passed inline (as a custom property); the
         * column and row assignment itself is CSS. Inline grid placement
         * would outrank the stacking media query, which is what previously
         * dropped each figure into an implicit content-sized column and
         * collapsed it to height 0 below 960px. */}
        {PROJECTS.map((project, i) => (
          <Fragment key={project.title}>
            {i > 0 && (
              <div
                className="success-stories__divider"
                aria-hidden="true"
                style={{ "--ss-row": i * 2 } as CSSProperties}
              />
            )}
            <figure
              className="success-stories__image-figure"
              style={{ "--ss-row": i * 2 + 1 } as CSSProperties}
            >
              {/* The frame div — not the <Image> — is the parallax target.
               * next/image `fill` injects inline `inset:0; height:100%`, which
               * outranks any class selector, so the overscan has to live on a
               * wrapper the image can fill instead. The wrapper is taller than
               * the figure so it slides without revealing an edge. */}
              <div className="success-stories__image-frame" data-ss-parallax="">
                <Image
                  src={project.image}
                  alt={`${project.title} project imagery`}
                  fill
                  sizes="(max-width: 960px) 100vw, 50vw"
                  className="success-stories__image"
                  priority={i === 0}
                />
              </div>
              <video
                className="success-stories__video"
                data-ss-video=""
                muted
                loop
                playsInline
                preload="metadata"
                poster={project.image}
              >
                <source src={SUCCESS_VIDEO} type="video/webm" />
              </video>
            </figure>

            <article
              className="success-stories__text-block"
              style={{ "--ss-row": i * 2 + 1 } as CSSProperties}
            >
              <div
                className="success-stories__pager"
                aria-label={`Case ${i + 1} of ${total}`}
              >
                <span className="success-stories__pager-tag">SS</span>
                <span className="success-stories__pager-arrow" aria-hidden="true">
                  →
                </span>
                <span className="success-stories__pager-count">
                  <span className="success-stories__pager-current">
                    {pad2(i + 1)}
                  </span>
                  <span className="success-stories__pager-sep">/</span>
                  <span className="success-stories__pager-total">
                    {pad2(total)}
                  </span>
                </span>
              </div>

              <h2 className="success-stories__title">{project.title}</h2>
              <p className="success-stories__description">
                {project.description}
              </p>

              <div className="success-stories__stat-block">
                <div className="success-stories__stat">{project.stat}</div>
                <p className="success-stories__stat-caption">
                  {project.statCaption}
                </p>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default SuccessStories;
