"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

interface Client {
  name: string;
  /** Path under /public/clients — real logo, sourced from Wikimedia Commons
   *  (clearly licensed for reuse). Omitted where no reliable free logo
   *  could be found; those render as a styled text wordmark instead. */
  logo?: string;
}

/**
 * Real clients — most pulled from Mostafa's own delivered project folders in
 * lib/data/source-map.ts (Corporate + Events) and the live production DB
 * (automotive projects, plus brand names spotted in uploaded filenames
 * across real-estate/corporate/content-creator). Excludes "Ducap Abu Dhabi",
 * the one project folder marked as having no delivered assets, and personal
 * names found in filenames (not brands). Worth a pass with Mostafa to
 * confirm every name/spelling before this is final.
 */
const ROW_1: Client[] = [
  { name: "Al Dar", logo: "/clients/aldar.png" },
  { name: "Defender", logo: "/clients/landrover.svg" },
  { name: "UFC", logo: "/clients/ufc.svg" },
  { name: "Deepal", logo: "/clients/deepal.svg" },
  { name: "ADNOC", logo: "/clients/adnoc.svg" },
  { name: "Al Tayer" },
  { name: "Azizi" },
  { name: "The Opus" },
  { name: "Address" },
  { name: "Dubai Tourism" },
];

const ROW_2: Client[] = [
  { name: "du" },
  { name: "Al Wathba Hours Race" },
  { name: "Rayad Bank" },
  { name: "Turkish Embassy" },
  { name: "Xpanse" },
  { name: "Dubai Land" },
  { name: "Al Ain Finance" },
  { name: "Tamouh" },
  { name: "Sopranos" },
  { name: "Nolus" },
];

function LogoCard({ client }: { client: Client }) {
  return (
    // Logos are drawn for a light background regardless of their own color
    // (several, like Aldar's, are solid black) — so this card stays a fixed
    // light surface rather than following the site's dark/light theme, same
    // as the reference design.
    <div className="group mx-2 flex h-16 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white px-7 sm:mx-3 sm:h-20 sm:px-9">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.name}
          className="max-h-7 w-auto object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:max-h-9"
        />
      ) : (
        <span className="select-none whitespace-nowrap font-display text-base italic text-black/45 transition-colors duration-300 group-hover:text-black/85 sm:text-lg">
          {client.name}
        </span>
      )}
    </div>
  );
}

function MarqueeRow({ clients, reverse = false }: { clients: Client[]; reverse?: boolean }) {
  return (
    <div
      className="marquee-row overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className={`flex w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}>
        {[...clients, ...clients].map((client, i) => (
          <LogoCard key={`${client.name}-${i}`} client={client} />
        ))}
      </div>
    </div>
  );
}

export default function SelectedClients() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="pt-4 pb-16 sm:pb-20">
      <motion.p
        initial="hidden"
        animate="show"
        variants={fadeIn}
        className="mx-auto max-w-[1800px] px-5 text-center font-sans text-xs uppercase tracking-[0.25em] text-muted sm:px-8 lg:px-16"
      >
        Selected Clients
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeIn}
        className="mt-8 flex flex-col gap-4 sm:mt-10 sm:gap-5"
      >
        {reduceMotion ? (
          <div className="flex flex-wrap items-center justify-center gap-3 px-5 sm:px-8">
            {[...ROW_1, ...ROW_2].map((client) => (
              <LogoCard key={client.name} client={client} />
            ))}
          </div>
        ) : (
          <>
            <MarqueeRow clients={ROW_1} />
            <MarqueeRow clients={ROW_2} reverse />
          </>
        )}
      </motion.div>
    </section>
  );
}
