"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import type { Category } from "@/lib/data/categories";
import { placeholderImage } from "@/lib/placeholder";
import { EASE_OUT_EXPO, fadeUp } from "@/lib/motion";

type Side = "photography" | "video";

interface SplitChooserProps {
  category: Category;
}

const COPY: Record<
  Side,
  { label: string; blurb: (label: string) => string; seedSuffix: string }
> = {
  photography: {
    label: "Photography",
    blurb: (label) => `Stills from the ${label} archive`,
    seedSuffix: "split-photo",
  },
  video: {
    label: "Video",
    blurb: (label) => `Motion work from the ${label} archive`,
    seedSuffix: "split-video",
  },
};

export default function SplitChooser({ category }: SplitChooserProps) {
  const [active, setActive] = useState<Side | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const widthFor = (side: Side) => {
    if (shouldReduceMotion) return "50%";
    if (active === side) return "58%";
    if (active && active !== side) return "42%";
    return "50%";
  };

  const filterFor = (side: Side) => {
    if (active === side) return "brightness(1.08) saturate(1.3)";
    if (active && active !== side) return "brightness(0.72) saturate(0.7)";
    return "brightness(1) saturate(1)";
  };

  const widthTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.7, ease: EASE_OUT_EXPO };

  const filterTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: EASE_OUT_EXPO };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col bg-bg px-5 pb-10 pt-24 sm:px-8 sm:pt-28 lg:px-16">
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        variants={fadeUp}
        className="mx-auto mb-10 w-full max-w-3xl text-center md:mb-14"
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-sm font-sans text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true">&larr;</span> All Work
        </Link>
        <h1 className="text-balance font-display text-4xl text-ink sm:text-5xl md:text-6xl">
          {category.label}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty font-sans text-base text-muted sm:text-lg">
          {category.blurb}
        </p>
      </motion.div>

      {/* Desktop / pointer split — hover-interactive, side-by-side */}
      <div className="relative hidden flex-1 min-h-[460px] overflow-hidden rounded-lg md:flex">
        <SplitHalf
          side="photography"
          category={category}
          width={widthFor("photography")}
          widthTransition={widthTransition}
          filter={filterFor("photography")}
          filterTransition={filterTransition}
          onActivate={() => setActive("photography")}
          onDeactivate={() => setActive(null)}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-border-strong"
          style={{
            left: widthFor("photography"),
            transform: "translateX(-0.5px)",
            transition: shouldReduceMotion
              ? "none"
              : `left 0.7s ${cubicBezierCss(EASE_OUT_EXPO)}`,
          }}
        />
        <SplitHalf
          side="video"
          category={category}
          width={widthFor("video")}
          widthTransition={widthTransition}
          filter={filterFor("video")}
          filterTransition={filterTransition}
          onActivate={() => setActive("video")}
          onDeactivate={() => setActive(null)}
        />
      </div>

      {/* Mobile / touch — stacked, full-width cards */}
      <div className="flex flex-1 flex-col gap-3 md:hidden">
        <StackedHalf side="photography" category={category} />
        <StackedHalf side="video" category={category} />
      </div>
    </main>
  );
}

function cubicBezierCss(curve: readonly [number, number, number, number]) {
  return `cubic-bezier(${curve.join(", ")})`;
}

interface SplitHalfProps {
  side: Side;
  category: Category;
  width: string;
  widthTransition: Transition;
  filter: string;
  filterTransition: Transition;
  onActivate: () => void;
  onDeactivate: () => void;
}

function SplitHalf({
  side,
  category,
  width,
  widthTransition,
  filter,
  filterTransition,
  onActivate,
  onDeactivate,
}: SplitHalfProps) {
  const copy = COPY[side];

  return (
    <motion.div
      className="relative flex-none self-stretch"
      animate={{ width }}
      transition={widthTransition}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ filter }}
        transition={filterTransition}
      >
        <Link
          href={`/${category.slug}/${side}`}
          onMouseEnter={onActivate}
          onMouseLeave={onDeactivate}
          onFocus={onActivate}
          onBlur={onDeactivate}
          aria-label={`View ${category.label} ${copy.label.toLowerCase()}`}
          className="group absolute inset-0 block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <div className="cinematic-grade absolute inset-0">
            <Image
              src={placeholderImage(`${category.slug}-${copy.seedSuffix}`, 1200, 1600)}
              alt={`${category.label} ${copy.label.toLowerCase()} preview`}
              fill
              sizes="50vw"
              className="object-cover"
              priority={side === "photography"}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-bg/20" />
          {/* Vignette guarantees label contrast regardless of what the underlying photo looks like */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <h2
              className="font-display text-5xl italic text-ink lg:text-7xl"
              style={{ textShadow: "0 4px 28px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)" }}
            >
              {copy.label}
            </h2>
            <p
              className="mt-4 max-w-xs font-sans text-sm text-ink/80 lg:text-base"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
            >
              {copy.blurb(category.label)}
            </p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

function StackedHalf({ side, category }: { side: Side; category: Category }) {
  const copy = COPY[side];

  return (
    <Link
      href={`/${category.slug}/${side}`}
      aria-label={`View ${category.label} ${copy.label.toLowerCase()}`}
      className="group block relative h-[38vh] min-h-[260px] w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary"
    >
      <div className="cinematic-grade absolute inset-0">
        <Image
          src={placeholderImage(`${category.slug}-${copy.seedSuffix}`, 1200, 1600)}
          alt={`${category.label} ${copy.label.toLowerCase()} preview`}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-500 ease-out group-active:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-bg/75 via-transparent to-bg/10" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h2
          className="font-display text-4xl italic text-ink"
          style={{ textShadow: "0 4px 28px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)" }}
        >
          {copy.label}
        </h2>
        <p
          className="mt-3 max-w-xs font-sans text-sm text-ink/80"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
        >
          {copy.blurb(category.label)}
        </p>
      </div>
    </Link>
  );
}
