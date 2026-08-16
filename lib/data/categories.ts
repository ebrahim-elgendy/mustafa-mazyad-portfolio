export type CategorySlug =
  | "automotive"
  | "content-creator"
  | "contracts"
  | "corporate"
  | "events"
  | "fnb"
  | "medical"
  | "real-estate"
  | "sports"
  | "wedding";

export interface Category {
  slug: CategorySlug;
  label: string;
  blurb: string;
  coverSeed: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "automotive",
    label: "Automotive",
    blurb: "Metal, motion, and the light that makes it look fast standing still.",
    coverSeed: "automotive-cover",
  },
  {
    slug: "content-creator",
    label: "Content Creator",
    blurb: "Long-form conversation and social content, framed and lit like it matters.",
    coverSeed: "content-creator-cover",
  },
  {
    slug: "contracts",
    label: "Contracts",
    blurb: "The paperwork and signings behind every partnership.",
    coverSeed: "contracts-cover",
  },
  {
    slug: "corporate",
    label: "Corporate",
    blurb: "Boardrooms and portraits that still feel like a story.",
    coverSeed: "corporate-cover",
  },
  {
    slug: "events",
    label: "Events",
    blurb: "The room, the crowd, the one frame that was actually there.",
    coverSeed: "events-cover",
  },
  {
    slug: "fnb",
    label: "F&B",
    blurb: "Steam, texture, the second before the first bite.",
    coverSeed: "fnb-cover",
  },
  {
    slug: "medical",
    label: "Medical",
    blurb: "Precision environments, shot with the same care they demand.",
    coverSeed: "medical-cover",
  },
  {
    slug: "real-estate",
    label: "Real Estate",
    blurb: "Space and light, shot so a room sells itself.",
    coverSeed: "real-estate-cover",
  },
  {
    slug: "sports",
    label: "Sports",
    blurb: "The split-second where the whole match turns.",
    coverSeed: "sports-cover",
  },
  {
    slug: "wedding",
    label: "Wedding",
    blurb: "The day, as it actually felt, not just as it looked.",
    coverSeed: "wedding-cover",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
