"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_QUART, fadeUp, staggerContainer } from "@/lib/motion";
import { picsumUrl } from "@/lib/placeholder";

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      aria-label="Introduction"
      className="relative flex min-h-screen items-end overflow-hidden bg-bg"
    >
      {/* Background — placeholder still, to be swapped with a shot of Mustafa or his work */}
      <div className="cinematic-grade absolute inset-0">
        <Image
          src={picsumUrl("hero-mustafa-mazyad", 1920, 1200)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Scrim — keeps headline/body text comfortably above 4.5:1 contrast */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.88) 100%)",
        }}
      />

      <motion.div
        variants={staggerContainer(0.12, 0.1)}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-40 sm:px-8 sm:pb-32"
      >
        <motion.h1
          variants={fadeUp}
          className="text-balance font-display text-[clamp(2.75rem,7vw,5.75rem)] leading-[1.02] tracking-[-0.04em] text-ink"
        >
          Mustafa Mazyad
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-xl font-sans text-base text-muted sm:text-lg"
        >
          A cinematic eye, nine industries, one consistent frame.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Book a Call
          </Link>
          <a
            href="#categories"
            className="inline-flex items-center rounded-full border border-border-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            View the Work
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT_QUART }}
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          className="h-8 w-px bg-border-strong"
          animate={
            prefersReducedMotion
              ? { opacity: [1, 0.4, 1] }
              : { scaleY: [1, 0.5, 1], opacity: [0.9, 0.4, 0.9] }
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT_QUART }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}
