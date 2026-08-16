/**
 * Placeholder media, to be replaced with Mostafa's real shoots.
 *
 * Every category gets one curated, topic-relevant photo (a Porsche for
 * Automotive, a stethoscope for Medical, a backlit couple for Wedding, etc.)
 * served directly off Unsplash's CDN — reliable, real, and actually related
 * to the category, unlike a random seeded stock photo. Swap `CATEGORY_PHOTO_IDS`
 * for the client's own work as each category gets uploaded.
 */

export type Orientation = "portrait" | "landscape" | "square";

export const ORIENTATION_DIMS: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 1000, h: 1300 },
  landscape: { w: 1600, h: 1000 },
  square: { w: 1200, h: 1200 },
};

/** Two verifiably-hosted public sample clips, stood in for real reels. */
export const PLACEHOLDER_VIDEO_SOURCES = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
];

const CATEGORY_PHOTO_IDS: Record<string, string> = {
  automotive: "1503376780353-7e6692767b70", // dark sedan on the move
  "content-creator": "1522202176988-66273c2fd55f", // creators working on laptops
  contracts: "1520333789090-1afc82db536a", // hands signing at a table
  corporate: "1560179707-f14e90ef3623", // glass office towers
  events: "1511578314322-379afb476865", // conference hall, screens and rows
  fnb: "1466637574441-749b8f19452f", // fresh produce on a cutting board
  medical: "1584982751601-97dcc096659c", // stethoscope
  "real-estate": "1560184897-ae75f418493e", // house porch
  sports: "1571019613454-1cb2f99b2d8b", // workout in motion
  wedding: "1519741497674-611481863552", // backlit couple with bouquet
};

/** Falls back here for any seed that isn't a known category (the homepage hero). */
const HERO_PHOTO_ID = "1554048612-b6a482bc67e5"; // camera raised toward the sun

function unsplashUrl(photoId: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${photoId}?q=80&w=${width}&h=${height}&fit=crop&auto=format`;
}

/** Curated, topic-relevant placeholder photo for a category-prefixed seed, sized to the given box. */
export function placeholderImage(seed: string, width: number, height: number): string {
  const slug = Object.keys(CATEGORY_PHOTO_IDS).find(
    (s) => seed === s || seed.startsWith(`${s}-`)
  );
  const photoId = slug ? CATEGORY_PHOTO_IDS[slug] : HERO_PHOTO_ID;
  return unsplashUrl(photoId, width, height);
}
