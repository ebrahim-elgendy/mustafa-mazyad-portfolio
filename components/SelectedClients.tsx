"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Real clients — most pulled from Mostafa's own delivered project folders in
 * lib/data/source-map.ts (Corporate + Events), trimmed of their "- Dubai" /
 * "- Abu Dhabi" location suffixes; Deepal and Defender (automotive) added
 * per Mostafa directly, confirmed spelling. Excludes "Ducap Abu Dhabi", the
 * one project folder marked as having no delivered assets.
 */
const CLIENTS = [
  "Al Dar",
  "Al Wathba Hours Race",
  "Deepal",
  "Defender",
  "du",
  "Rayad Bank",
  "Turkish Embassy",
  "UFC",
  "Xpanse",
  "Dubai Land",
];

export default function SelectedClients() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-[1800px] px-5 pt-4 pb-16 sm:px-8 sm:pb-20 lg:px-16">
      <motion.p
        initial="hidden"
        animate="show"
        variants={fadeIn}
        className="text-center font-sans text-xs uppercase tracking-[0.25em] text-muted"
      >
        Selected Clients
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(reduceMotion ? 0 : 0.06, 0.1)}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14"
      >
        {CLIENTS.map((name) => (
          <motion.span
            key={name}
            variants={reduceMotion ? fadeIn : fadeUp}
            className="select-none font-display text-lg italic text-ink/35 transition-colors duration-300 hover:text-ink/70 sm:text-xl"
          >
            {name}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
