"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

interface Client {
  name: string;
  /** Path under /public/clients — real logo, either sourced from Wikimedia
   *  Commons (clearly licensed) or supplied directly by Mostafa. Omitted
   *  where no usable logo exists yet; those render as a text wordmark. */
  logo?: string;
}

/**
 * Real clients Mostafa has worked with — confirmed either from his own
 * delivered project folders in lib/data/source-map.ts / the production DB,
 * or by Mostafa directly supplying the logo file. Excludes "Ducap Abu
 * Dhabi" (a project folder with no delivered assets).
 */
const ROW_1: Client[] = [
  { name: "Al Dar", logo: "/clients/aldar.png" },
  { name: "Defender", logo: "/clients/landrover.svg" },
  { name: "UFC", logo: "/clients/ufc.svg" },
  { name: "Deepal", logo: "/clients/deepal.svg" },
  { name: "ADNOC", logo: "/clients/adnoc.svg" },
  { name: "Al Tayer", logo: "/clients/al-tayer.png" },
  { name: "The Opus", logo: "/clients/the-opus.png" },
  { name: "Dubai Tourism", logo: "/clients/dubai-tourism.png" },
  { name: "JJ Chicken", logo: "/clients/jj-chicken.png" },
  { name: "ADO", logo: "/clients/ado.png" },
];

const ROW_2: Client[] = [
  { name: "du", logo: "/clients/du.png" },
  { name: "Riyad Bank", logo: "/clients/riyad-bank.png" },
  // Supplied logo is very low-contrast (pale pink on white) — pending a
  // clearer version from Mostafa before switching this to the image.
  { name: "Xpanse" },
  { name: "Dubai Land", logo: "/clients/dubai-land.png" },
  { name: "Al Ain Finance", logo: "/clients/al-ain-finance.png" },
  { name: "Tamouh", logo: "/clients/tamouh.png" },
  { name: "Frio", logo: "/clients/frio.png" },
  { name: "Zoi", logo: "/clients/zoi.png" },
  { name: "ZO Skin Centre", logo: "/clients/zo-skin-centre.png" },
];

function LogoCard({ client }: { client: Client }) {
  return (
    // Logos are drawn for a light background regardless of their own color
    // (several, like Aldar's, are solid black) — so this card stays a fixed
    // light surface rather than following the site's dark/light theme, same
    // as the reference design.
    <div className="group mx-2 flex h-20 w-40 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white px-4 sm:mx-3 sm:h-24 sm:w-48 sm:px-5">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.name}
          className="h-full max-h-14 w-full object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-16"
        />
      ) : (
        <span className="select-none whitespace-nowrap font-display text-lg italic text-black/45 transition-colors duration-300 group-hover:text-black/85 sm:text-xl">
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
