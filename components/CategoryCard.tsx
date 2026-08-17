"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Category } from "@/lib/data/categories";
import { fadeUp, fadeIn } from "@/lib/motion";

/** Size/rhythm variants a parent grid can assign per card. */
export type CategoryCardVariant = "featured" | "wide" | "tall" | "standard";

const VARIANT_DIMS: Record<
  CategoryCardVariant,
  { w: number; h: number; aspect: string }
> = {
  featured: { w: 2400, h: 1000, aspect: "aspect-[12/5]" },
  wide: { w: 1500, h: 1000, aspect: "aspect-[3/2]" },
  tall: { w: 1000, h: 1300, aspect: "aspect-[10/13]" },
  standard: { w: 1200, h: 900, aspect: "aspect-[4/3]" },
};

interface CategoryCardProps {
  category: Category;
  variant?: CategoryCardVariant;
  className?: string;
  /** Real uploaded photo/poster for this category — shows a neutral "coming soon" state when absent. */
  cover?: string;
}

export default function CategoryCard({
  category,
  variant = "standard",
  className = "",
  cover,
}: CategoryCardProps) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();
  const dims = VARIANT_DIMS[variant];

  // Inline styles win over the .cinematic-grade base filter without
  // touching globals.css — "footage waking up" on hover/focus: fuller
  // color and a small, deliberate scale, not a shadow-and-lift card trick.
  const imageStyle: CSSProperties = {
    transitionProperty: "filter, transform",
    transitionDuration: "700ms",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transform: active && !reduceMotion ? "scale(1.045)" : "scale(1)",
    filter: active
      ? "grayscale(0.02) contrast(1.05) brightness(1.03) saturate(1.35)"
      : undefined,
  };

  return (
    <motion.div variants={reduceMotion ? fadeIn : fadeUp} className={className}>
      <Link
        href={`/${category.slug}`}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div
          className={`cinematic-grade relative w-full overflow-hidden rounded-lg bg-surface-2 ${dims.aspect}`}
        >
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
              style={imageStyle}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-lg italic text-muted">Coming soon</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-1.5 px-0.5">
          <h3 className="text-balance font-display text-2xl leading-tight text-ink sm:text-3xl">
            {category.label}
          </h3>
          <p className="font-sans text-sm text-muted">{category.blurb}</p>
        </div>
      </Link>
    </motion.div>
  );
}
