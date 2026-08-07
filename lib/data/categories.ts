export type CategorySlug =
  | "automotive"
  | "content-creator"
  | "corporate"
  | "events"
  | "fnb"
  | "medical"
  | "real-estate"
  | "sports"
  | "products";

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
    blurb: "Chrome, motion, and the light chasing both.",
    coverSeed: "automotive-cover",
  },
  {
    slug: "content-creator",
    label: "Content Creator",
    blurb: "Behind-the-scenes energy, shaped for a feed that never stops.",
    coverSeed: "content-creator-cover",
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
    blurb: "Light and space, framed the way a buyer imagines living in it.",
    coverSeed: "real-estate-cover",
  },
  {
    slug: "sports",
    label: "Sports",
    blurb: "The split second between effort and outcome.",
    coverSeed: "sports-cover",
  },
  {
    slug: "products",
    label: "Products",
    blurb: "Objects made to look the way they feel to hold.",
    coverSeed: "products-cover",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
