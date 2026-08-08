"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CATEGORIES } from "@/lib/data/categories";
import { staggerContainer } from "@/lib/motion";
import CategoryCard, { type CategoryCardVariant } from "./CategoryCard";

interface LayoutSlot {
  variant: CategoryCardVariant;
  /** Column span applied at the desktop (lg) 12-col grid. */
  span: string;
}

/**
 * Mirrors the order of CATEGORIES exactly:
 * corporate, events, fnb, medical, podcast.
 *
 * One "featured" slot (corporate) anchors the rhythm; everything else
 * alternates wide/tall/standard so no two rows repeat the same shape —
 * deliberately not a uniform grid.
 */
const LAYOUT: LayoutSlot[] = [
  { variant: "featured", span: "lg:col-span-7" }, // corporate
  { variant: "wide", span: "lg:col-span-5" }, // events
  { variant: "tall", span: "lg:col-span-4" }, // fnb
  { variant: "standard", span: "lg:col-span-4" }, // medical
  { variant: "wide", span: "lg:col-span-4" }, // podcast
];

export default function CategoryGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="categories"
      className="mx-auto max-w-[1800px] px-5 py-20 sm:px-8 sm:py-28 lg:px-16"
    >
      <h2 className="mb-10 font-display text-3xl text-ink sm:mb-14 sm:text-4xl">
        The Work
      </h2>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(reduceMotion ? 0 : 0.08)}
        className="sm:columns-2 sm:gap-8 lg:columns-none lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6 lg:gap-y-10"
      >
        {CATEGORIES.map((category, index) => {
          const slot = LAYOUT[index] ?? { variant: "standard", span: "lg:col-span-4" };
          return (
            <CategoryCard
              key={category.slug}
              category={category}
              variant={slot.variant}
              className={`mb-6 break-inside-avoid sm:mb-8 lg:mb-0 ${slot.span}`}
            />
          );
        })}
      </motion.div>
    </section>
  );
}
