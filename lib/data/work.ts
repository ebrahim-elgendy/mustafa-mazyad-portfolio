import {
  ORIENTATION_DIMS,
  Orientation,
  PLACEHOLDER_VIDEO_SOURCES,
  placeholderImage,
} from "@/lib/placeholder";
import { CategorySlug } from "@/lib/data/categories";
import { getLiveAssets, getLiveProjectAssets, SourceAsset } from "@/lib/data/source-map";

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
    "Chrome and Shadow",
    "The Test Drive",
    "Showroom Light",
    "Detail Pass",
    "Night Garage",
    "The Reveal",
    "Track Day",
    "Full Throttle",
    "Wheel Study",
    "Last Polish",
  ],
  "content-creator": [
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
  contracts: [
    "The Signing",
    "Ink and Terms",
    "Handshake Deal",
    "Fine Print",
    "The Agreement",
    "Closing the Deal",
    "Two Signatures",
    "The Handoff",
    "Sealed",
    "Terms Set",
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
  "real-estate": [
    "Open House",
    "Golden Hour Listing",
    "The Walkthrough",
    "Curb Appeal",
    "Empty Rooms",
    "Skyline View",
    "The Closing",
    "Staged Light",
    "Floor Plan Study",
    "Move-In Ready",
  ],
  sports: [
    "The Sprint",
    "Match Point",
    "Sideline View",
    "The Warm Up",
    "Full Speed",
    "The Finish Line",
    "Locker Room",
    "Game Face",
    "The Rally",
    "Final Whistle",
  ],
  wedding: [
    "First Look",
    "The Vows",
    "Golden Hour Portraits",
    "The First Dance",
    "Getting Ready",
    "The Toast",
    "Confetti",
    "Quiet Moment",
    "The Recessional",
    "Last Light",
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

function fromLiveAssets(
  category: CategorySlug,
  type: WorkType,
  idPrefix: string,
  liveAssets: SourceAsset[]
): WorkItem[] {
  return liveAssets.map((asset, i) => {
    const width = asset.width ?? 1600;
    const height = asset.height ?? 1200;
    return {
      id: `${idPrefix}-${i}`,
      category,
      type,
      title: asset.title ?? asset.filename.replace(/\.[^.]+$/, "").trim(),
      year: 2025,
      orientation: orientationFor(width, height),
      imageUrl: type === "video" ? asset.posterUrl ?? asset.url! : asset.url!,
      imageWidth: width,
      imageHeight: height,
      videoUrl: type === "video" ? asset.url! : undefined,
      duration: undefined,
    };
  });
}

function placeholders(category: CategorySlug, type: WorkType, seedPrefix: string): WorkItem[] {
  const pool = TITLE_POOL[category];
  const offset = type === "video" ? 4 : 0;

  return Array.from({ length: ITEMS_PER_GALLERY }, (_, i) => {
    const title = pool[(i + offset) % pool.length];
    const orientation = ORIENTATION_CYCLE[i % ORIENTATION_CYCLE.length];
    const dims = ORIENTATION_DIMS[orientation];
    const seed = `${seedPrefix}-${i}`;

    return {
      id: seed,
      category,
      type,
      title,
      year: i % 2 === 0 ? 2025 : 2024,
      orientation,
      imageUrl: placeholderImage(seed, dims.w, dims.h),
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

export async function getWork(category: CategorySlug, type: WorkType): Promise<WorkItem[]> {
  const liveAssets = await getLiveAssets(category, type === "photography" ? "photo" : "video");
  if (liveAssets.length > 0) {
    return fromLiveAssets(category, type, `${category}-${type}`, liveAssets);
  }
  return placeholders(category, type, `${category}-${type}`);
}

/** Same as getWork, but scoped to a single project (client folder) within a category. */
export async function getProjectWork(
  category: CategorySlug,
  projectSlug: string,
  type: WorkType
): Promise<WorkItem[]> {
  const liveAssets = await getLiveProjectAssets(
    category,
    projectSlug,
    type === "photography" ? "photo" : "video"
  );
  if (liveAssets.length > 0) {
    return fromLiveAssets(category, type, `${category}-${projectSlug}-${type}`, liveAssets);
  }
  return placeholders(category, type, `${category}-${projectSlug}-${type}`);
}
