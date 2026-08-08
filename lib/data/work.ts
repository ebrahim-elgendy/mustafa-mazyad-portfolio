import {
  ORIENTATION_DIMS,
  Orientation,
  PLACEHOLDER_VIDEO_SOURCES,
  picsumUrl,
} from "@/lib/placeholder";
import { CategorySlug } from "@/lib/data/categories";
import { getLiveAssets } from "@/lib/data/source-map";

export type WorkType = "photography" | "video";

export interface WorkItem {
  id: string;
  category: CategorySlug;
  type: WorkType;
  title: string;
  year: number;
  orientation: Orientation;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  videoUrl?: string;
  duration?: string;
}

const TITLE_POOL: Record<CategorySlug, string[]> = {
  automotive: [
    "Night Drive",
    "Chrome Study",
    "Track Day",
    "Detail Pass",
    "Showroom Light",
    "Open Road",
    "Pit Lane",
    "Wet Asphalt",
    "Garage Hour",
    "Full Throttle",
  ],
  "content-creator": [
    "Ring Light Down",
    "Off Camera",
    "Second Take",
    "Studio Set",
    "Between Takes",
    "Frame Within Frame",
    "Green Room",
    "On Air",
    "Rough Cut",
    "Behind the Lens",
  ],
  corporate: [
    "The Boardroom",
    "Quiet Authority",
    "Between Meetings",
    "Office Hours",
    "The Handshake",
    "Glass and Light",
    "Executive Portrait",
    "The Briefing",
    "Floor Twelve",
    "After Hours",
  ],
  events: [
    "First Toast",
    "The Room Reacts",
    "Stage Left",
    "Last Call",
    "Opening Night",
    "Crowd Light",
    "Backstage Pass",
    "The Countdown",
    "Encore",
    "After Party",
  ],
  fnb: [
    "Steam Rising",
    "The Pass",
    "Plated",
    "Kitchen Line",
    "First Bite",
    "Golden Hour Table",
    "Chef's Counter",
    "Menu Study",
    "Late Service",
    "Fire and Char",
  ],
  medical: [
    "Sterile Light",
    "The Scrub In",
    "Ward Hours",
    "Precision Study",
    "Night Shift",
    "The Consult",
    "Clean Lines",
    "Equipment Study",
    "Corridor Light",
    "The Procedure Room",
  ],
  podcast: [
    "Episode One",
    "The Long Cut",
    "Mic Check",
    "Off the Record",
    "Two Chairs",
    "The Follow Up",
    "Cold Open",
    "Season Close",
    "The Guest",
    "Room Tone",
  ],
  "real-estate": [
    "Golden Hour Facade",
    "The Living Room",
    "Corner Windows",
    "Twilight Exterior",
    "Open Plan",
    "The Threshold",
    "Rooftop View",
    "Natural Light Study",
    "The Kitchen Island",
    "Street Level",
  ],
  sports: [
    "Match Point",
    "The Warm Up",
    "Split Second",
    "Full Sprint",
    "Final Whistle",
    "Locker Room",
    "The Dive",
    "Track Lane One",
    "Overtime",
    "The Huddle",
  ],
  products: [
    "Object Study",
    "Still Life No. 1",
    "Texture Pass",
    "The Unboxing",
    "Studio Light",
    "Material Study",
    "Detail Shot",
    "Negative Space",
    "The Reflection",
    "Product in Hand",
  ],
};

const ORIENTATION_CYCLE: Orientation[] = [
  "portrait",
  "landscape",
  "square",
  "landscape",
  "portrait",
  "landscape",
];

const DURATION_CYCLE = ["00:45", "01:12", "00:38", "02:05", "01:30", "00:52"];

const ITEMS_PER_GALLERY = 6;

function orientationFor(width: number, height: number): Orientation {
  if (width > height * 1.05) return "landscape";
  if (height > width * 1.05) return "portrait";
  return "square";
}

export function getWork(category: CategorySlug, type: WorkType): WorkItem[] {
  const liveAssets = getLiveAssets(category, type === "photography" ? "photo" : "video");
  if (liveAssets.length > 0) {
    return liveAssets.map((asset, i) => {
      const width = asset.width ?? 1600;
      const height = asset.height ?? 1200;
      return {
        id: `${category}-${type}-${i}`,
        category,
        type,
        title: asset.filename.replace(/\.[^.]+$/, ""),
        year: 2025,
        orientation: orientationFor(width, height),
        imageUrl: asset.url!,
        imageWidth: width,
        imageHeight: height,
        videoUrl: type === "video" ? asset.url! : undefined,
        duration: undefined,
      };
    });
  }

  const pool = TITLE_POOL[category];
  const offset = type === "video" ? 4 : 0;

  return Array.from({ length: ITEMS_PER_GALLERY }, (_, i) => {
    const title = pool[(i + offset) % pool.length];
    const orientation = ORIENTATION_CYCLE[i % ORIENTATION_CYCLE.length];
    const dims = ORIENTATION_DIMS[orientation];
    const seed = `${category}-${type}-${i}`;

    return {
      id: seed,
      category,
      type,
      title,
      year: i % 2 === 0 ? 2025 : 2024,
      orientation,
      imageUrl: picsumUrl(seed, dims.w, dims.h),
      imageWidth: dims.w,
      imageHeight: dims.h,
      videoUrl:
        type === "video"
          ? PLACEHOLDER_VIDEO_SOURCES[i % PLACEHOLDER_VIDEO_SOURCES.length]
          : undefined,
      duration: type === "video" ? DURATION_CYCLE[i % DURATION_CYCLE.length] : undefined,
    };
  });
}
