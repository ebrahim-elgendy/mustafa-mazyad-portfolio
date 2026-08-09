"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Category } from "@/lib/data/categories";
import type { Project } from "@/lib/data/source-map";
import { fadeUp, staggerContainer } from "@/lib/motion";

interface ProjectChooserProps {
  category: Category;
  projects: Project[];
  /** Overrides for categories where the project picker sits under a Photography/Video split rather than at the category root. */
  backHref?: string;
  backLabel?: string;
}

export default function ProjectChooser({
  category,
  projects,
  backHref = "/",
  backLabel = "All Work",
}: ProjectChooserProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="flex-1 bg-bg pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-[1800px] px-5 sm:px-8 lg:px-16">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-sm text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
          {backLabel}
        </Link>

        <header className="mt-6 max-w-2xl">
          <h1 className="text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[-0.03em] text-ink">
            {category.label}
          </h1>
          <p className="mt-4 text-pretty font-sans text-base text-muted sm:text-lg">
            Choose a project to view.
          </p>
        </header>

        <motion.div
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
          variants={staggerContainer(0.08)}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <Link
                href={`/${category.slug}/${project.slug}`}
                className="group block overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <div className="cinematic-grade relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-2">
                  {project.cover ? (
                    <>
                      <Image
                        src={project.cover.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-lg italic text-muted">Coming soon</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1.5 px-0.5">
                  <h2 className="text-balance font-display text-2xl leading-tight text-ink">
                    {project.label}
                  </h2>
                  <p className="font-sans text-sm text-muted">
                    {project.cover ? "View project" : "Coming soon"}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
