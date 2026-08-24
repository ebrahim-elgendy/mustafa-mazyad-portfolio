"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CATEGORIES } from "@/lib/data/categories";
import { staggerContainer } from "@/lib/motion";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
  /** Real cover photo (+ vertical crop anchor) per category slug, once uploaded — falls back to curated placeholder art when absent. */
  covers?: Partial<Record<string, { url: string; focalY: number } | undefined>>;
}

export default function CategoryGrid({ covers }: CategoryGridProps) {
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
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10"
      >
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            variant="wide"
            cover={covers?.[category.slug]?.url}
            coverFocalY={covers?.[category.slug]?.focalY}
          />
        ))}
      </motion.div>
    </section>
  );
}
