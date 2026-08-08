export type CategorySlug =
  | "corporate"
  | "events"
  | "fnb"
  | "medical"
  | "podcast";

export interface Category {
  slug: CategorySlug;
  label: string;
  blurb: string;
  coverSeed: string;
}

export const CATEGORIES: Category[] = [
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
    slug: "podcast",
    label: "Podcast",
    blurb: "Long-form conversation, framed and lit like it matters.",
    coverSeed: "podcast-cover",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
