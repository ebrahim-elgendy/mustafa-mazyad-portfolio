"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

const CONTACT_EMAIL = "mostafa.mazyad@gmail.com";
const WHATSAPP_HREF = "https://wa.me/971507270423";
const INSTAGRAM_HANDLE = "@mostafa_mazyad_studio";
const INSTAGRAM_HREF = "https://www.instagram.com/mostafa_mazyad_studio";

export default function ContactContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex min-h-screen flex-col bg-bg px-5 pb-24 pt-24 sm:px-8 sm:pt-28">
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        variants={staggerContainer(0.1)}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center"
      >
        <motion.div variants={fadeUp}>
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-sm font-sans text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span aria-hidden="true">&larr;</span> Home
          </Link>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-balance font-display text-5xl leading-[1.05] tracking-[-0.04em] text-ink sm:text-6xl md:text-7xl"
        >
          Let&rsquo;s Talk
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-lg text-pretty font-sans text-base text-muted sm:text-lg"
        >
          Tell me about the shoot — the industry, the timeline, what it&rsquo;s
          for. I read every message myself and reply within a day.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Email Mostafa
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-border-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            WhatsApp
          </a>
        </motion.div>

        <motion.dl
          variants={fadeUp}
          className="mt-16 grid grid-cols-1 gap-8 border-t border-border pt-10 sm:grid-cols-3"
        >
          <div>
            <dt className="font-sans text-xs text-muted">Email</dt>
            <dd className="mt-2">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-sans text-sm text-ink transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-sans text-xs text-muted">Instagram</dt>
            <dd className="mt-2">
              <a
                href={INSTAGRAM_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ink transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {INSTAGRAM_HANDLE}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-sans text-xs text-muted">Based in</dt>
            <dd className="mt-2 font-sans text-sm text-ink">
              Dubai, UAE — available worldwide
            </dd>
          </div>
        </motion.dl>
      </motion.div>
    </main>
  );
}
