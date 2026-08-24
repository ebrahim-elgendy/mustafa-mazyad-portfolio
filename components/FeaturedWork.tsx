"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CategorySlug } from "@/lib/data/categories";
import { fadeUp, staggerContainer } from "@/lib/motion";

interface FeaturedPiece {
  category: CategorySlug;
  label: string;
  url: string;
  width: number;
  height: number;
  /** Bento cell size on the lg+ grid. */
  size: "hero" | "wide" | "standard";
}

/**
 * A hand-picked highlight reel — one standout, unposed real frame per
 * category, deliberately different from that category's homepage cover
 * (CategoryGrid below reuses covers, so repeating one here would just be
 * the same photo twice on one page). Pulled straight from the production
 * Blob storage URLs already serving /[category] galleries.
 */
const PIECES: FeaturedPiece[] = [
  {
    category: "automotive",
    label: "Automotive",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/automotive/68/DSC03497-HDR-dRt8Dj9LslCFTe29ZiQk2L4IC1Z4tY.jpg",
    width: 1920,
    height: 2400,
    size: "hero",
  },
  {
    category: "wedding",
    label: "Wedding",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/wedding/DSC02247-0v3bnNTzXyaNiSHJ1EgMoXvMwMEBrB.jpg",
    width: 2400,
    height: 1900,
    size: "wide",
  },
  {
    category: "sports",
    label: "Sports",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/sports/DSC00216-BQ4HBbytlUDCH2Cdf594ueRslensut.jpg",
    width: 2400,
    height: 2400,
    size: "standard",
  },
  {
    category: "events",
    label: "Events",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/events/ABD07427-E1HF0oXPsqcWokv4Hh8FLA1NL5KPaF.jpg",
    width: 1920,
    height: 2400,
    size: "standard",
  },
  {
    category: "real-estate",
    label: "Real Estate",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/real-estate/DSC05492-RpmvE2M8iOTzSSlUHazoDpvaAYOkce.jpg",
    width: 2400,
    height: 2400,
    size: "standard",
  },
  {
    category: "corporate",
    label: "Corporate",
    url: "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/ADH%2010164-ZwYSMZi0lYqRMCoYg2EWhPrlFVu9Wi.jpg",
    width: 2400,
    height: 2400,
    size: "standard",
  },
];

const SIZE_CLASSES: Record<FeaturedPiece["size"], string> = {
  hero: "col-span-2 row-span-2",
  wide: "col-span-2 row-span-1",
  standard: "col-span-1 row-span-1",
};

function FeaturedCard({ piece }: { piece: FeaturedPiece }) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div variants={fadeUp} className={SIZE_CLASSES[piece.size]}>
      <Link
        href={`/${piece.category}`}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div className="cinematic-grade relative h-full w-full overflow-hidden rounded-lg bg-surface-2">
          <Image
            src={piece.url}
            alt={`${piece.label} — featured work`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{
              transitionProperty: "filter, transform",
              transitionDuration: "700ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transform: active && !reduceMotion ? "scale(1.045)" : "scale(1)",
              filter: active
                ? "grayscale(0.02) contrast(1.05) brightness(1.03) saturate(1.35)"
                : undefined,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0"
          />
          <span
            className="absolute bottom-4 left-4 font-display text-lg italic text-white sm:bottom-5 sm:left-5 sm:text-xl"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
          >
            {piece.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedWork() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1800px] px-5 pt-4 pb-20 sm:px-8 sm:pb-28 lg:px-16">
      <h2 className="mb-10 font-display text-3xl text-ink sm:mb-14 sm:text-4xl">
        Featured Work
      </h2>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(reduceMotion ? 0 : 0.08)}
        className="grid auto-rows-[220px] grid-cols-2 gap-4 sm:auto-rows-[240px] sm:gap-5 lg:grid-cols-4 lg:auto-rows-[260px] lg:gap-6"
      >
        {PIECES.map((piece) => (
          <FeaturedCard key={piece.category} piece={piece} />
        ))}
      </motion.div>
    </section>
  );
}
