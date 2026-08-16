/**
 * Placeholder media, to be replaced with Mostafa's real shoots.
 * Picsum gives stable, seeded stock photography; the `.cinematic-grade`
 * treatment (see globals.css) grades every image the same way so the
 * mismatched stock content still reads as one coherent body of work.
 */
export function picsumUrl(seed: string, width: number, height: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

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
