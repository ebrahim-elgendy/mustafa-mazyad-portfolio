"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { Category } from "@/lib/data/categories";
import type { WorkItem, WorkType } from "@/lib/data/work";
import PhotoLightbox from "@/components/PhotoLightbox";
import VideoCard from "@/components/VideoCard";

interface GalleryProps {
  category: Category;
  items: WorkItem[];
  type: WorkType;
  /** Overrides for a project-scoped gallery (e.g. a single client folder within a category). */
  backHref?: string;
  backLabel?: string;
  heading?: string;
  subheading?: string;
}

export default function Gallery({
  category,
  items,
  type,
  backHref,
  backLabel,
  heading,
  subheading,
}: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="flex-1 bg-bg pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-[1800px] px-5 sm:px-8 lg:px-16">
        <Link
          href={backHref ?? `/${category.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
            <path
              d="M12.5 4L7 10l5.5 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel ?? `Back to ${category.label}`}
        </Link>

        <header className="mt-6 max-w-2xl">
          <h1 className="text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[-0.03em] text-ink">
            {heading ?? `${category.label} ${type === "photography" ? "Photography" : "Video"}`}
          </h1>
          <p className="mt-4 text-pretty font-sans text-base text-muted sm:text-lg">
            {subheading ?? category.blurb}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="mt-14 flex min-h-[30vh] items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-2/40">
            <p className="font-sans text-sm text-muted">
              {type === "photography" ? "Photos" : "Videos"} coming soon.
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.08)}
            initial={prefersReducedMotion ? "show" : "hidden"}
            animate="show"
            className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6 lg:grid-cols-4"
          >
            {items.map((item, index) =>
              type === "photography" ? (
                <motion.button
                  key={item.id}
                  type="button"
                  variants={fadeUp}
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Open ${item.title}, ${item.year}`}
                  className="group mb-4 block w-full break-inside-avoid rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:mb-5 md:mb-6"
                >
                  <div className="cinematic-grade relative rounded-md">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={item.imageWidth}
                      height={item.imageHeight}
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="h-auto w-full align-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />

                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 100%)",
                      }}
                    />

                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 p-4"
                    >
                      <p className="line-clamp-2 font-display text-lg leading-snug text-ink">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-muted">{item.year}</p>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  className="mb-4 break-inside-avoid sm:mb-5 md:mb-6"
                >
                  <VideoCard item={item} />
                </motion.div>
              )
            )}
          </motion.div>
        )}
      </div>

      {type === "photography" && (
        <PhotoLightbox
          items={items}
          openIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </main>
  );
}
