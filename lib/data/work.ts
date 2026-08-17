import { CategorySlug } from "@/lib/data/categories";
import { getLiveAssets, SourceAsset } from "@/lib/data/source-map";

export type WorkType = "photography" | "video";
export type Orientation = "portrait" | "landscape" | "square";

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

/** Real, uploaded work only — returns an empty list when a category has nothing live yet, rather than filler. */
export async function getWork(category: CategorySlug, type: WorkType): Promise<WorkItem[]> {
  const liveAssets = await getLiveAssets(category, type === "photography" ? "photo" : "video");
  return fromLiveAssets(category, type, `${category}-${type}`, liveAssets);
}
