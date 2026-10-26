"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/PageHeader";
import { prefersReducedMotion } from "@/lib/motion";

export type HeroSlide = {
  id: string;
  name: string;
  producer: string | null;
  meta: string[];
  description: string | null;
  imageUrl: string;
};

const AUTOPLAY_MS = 7000;

/**
 * Hero de l'accueil : une affiche pleine largeur par bouteille.
 *
 * Défilement natif avec accroche (`scroll-snap`) : le swipe garde l'inertie
 * du système sur mobile, la molette et le trackpad fonctionnent sur desktop.
 * Points et flèches pour naviguer, défilement automatique doux qui s'arrête
 * définitivement dès la première interaction (et jamais si l'utilisateur
 * préfère réduire les animations).
 */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const bottleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const count = track.children.length;
    const target = ((next % count) + count) % count;
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  // L'index suit la position réelle du défilement (swipe compris), et une
  // parallaxe lui est liée : la bouteille glisse moins vite que la page et
  // pivote légèrement, le texte s'efface en s'éloignant du centre.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const parallax = !prefersReducedMotion();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = Math.max(1, track.clientWidth);
        setIndex(Math.round(track.scrollLeft / width));
        if (!parallax) return;
        bottleRefs.current.forEach((bottle, slideIndex) => {
          // -1 : diapositive à gauche, 0 : centrée, 1 : à droite.
          const offset = Math.max(-1, Math.min(1, (slideIndex * width - track.scrollLeft) / width));
          if (bottle) {
            bottle.style.transform = `translate3d(${-offset * width * 0.38}px, 0, 0) rotate(${offset * 7}deg) scale(${1 - Math.abs(offset) * 0.08})`;
          }
          const text = textRefs.current[slideIndex];
          if (text) {
            text.style.transform = `translate3d(${offset * width * 0.12}px, 0, 0)`;
            text.style.opacity = String(1 - Math.abs(offset) * 0.9);
          }
        });
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || hovered || slides.length < 2 || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, hovered, index, slides.length, goTo]);

  const stopAutoplay = () => setAutoplay(false);

  return (
    <section
      className="relative border-b border-border"
      aria-roledescription="carrousel"
      aria-label="Bouteilles du moment"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={stopAutoplay}
      onWheel={stopAutoplay}
      onFocusCapture={stopAutoplay}
    >
      <div
        ref={trackRef}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.map((slide, slideIndex) => {
          // Seule la première affiche joue l'entrée de page.
          const enter = slideIndex === 0 ? { "data-enter": "" } : {};
          return (
            <article
              key={slide.id}
              className="relative isolate w-full shrink-0 snap-start snap-always overflow-hidden"
              aria-roledescription="diapositive"
              aria-label={`${slideIndex + 1} sur ${slides.length} : ${slide.name}`}
              inert={slideIndex !== index}
            >
              {/* Pan cramoisi coupé en diagonale, comme la marque : en haut sur
                  mobile (derrière la bouteille), à droite jusqu'au bord sur desktop. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10"
                {...(slideIndex === 0 ? { "data-enter": "wipe" } : {})}
              >
                <div className="absolute inset-0 bg-wine-red [clip-path:polygon(0_0,100%_0,100%_300px,0_210px)] md:[clip-path:polygon(60%_0,100%_0,100%_100%,42%_100%)]" />
                <div className="absolute inset-0 hidden bg-wine-deep md:block md:[clip-path:polygon(78%_100%,100%_52%,100%_100%)]" />
              </div>

              <div className="container-page grid h-full items-center md:min-h-[540px] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:min-h-[580px]">
                <div
                  ref={(node) => {
                    bottleRefs.current[slideIndex] = node;
                  }}
                  className="order-first flex h-[280px] items-center justify-center pt-6 will-change-transform md:order-last md:h-[540px] md:py-10 lg:h-[580px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    {...(slideIndex === 0 ? { "data-enter": "scale" } : {})}
                    src={slide.imageUrl}
                    alt={`Bouteille ${slide.name}`}
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                    draggable={false}
                    className="h-full w-auto select-none object-contain drop-shadow-[0_32px_36px_rgba(43,9,18,0.42)]"
                  />
                </div>

                <div
                  ref={(node) => {
                    textRefs.current[slideIndex] = node;
                  }}
                  className="pb-14 pt-8 md:py-16 md:pr-10"
                >
                  <div {...enter}>
                    <Eyebrow className="mb-4">La bouteille du moment</Eyebrow>
                  </div>
                  <h2
                    {...(slideIndex === 0 ? { "data-enter": "title" } : {})}
                    id={slideIndex === 0 ? "featured-wine-title" : undefined}
                    className="text-display text-[clamp(2.5rem,1.4rem+3.8vw,5rem)]"
                  >
                    {slide.name}
                  </h2>
                  {slide.producer && (
                    <p {...enter} className="mt-3 text-[0.9375rem] font-semibold text-gold">
                      {slide.producer}
                    </p>
                  )}
                  {slide.meta.length > 0 && (
                    <ul {...enter} className="mt-4 flex flex-wrap gap-1.5">
                      {slide.meta.map((item) => (
                        <li key={item} className="tag">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {slide.description && (
                    <p
                      {...enter}
                      className="mt-6 line-clamp-4 max-w-[56ch] text-base leading-relaxed text-muted"
                    >
                      {slide.description}
                    </p>
                  )}
                  <div {...enter} className="mt-8 flex flex-wrap items-center gap-2">
                    <Link href={`/wines/${slide.id}`} className="btn btn-primary btn-lg group">
                      Découvrir cette bouteille
                      <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link href="/cave" className="btn btn-secondary btn-lg">
                      Voir la cave
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 md:bottom-6">
          <div className="container-page flex items-center gap-3">
            <div className="pointer-events-auto flex items-center gap-1" role="group" aria-label="Choisir une bouteille">
              {slides.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    stopAutoplay();
                    goTo(dotIndex);
                  }}
                  aria-label={`Afficher ${slide.name}`}
                  aria-current={dotIndex === index ? "true" : undefined}
                  className="flex h-8 items-center px-1"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      dotIndex === index ? "w-6 bg-wine-red" : "w-1.5 bg-border-strong"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="pointer-events-auto ml-auto hidden gap-1.5 md:flex">
              <button
                type="button"
                onClick={() => {
                  stopAutoplay();
                  goTo(index - 1);
                }}
                className="btn btn-secondary btn-icon"
                aria-label="Bouteille précédente"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAutoplay();
                  goTo(index + 1);
                }}
                className="btn btn-secondary btn-icon"
                aria-label="Bouteille suivante"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
