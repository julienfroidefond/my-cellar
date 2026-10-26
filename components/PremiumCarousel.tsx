"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/PageHeader";
import { WineColor, WineTile } from "@/components/WineTile";

const PAGE_SIZE = 6;


interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  color: string | null;
  appellation: string | null;
  marketPrice: number | null;
  imageUrl: string | null;
}

interface Props {
  initialWines: Wine[];
  total: number;
}

export default function PremiumCarousel({ initialWines, total }: Props) {
  const [wines, setWines] = useState<Wine[]>(initialWines);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [tick, setTick] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useGSAP(
    () => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }
      const grid = gridRef.current;
      if (!grid || prefersReducedMotion()) return;

      // La transition CSS de survol des cartes porte sur `transform` : on la
      // coupe le temps de l'entrée pour qu'elle ne freine pas GSAP.
      const cards = Array.from(grid.children) as HTMLElement[];
      cards.forEach((card) => (card.style.transition = "none"));
      gsap.fromTo(
        cards,
        { autoAlpha: 0, x: direction === "left" ? 28 : -28 },
        {
          autoAlpha: 1,
          x: 0,
          duration: motion.duration.base,
          ease: motion.ease,
          stagger: { each: 0.04, from: direction === "left" ? "start" : "end" },
          clearProps: "transform,opacity,visibility",
          onComplete: () => cards.forEach((card) => card.style.removeProperty("transition")),
        },
      );
    },
    { dependencies: [tick, direction] },
  );

  if (total === 0) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const visible = wines.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  async function loadMore() {
    if (loading || wines.length >= total) return;
    setLoading(true);
    const res = await fetch(`/api/wines/premium?skip=${wines.length}&take=${PAGE_SIZE}`);
    const data: { wines: Wine[] } = await res.json();
    setWines(prev => [...prev, ...data.wines]);
    setLoading(false);
  }

  async function navigate(dir: "prev" | "next") {
    if (dir === "prev" && !canPrev) return;
    if (dir === "next" && !canNext) return;

    const nextPage = dir === "next" ? page + 1 : page - 1;

    // Fetch if we don't have the next page yet
    if (dir === "next" && (nextPage + 1) * PAGE_SIZE > wines.length) {
      await loadMore();
    }

    setDirection(dir === "next" ? "left" : "right");
    setPage(nextPage);
    setTick(t => t + 1); // bump the key below to replay the slide animation
  }

  return (
    <section data-reveal aria-labelledby="premium-title">
      <SectionHeader
        id="premium-title"
        eyebrow="Pépites"
        title="Les trésors de la cave"
        lead="Les vins les plus valorisés de la cave."
        actions={
          totalPages > 1 && (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm tabular text-muted" aria-live="polite">
                {page + 1}
                <span className="text-faint"> / {totalPages}</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate("prev")}
                  disabled={!canPrev}
                  className="btn btn-secondary btn-icon btn-sm w-9 h-9"
                  aria-label="Pépites précédentes"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("next")}
                  disabled={!canNext || loading}
                  className="btn btn-secondary btn-icon btn-sm w-9 h-9"
                  aria-label="Pépites suivantes"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          )
        }
      />

      {/* Mobile : rangée swipable, la suite se charge en approchant de la fin. */}
      <div
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:hidden"
        onScroll={(event) => {
          const row = event.currentTarget;
          if (row.scrollLeft + row.clientWidth > row.scrollWidth - row.clientWidth) void loadMore();
        }}
        aria-label="Pépites, faire défiler horizontalement"
      >
        {wines.map((wine, index) => (
          <PremiumTile key={wine.id} wine={wine} rank={index + 1} className="w-[86%] shrink-0 snap-start" />
        ))}
        {loading && (
          <div className="h-[140px] w-[86%] shrink-0 animate-pulse rounded-[var(--radius-lg)] bg-surface-2" />
        )}
      </div>

      {/* Desktop : grille paginée. */}
      <div
        key={`${page}-${tick}`}
        ref={gridRef}
        className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3"
      >
        {visible.map((wine, index) => (
          <PremiumTile key={wine.id} wine={wine} rank={page * PAGE_SIZE + index + 1} />
        ))}

        {/* Squelettes pendant le chargement */}
        {loading && Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
          <div key={`sk-${i}`} className="h-[140px] animate-pulse rounded-[var(--radius-lg)] bg-surface-2" />
        ))}
      </div>
    </section>
  );
}

function PremiumTile({ wine, rank, className }: { wine: Wine; rank: number; className?: string }) {
  return (
    <WineTile
      href={`/wines/${wine.id}`}
      name={wine.name}
      imageUrl={wine.imageUrl}
      className={className}
      meta={
        <>
          <span className="tabular font-semibold text-faint">#{rank}</span>
          <WineColor color={wine.color} />
        </>
      }
      footer={
        <>
          {wine.vintage && <span className="tag">{wine.vintage}</span>}
          {wine.appellation && <span className="tag max-w-[16ch] truncate">{wine.appellation}</span>}
        </>
      }
      aside={
        <span className="stat-value text-[1.2rem] text-wine-red">
          {wine.marketPrice?.toFixed(0)}&nbsp;€
        </span>
      }
    />
  );
}
