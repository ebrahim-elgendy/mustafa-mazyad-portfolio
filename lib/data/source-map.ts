/**
 * Staging manifest for Mustafa's real archive (Drive: "Shared with me / portflio").
 *
 * Mirrors the folder tree exactly as shown in the client's screenshots.
 * `url` fields are filled in once each asset is uploaded to Blob storage —
 * until then they stay `null` and the site keeps rendering placeholders.
 *
 * Open questions to confirm before this is final (see conversation):
 * - fnb (food reels): the Drive listing was mid-scroll: filenames after
 *   "v4.mp4" were not visible and are NOT included below. Get the full list.
 * - podcast: pure long-form video, no photo counterpart — doesn't fit the
 *   Photography/Video SplitChooser pattern used by every other category.
 *   Needs its own route/template (episode list) rather than reusing
 *   app/[category]/photography and app/[category]/video.
 * - events/video has files up to ~960MB. These (and anything else this
 *   large) must be re-encoded for web delivery — they cannot be uploaded
 *   as-is to any host and served on a page.
 */

export type AssetKind = "photo" | "video";

export interface SourceAsset {
  /** Original filename in Drive, kept for traceability back to the source. */
  filename: string;
  kind: AssetKind;
  /** Size in MB as reported by Drive, where known — flags what needs re-encoding. */
  sizeMB: number | null;
  /** Populated once uploaded to Vercel Blob (or other CDN). */
  url: string | null;
  /** Pixel dimensions of the web-delivered (resized) file, once uploaded. */
  width?: number;
  height?: number;
}

function pending(filename: string, kind: AssetKind, sizeMB: number | null = null): SourceAsset {
  return { filename, kind, sizeMB, url: null };
}

/** Compact form for a flat list of same-kind assets: [filename, sizeMB][]. */
function photoAssets(entries: [string, number][]): SourceAsset[] {
  return entries.map(([filename, sizeMB]) => pending(filename, "photo", sizeMB));
}

/** A photo asset that has already been resized + uploaded to Blob storage. */
function livePhoto(
  filename: string,
  sizeMB: number,
  url: string,
  width: number,
  height: number
): SourceAsset {
  return { filename, kind: "photo", sizeMB, url, width, height };
}

export interface SubGallery {
  slug: string;
  label: string;
  assets: SourceAsset[];
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** An event subfolder whose contents haven't been enumerated yet. */
function unexpanded(label: string): SubGallery {
  return { slug: slugify(label), label, assets: [] };
}

function collectAssets(node: unknown): SourceAsset[] {
  if (Array.isArray(node)) return node.flatMap(collectAssets);
  if (node && typeof node === "object") {
    if ("filename" in node && "kind" in node && "url" in node) {
      return [node as SourceAsset];
    }
    return Object.values(node).flatMap(collectAssets);
  }
  return [];
}

/**
 * Generated manifests dropped by the ingest pipeline (download -> compress ->
 * upload to Blob), one file per sub-folder: lib/data/generated/{category}__{kind}__{subslug}.json
 * Read server-side only (fs), so getLiveAssets must run in a Server Component / server context.
 */
function readGeneratedAssets(categorySlug: string, kind: AssetKind): SourceAsset[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const dir = path.join(process.cwd(), "lib/data/generated");
    if (!fs.existsSync(dir)) return [];
    const prefix = `${categorySlug}__${kind}__`;
    const files = fs.readdirSync(dir).filter((f: string) => f.startsWith(prefix) && f.endsWith(".json"));
    return files.flatMap((f: string) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      return (raw as Array<Record<string, unknown>>)
        .filter((r) => !r.error)
        .map((r) => ({
          filename: r.filename as string,
          kind,
          sizeMB: (r.sizeMB as number) ?? null,
          url: r.url as string,
          width: r.width as number | undefined,
          height: r.height as number | undefined,
        }));
    });
  } catch {
    return [];
  }
}

/** Every uploaded (non-null url) asset of the given kind for a category — merges hand-authored SOURCE_MAP entries with generated pipeline manifests. */
export function getLiveAssets(categorySlug: string, kind: AssetKind): SourceAsset[] {
  const node = (SOURCE_MAP as Record<string, unknown>)[categorySlug];
  const fromSourceMap = node ? collectAssets(node).filter((a) => a.kind === kind && a.url) : [];
  const fromGenerated = readGeneratedAssets(categorySlug, kind);
  return [...fromSourceMap, ...fromGenerated];
}

export const SOURCE_MAP = {
  corporate: {
    projects: [
      {
        slug: "al-dar",
        label: "Al Dar",
        // LIVE — resized (max 2400px, q82) and uploaded to Vercel Blob.
        // Originals were 100MP Fujifilm GFX100 II files (5-22MB each).
        assets: [
          livePhoto("ADH 10030.jpg", 0.17, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010030.jpg", 2400, 1800),
          livePhoto("ADH 10055.jpg", 0.17, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010055.jpg", 2400, 1800),
          livePhoto("ADH 10062.jpg", 0.28, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010062.jpg", 2400, 1800),
          livePhoto("ADH 10070.jpg", 0.28, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010070.jpg", 2400, 2399),
          livePhoto("ADH 10119.jpg", 0.31, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010119.jpg", 2400, 2400),
          livePhoto("ADH 10129.jpg", 0.13, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010129.jpg", 2400, 2400),
          livePhoto("ADH 10164.jpg", 0.17, "https://sjufljzdlbyvvg5v.public.blob.vercel-storage.com/corporate/al-dar/ADH%2010164.jpg", 2400, 2400),
        ] as SourceAsset[],
      },
      {
        slug: "al-wathba-hours-race",
        label: "Al Wathba Hours Race",
        // Flat, photo-only — confirmed via Drive folder link.
        assets: [
          pending("75 - ESSA ABDULLA.JPG", "photo"),
          pending("77 - SULTAN AREF.JPG", "photo"),
          pending("AL wathba5559.jpg", "photo"),
          pending("AL wathba5562.jpg", "photo"),
          pending("AL wathba5568.jpg", "photo"),
          pending("AL wathba5572.jpg", "photo"),
          pending("AL wathba5585.jpg", "photo"),
          pending("AL wathba5586.jpg", "photo"),
          pending("AL wathba5589.jpg", "photo"),
          pending("AL wathba5591.jpg", "photo"),
          pending("AL wathba5596.jpg", "photo"),
          pending("AL wathba5600.jpg", "photo"),
          pending("AL wathba5604.jpg", "photo"),
          pending("AL wathba5605.jpg", "photo"),
        ] as SourceAsset[],
      },
    ],
  },

  events: {
    // Events / Photo — 24 per-event subfolders, all enumerated via Drive links.
    photo: [
      {
        slug: "council-for-motherhood-childhood-hatta",
        label: "Council for Motherhood & Childhood - HATTA",
        assets: photoAssets([
          ["MZD01450.jpg", 19], ["MZD01478.jpg", 22.6], ["MZD01506.jpg", 20.6],
          ["MZD01540.jpg", 17.9], ["MZD01545.jpg", 18.6], ["MZD01565.jpg", 22.3],
          ["MZD01601.jpg", 15.3], ["MZD01611.jpg", 19.4], ["MZD01649.jpg", 19.2],
          ["MZD01662.jpg", 16.7], ["MZD01702.jpg", 23.4], ["MZD01708.jpg", 19.2],
        ]),
      },
      {
        slug: "acwa-power-new-year-dubai",
        label: "ACWA POWER _ New Year _ Dubai",
        assets: photoAssets([
          ["MZD07360.jpg", 17.8], ["MZD07363.jpg", 17.1], ["MZD07366.jpg", 15.4],
          ["MZD07390.jpg", 23.6], ["MZD07396.jpg", 16.1], ["MZD07403.jpg", 18],
          ["MZD07451.jpg", 18.1], ["MZD07462.jpg", 14.3], ["MZD07469.jpg", 17.1],
          ["MZD07475.jpg", 17.4], ["MZD07489.jpg", 15.5], ["MZD07514.jpg", 9.9],
          ["MZD07556.jpg", 16.4], ["MZD07579.jpg", 16.3], ["MZD07607.jpg", 14.5],
          ["MZD07657.jpg", 16.4], ["MZD07693.jpg", 15.2], ["MZD07732.jpg", 12.9],
        ]),
      },
      {
        slug: "acwa-power-adha-eid-dubai",
        label: "ACWA POWER - ADHA EID - Dubai",
        assets: photoAssets([
          ["MZD08605.jpg", 21.5], ["MZD08614.jpg", 22.2], ["MZD08652.jpg", 18.6],
          ["MZD08665.jpg", 16.2], ["MZD08728.jpg", 15.7], ["MZD08802.jpg", 18.4],
          ["MZD08812.jpg", 19.7], ["MZD08814.jpg", 18.6], ["MZD08825.jpg", 18.8],
          ["MZD08831.jpg", 17.1], ["MZD08844.jpg", 16.8], ["MZD08945.jpg", 15.9],
          ["MZD09033.jpg", 19.6], ["MZD09078.jpg", 14], ["MZD09102.jpg", 19.3],
          ["MZD09111.jpg", 20.1], ["MZD09139.jpg", 18.9], ["MZD09168.jpg", 21.7],
          ["MZD09217.jpg", 21.2], ["MZD09240.jpg", 15.1], ["MZD09253.jpg", 12.6],
          ["MZD09258.jpg", 15.3],
        ]),
      },
      {
        slug: "al-dar-academy-abu-dhabi",
        label: "Al Dar Academy - Abu dhabi",
        assets: photoAssets([
          ["MZD01474.jpg", 12.1], ["MZD01479.jpg", 8.8], ["MZD01483.jpg", 10.4],
          ["MZD01507.jpg", 13.2], ["MZD01517.jpg", 10.4], ["MZD01524.jpg", 12.6],
          ["MZD01528.jpg", 10.9], ["MZD01532.jpg", 11.2], ["MZD01533.jpg", 13.5],
          ["MZD01534.jpg", 12.7], ["MZD01571.jpg", 13.4], ["MZD01572.jpg", 13.2],
          ["MZD01589.jpg", 16.8], ["MZD01597.jpg", 11.1], ["MZD01617.jpg", 17.8],
          ["MZD01653.jpg", 10.5], ["MZD01801.jpg", 12.8], ["MZD01853.jpg", 15.6],
          ["MZD01863.jpg", 19.3], ["MZD01870.jpg", 23], ["MZD01889.jpg", 15.8],
          ["MZD01892.jpg", 16.2], ["MZD01975.jpg", 13.2], ["MZD02117.jpg", 17.6],
          ["MZD02153.jpg", 17.4],
        ]),
      },
      {
        slug: "business-dinner-andaz-hotel-abu-dhabi",
        label: "Business Dinner - Andaz hotel - Abu Dhabi",
        assets: photoAssets([
          ["MZD00350-Enhanced-NR.jpg", 20.4], ["MZD00373-Enhanced-NR.jpg", 13.2],
          ["MZD00395-Enhanced-NR.jpg", 22.5], ["MZD00400-Enhanced-NR.jpg", 27],
          ["MZD00411-Enhanced-NR.jpg", 23.5], ["MZD00423-Enhanced-NR.jpg", 21.9],
          ["MZD00429-Enhanced-NR.jpg", 24], ["MZD00467-Enhanced-NR.jpg", 24.7],
          ["MZD00486-Enhanced-NR.jpg", 23], ["MZD00494-Enhanced-NR.jpg", 23],
          ["MZD00515-Enhanced-NR.jpg", 21.5], ["MZD00581-Enhanced-NR.jpg", 21.6],
          ["MZD00622-Enhanced-NR.jpg", 21.1], ["MZD00658-Enhanced-NR.jpg", 24.5],
          ["MZD00703-Enhanced-NR.jpg", 22.2], ["MZD00734-Enhanced-NR.jpg", 18.1],
          ["MZD00805-Enhanced-NR.jpg", 34.9], ["MZD00828-Enhanced-NR.jpg", 30],
          ["MZD00833-Enhanced-NR.jpg", 31.4], ["MZD00880-Enhanced-NR.jpg", 26.6],
          ["MZD00883-Enhanced-NR.jpg", 26.8], ["MZD00934-Enhanced-NR.jpg", 24.3],
          ["MZD00975-Enhanced-NR.jpg", 30.3], ["MZD00979-Enhanced-NR.jpg", 30.4],
          ["MZD01003-Enhanced-NR.jpg", 30.4], ["MZD01065-Enhanced-NR.jpg", 28.7],
        ]),
      },
      {
        slug: "du-event-dubai",
        label: "Du Event - Dubai",
        assets: photoAssets([
          ["MZD03436-2.jpg", 22.2], ["MZD03459-3.jpg", 16.5], ["MZD03466-2.jpg", 23.4],
          ["MZD03473-2.jpg", 13.4], ["MZD03495-2.jpg", 21.7], ["MZD03516-2.jpg", 13.3],
          ["MZD03539-2.jpg", 19], ["MZD03612-2.jpg", 17], ["MZD03651-2.jpg", 20.3],
        ]),
      },
      {
        slug: "dubai-land-event",
        label: "dubai land event",
        assets: photoAssets([
          ["MZD03707.jpg", 13.6], ["MZD03717.jpg", 14.6], ["MZD03747.jpg", 6.5],
          ["MZD03760.jpg", 17.4], ["MZD03794.jpg", 13.2], ["MZD03804-Edit.jpg", 15.2],
          ["MZD03889-Edit.jpg", 12.4], ["MZD03912.jpg", 12.4], ["MZD03917.jpg", 11.2],
          ["MZD04038-Enhanced-NR.jpg", 15.5], ["MZD04043.jpg", 33.1], ["MZD04054.jpg", 14.4],
          ["MZD04077.jpg", 12.8], ["MZD04084.jpg", 18], ["MZD04085.jpg", 15.6],
          ["MZD04086.jpg", 18.8], ["MZD04090.jpg", 16.3], ["MZD04096.jpg", 13.1],
        ]),
      },
      {
        slug: "dubai-world-obstacle-championship",
        label: "Dubai World Obstacle championship",
        // Two entries literally both named MZD06959.jpg (different share dates/sizes
        // per Drive) — kept as-is; resolve which is which once real files are in hand.
        assets: photoAssets([
          ["MZD06034.jpg", 12.5], ["MZD06040.jpg", 12], ["MZD06059.jpg", 16],
          ["MZD06062.jpg", 11.5], ["MZD06170.jpg", 9.1], ["MZD06551.jpg", 10.5],
          ["MZD06713.jpg", 20.9], ["MZD06861.jpg", 21.5], ["MZD06959.jpg", 18.8],
          ["MZD06959.jpg", 18.5], ["MZD07526.jpg", 11.8], ["MZD07783.jpg", 10.9],
          ["MZD08137.jpg", 12], ["MZD08198.jpg", 10.2], ["MZD08200.jpg", 12.2],
          ["MZD08842.jpg", 12.4], ["MZD08879.jpg", 11.4], ["MZD09015.jpg", 7.9],
          ["MZD09261.jpg", 17.9], ["MZD09268.jpg", 16.1], ["MZD09392.jpg", 18.1],
          ["MZD09405.jpg", 28], ["MZD09431.jpg", 18], ["MZD09814.jpg", 19.4],
          ["MZD09918.jpg", 19.5], ["MZD09987.jpg", 19.2],
        ]),
      },
      {
        slug: "ducap-abu-dhabi",
        label: "Ducap Abu dhabi",
        assets: [] as SourceAsset[], // confirmed empty
      },
      {
        slug: "energy-pool",
        label: "Energy Pool",
        assets: photoAssets([
          ["MZD07473.jpg", 14.9], ["MZD07474.jpg", 13.6], ["MZD07500.jpg", 12.8],
          ["MZD07510.jpg", 13.4], ["MZD07542.jpg", 13.4], ["MZD07604.jpg", 17.5],
          ["MZD07735.jpg", 14.4], ["MZD07738.jpg", 18.1], ["MZD07739.jpg", 16.6],
        ]),
      },
      {
        slug: "gitex-professional-quality-dubai",
        label: "GITEX - professional Quality - Dubai",
        assets: photoAssets([
          ["DSC00031.jpg", 13.1], ["DSC00140-Edit.jpg", 15.5], ["DSC00191.jpg", 3.4],
          ["DSC00329.jpg", 17.4], ["DSC00363.jpg", 24.8], ["DSC00395.jpg", 6.7],
          ["DSC00396.jpg", 7], ["DSC00533.jpg", 5.4], ["DSC00939.jpg", 5.2],
          ["DSC00963.jpg", 5], ["DSC00987.jpg", 4.7], ["DSC00990.jpg", 4.3],
          ["DSC01082.jpg", 4.3], ["DSC01163.jpg", 6.7], ["DSC04693.jpg", 7.4],
          ["DSC04869.jpg", 6.7],
        ]),
      },
      {
        slug: "i-see-institute-dubai",
        label: "i see institute-Dubai",
        assets: photoAssets([
          ["MZD01398.jpg", 10.1], ["MZD01400.jpg", 10.6], ["MZD01413.jpg", 16.6],
          ["MZD01452.jpg", 15.5], ["MZD01476.jpg", 15.5], ["MZD01482.jpg", 16.2],
          ["MZD01492.jpg", 10.8], ["MZD01513.jpg", 13.7], ["MZD01536.jpg", 20.9],
          ["MZD01540.jpg", 26.5], ["MZD01565.jpg", 16.1], ["MZD01568.jpg", 17.3],
          ["MZD01574.jpg", 15.4], ["MZD01583-Enhanced-NR.jpg", 13.1], ["MZD01598.jpg", 30.3],
          ["MZD01640.jpg", 17.6],
        ]),
      },
      {
        slug: "murabaa-dubai",
        label: "Murabaa - Dubai",
        assets: photoAssets([
          ["MZD03899.jpg", 15.5], ["MZD03913.jpg", 17.1], ["MZD03936.jpg", 20.5],
          ["MZD03943.jpg", 33.1], ["MZD03980-Enhanced-NR.jpg", 5.2], ["MZD04010.jpg", 14.7],
          ["MZD04022.jpg", 18.1], ["MZD04061.jpg", 17], ["MZD04074.jpg", 17.2],
          ["MZD04081.jpg", 14.2], ["MZD04129.jpg", 6.4], ["MZD04150.jpg", 5],
          ["MZD04157.jpg", 7.1], ["MZD04164.jpg", 4.1], ["MZD04168.jpg", 6.9],
          ["MZD04187.jpg", 17.6], ["MZD04189.jpg", 16.4], ["MZD04200.jpg", 12.4],
          ["MZD04240.jpg", 7.9], ["MZD04248.jpg", 15.7], ["MZD04285.jpg", 7.7],
          ["MZD04301.jpg", 8], ["MZD04330.jpg", 9.1], ["MZD04390.jpg", 5.7],
          ["MZD04419.jpg", 17.8], ["MZD04423.jpg", 17.1], ["MZD04503.jpg", 5.9],
          ["MZD04516.jpg", 7.6], ["MZD04568.jpg", 8], ["MZD05063-Enhanced-NR.jpg", 30],
        ]),
      },
      {
        slug: "new-year-celebration",
        label: "New year celebration",
        assets: photoAssets([
          ["MZD06351.jpg", 21.6], ["MZD06357.jpg", 23.6], ["MZD06358.jpg", 8.1],
          ["MZD06360.jpg", 8.8], ["MZD06364-Enhanced-NR.jpg", 17.9], ["MZD06365-Enhanced-NR.jpg", 22.3],
          ["MZD06395-Enhanced-NR.jpg", 26.1], ["MZD06396-Enhanced-NR.jpg", 23], ["MZD06399-Enhanced-NR.jpg", 27.7],
          ["MZD06453-Enhanced-NR.jpg", 26.3], ["MZD06511.jpg", 24], ["MZD06533.jpg", 18.9],
          ["MZD06578.jpg", 16.9], ["MZD06579.jpg", 14.7], ["MZD06592.jpg", 20.1],
          ["MZD06600-Enhanced-NR.jpg", 12.8], ["MZD06608-Enhanced-NR.jpg", 18.4], ["MZD06620-Enhanced-NR.jpg", 16.1],
          ["MZD06621-Enhanced-NR.jpg", 17.8], ["MZD06634-Enhanced-NR.jpg", 28.3], ["MZD06635-Enhanced-NR.jpg", 30.4],
          ["MZD06642-Enhanced-NR.jpg", 36.7], ["MZD06660.jpg", 26.3], ["MZD06687-Enhanced-NR.jpg", 25.9],
          ["MZD06693-Enhanced-NR.jpg", 18.8], ["MZD06703-Enhanced-NR.jpg", 26], ["MZD06704-Enhanced-NR.jpg", 17.3],
          ["MZD06706-Enhanced-NR.jpg", 14.3], ["MZD06711-Enhanced-NR.jpg", 19.6], ["MZD06712-Enhanced-NR.jpg", 19.7],
          ["MZD06720-Enhanced-NR.jpg", 25.6], ["MZD06723-Enhanced-NR.jpg", 27.9], ["MZD06733-Enhanced-NR.jpg", 24.4],
          ["MZD06748.jpg", 25.2], ["MZD06808-Enhanced-NR.jpg", 18.7], ["MZD06809.jpg", 17.7],
          ["MZD06821-Enhanced-NR.jpg", 15.3], ["MZD06832.jpg", 25.7], ["MZD06852.jpg", 27.5],
          ["MZD06881-Enhanced-NR.jpg", 23.4], ["MZD07016-Enhanced-NR.jpg", 23], ["MZD07018-Enhanced-NR.jpg", 20.8],
          ["MZD07296.jpg", 29.6], ["MZD07310.jpg", 31.4], ["MZD07329.jpg", 17.7],
        ]),
      },
      {
        slug: "president-cup-wathba-race-alwathba-abu-dhabi",
        label: "president cup wathba race-alwathba - Abu Dhabi",
        assets: photoAssets([
          ["the president cup4139.jpg", 19.6], ["the president cup4159.jpg", 7.2],
          ["the president cup4236.jpg", 14.7], ["the president cup4256.jpg", 11.4],
          ["the president cup4284.jpg", 15.2], ["the president cup4287.jpg", 13.2],
          ["the president cup4297.jpg", 12.7], ["the president cup4312.jpg", 14.1],
          ["the president cup4317.jpg", 13.9], ["the president cup4323.jpg", 14.2],
          ["the president cup4336.jpg", 13.7], ["the president cup4347.jpg", 11.6],
          ["the president cup4366.jpg", 14.6],
        ]),
      },
      {
        slug: "rayad-bank-abu-dhabi",
        label: "Rayad bank - Abu Dhabi",
        assets: photoAssets([
          ["MZD00489.jpg", 17.3], ["MZD00491.jpg", 17.5], ["MZD00498.jpg", 11.5],
          ["MZD00515.jpg", 14.8], ["MZD00593.jpg", 18.4], ["MZD00602.jpg", 24.7],
          ["MZD00648.jpg", 16.7], ["MZD00677.jpg", 17.3], ["MZD00750.jpg", 18.1],
          ["MZD00829.jpg", 16.2], ["MZD00872.jpg", 16.5], ["MZD00930.jpg", 9.6],
          ["MZD00933.jpg", 9.6], ["MZD00941.jpg", 8.3], ["MZD00969.jpg", 10.9],
          ["MZD00985.jpg", 11.2], ["MZD00989.jpg", 10.7], ["MZD00994.jpg", 9.6],
        ]),
      },
      {
        slug: "t100-triathlon-dubai",
        label: "T100 Triathlon - Duabi",
        assets: photoAssets([
          ["MZD07562.jpg", 8.9], ["MZD07564.jpg", 9], ["MZD07575.jpg", 9],
          ["MZD07602.jpg", 13.8], ["MZD07644.jpg", 15.4], ["MZD07680.jpg", 9.7],
          ["MZD07708.jpg", 19.1], ["MZD07713.jpg", 15.6], ["MZD07731.jpg", 18.3],
          ["MZD07732.jpg", 15.1], ["MZD07742.jpg", 22.9], ["MZD07751.jpg", 20],
          ["MZD07766.jpg", 18.8], ["MZD07784.jpg", 11.4], ["MZD07788.jpg", 12.2],
          ["MZD07848.jpg", 14.9], ["MZD07883.jpg", 10.3], ["MZD07884.jpg", 9],
          ["MZD07888.jpg", 10.1], ["MZD07891.jpg", 11.6], ["MZD07905.jpg", 12.7],
          ["MZD07923.jpg", 17], ["MZD07931.jpg", 8.8], ["MZD07932.jpg", 16],
          ["MZD07966.jpg", 18.7], ["MZD08021.jpg", 16.3], ["MZD08035.jpg", 18.4],
        ]),
      },
      {
        slug: "the-boat-show-abu-dhabi",
        label: "THE BOAT SHOW - abu dhabi",
        // Fully resolved via individual Drive file links + curl byte-range
        // probes (exact filenames + exact byte sizes, not estimates). Turned
        // up 2 duplicate-named pairs (HSN_8600.jpg, HSN_8634.jpg) and 4 files
        // beyond the range Drive's folder view had summarized (HSN_8900/8928/
        // 8945/8952) — so this category actually has more assets than Drive's
        // own "47 files" folder count implied.
        assets: photoAssets([
          ["DSC03229.jpg", 3.6], ["DSC03271.jpg", 14.2], ["DSC03273.jpg", 10.6],
          ["DSC03276.jpg", 8.6], ["DSC03288 copy.jpg", 9.1], ["DSC03288.jpg", 10.9],
          ["DSC03292.jpg", 8.8], ["DSC03294.jpg", 9.1], ["DSC03298.jpg", 14.2],
          ["DSC03304.jpg", 12.3], ["DSC03342.jpg", 11.2], ["DSC03355.jpg", 10.3],
          ["DSC03397.jpg", 13.6], ["DSC03409.jpg", 10.9], ["DSC03436.jpg", 4.5],
          ["DSC03526.jpg", 9.5], ["DSC03578.jpg", 4.6], ["DSC03589.jpg", 11.1],
          ["DSC03592.jpg", 11.3], ["DSC03890.jpg", 21], ["DSC03997.jpg", 21.2],
          ["DSC04017.jpg", 16.5],
          ["HIB_5431.jpg", 12.2], ["HIB_5446.jpg", 10.4], ["HIB_5465.jpg", 8.9],
          ["HIB_5469.jpg", 14.4], ["HIB_5502.jpg", 12.4], ["HIB_5537 copy.jpg", 17.4],
          ["HIB_5537.jpg", 18.9], ["HIB_5549.jpg", 16], ["HIB_5564.jpg", 12.6],
          ["HIB_5574.jpg", 8.9], ["HIB_5587.jpg", 9.5], ["HIB_5613.jpg", 14.8],
          ["HIB_5635.jpg", 14.3], ["HIB_5662.jpg", 19.1],
          ["HSN_8596.jpg", 14.6], ["HSN_8600.jpg", 15.7], ["HSN_8600.jpg", 15.9],
          ["HSN_8619.jpg", 11.6], ["HSN_8620.jpg", 13.7], ["HSN_8631.jpg", 10.2],
          ["HSN_8634.jpg", 15.8], ["HSN_8634.jpg", 8.9], ["HSN_8639.jpg", 12.6],
          ["HSN_8674.jpg", 13.7], ["HSN_8678.jpg", 8.4], ["HSN_8682.jpg", 10.8],
          ["HSN_8693.jpg", 15.1], ["HSN_8698.jpg", 11.8], ["HSN_8900.jpg", 16.2],
          ["HSN_8928.jpg", 14.3], ["HSN_8945.jpg", 17.1], ["HSN_8952.jpg", 14.5],
        ]),
      },
      {
        slug: "the-uae-hujjaj-forum-abu-dhabi",
        label: "The UAE Hujjaj forum - Abu Dhabi",
        assets: photoAssets([
          ["MZD05189.jpg", 7.6], ["MZD05218.jpg", 12], ["MZD05225.jpg", 15.2],
          ["MZD05244.jpg", 15.1], ["MZD05254.jpg", 13.7], ["MZD05294.jpg", 13.4],
          ["MZD05299.jpg", 12.1], ["MZD05321.jpg", 12.8], ["MZD05329.jpg", 18.1],
          ["MZD05335.jpg", 19.6], ["MZD05338.jpg", 21.6], ["MZD05391.jpg", 5.9],
          ["MZD05416.jpg", 4.5], ["MZD05593.jpg", 11.8], ["MZD05649.jpg", 5.7],
          ["MZD05703.jpg", 7.7], ["MZD05729.jpg", 17.6], ["MZD05787.jpg", 12],
          ["MZD05794.jpg", 20.1], ["MZD05846.jpg", 13.9], ["MZD05942.jpg", 13.9],
          ["MZD05944.jpg", 14.2], ["MZD05952.jpg", 15.1], ["MZD05961.jpg", 19.6],
          ["MZD05980.jpg", 22], ["MZD06010.jpg", 16.9], ["MZD06035.jpg", 17],
          ["MZD06058.jpg", 15.5], ["MZD06449.jpg", 14.5], ["MZD06603.jpg", 9.5],
        ]),
      },
      {
        slug: "turkish-embassy-dubai",
        label: "Turkish empassy - Dubai",
        assets: photoAssets([
          ["DSC02900.jpg", 14.6], ["DSC02927.jpg", 33.2], ["DSC03001.jpg", 18.8],
          ["DSC03054.jpg", 11.9], ["DSC03090.jpg", 18.6], ["DSC03136.jpg", 43],
          ["DSC03297-Enhanced-NR.jpg", 22], ["DSC03302-Enhanced-NR.jpg", 23.1],
          ["DSC03324-Enhanced-NR.jpg", 20.6], ["DSC03349.jpg", 45.2], ["DSC03398 copy.jpg", 38.9],
          ["DSC03409.jpg", 41.4], ["DSC03473.jpg", 60.1], ["DSC03488.jpg", 37.5],
          ["DSC03541.jpg", 32.8],
        ]),
      },
      {
        slug: "ufc-dubai",
        label: "UFC - Dubai",
        assets: photoAssets([
          ["AA6I3966-Enhanced-NR.jpg", 9.7], ["AA6I4020-Enhanced-NR.jpg", 12.3],
          ["AA6I4024-Enhanced-NR.jpg", 9.7], ["AA6I4075-Enhanced-NR.jpg", 7.8],
          ["AA6I4107-Enhanced-NR.jpg", 8.6], ["AA6I4131-Enhanced-NR.jpg", 9.5],
          ["AA6I4141-Enhanced-NR.jpg", 8.8], ["AA6I4144-Enhanced-NR.jpg", 7.4],
          ["AA6I4151-Enhanced-NR.jpg", 8.6], ["AA6I4204-Enhanced-NR.jpg", 7.7],
          ["AA6I4292-Enhanced-NR.jpg", 7.3], ["AA6I4327-Enhanced-NR.jpg", 7.9],
          ["AA6I4507-Enhanced-NR.jpg", 8.7], ["AA6I4597-Enhanced-NR.jpg", 7.9],
          ["AA6I4638-Enhanced-NR.jpg", 7.7], ["AA6I4734-Enhanced-NR.jpg", 7.5],
          ["AA6I4745-Enhanced-NR.jpg", 9.1], ["AA6I4750-Enhanced-NR.jpg", 10.7],
          ["AA6I4874-Enhanced-NR.jpg", 8.3], ["AA6I4922-Enhanced-NR.jpg", 7.1],
          ["AA6I5032-Enhanced-NR.jpg", 13.6], ["AA6I5058-Enhanced-NR.jpg", 7.7],
        ]),
      },
      {
        slug: "wolters-kluwer-dubai",
        label: "wolters kluwer-Dubai",
        assets: photoAssets([
          ["MZD02716-Enhanced-NR.jpg", 14.9], ["MZD02719-Enhanced-NR.jpg", 8.5],
          ["MZD02734-Enhanced-NR.jpg", 11.5], ["MZD02743-Enhanced-NR.jpg", 9.7],
          ["MZD02760-Enhanced-NR.jpg", 9.2], ["MZD02772-Enhanced-NR.jpg", 10.5],
          ["MZD02775-Enhanced-NR.jpg", 7], ["MZD02779-Enhanced-NR.jpg", 2.4],
          ["MZD02797-Enhanced-NR.jpg", 11.2], ["MZD02802-Enhanced-NR.jpg", 10.6],
          ["MZD02838-Enhanced-NR.jpg", 15.1], ["MZD02849-Enhanced-NR.jpg", 15.3],
          ["MZD02854-Enhanced-NR.jpg", 9.1], ["MZD02866-Enhanced-NR.jpg", 13.6],
          ["MZD02894-Enhanced-NR.jpg", 13.5], ["MZD02900-Enhanced-NR.jpg", 16.7],
          ["MZD03212-Enhanced-NR.jpg", 5.6], ["MZD03252-Enhanced-NR.jpg", 6.3],
        ]),
      },
      {
        slug: "xpanse-abu-dhabi",
        label: "Xpanse - Abu Dhabi",
        assets: photoAssets([
          ["MZD09843.jpg", 15.8], ["MZD09846.jpg", 11.9], ["MZD09849.jpg", 26.1],
          ["MZD09858.jpg", 9.9], ["MZD09861.jpg", 11.3], ["MZD09862.jpg", 12.5],
          ["MZD09872.jpg", 10.9], ["MZD09880.jpg", 21.8], ["MZD09899.jpg", 18.8],
          ["MZD09908.jpg", 27.1], ["MZD09909.jpg", 30], ["MZD09917.jpg", 26.2],
          ["MZD09919.jpg", 25.4], ["MZD09922.jpg", 23.8], ["MZD09928.jpg", 36.5],
          ["MZD09944.jpg", 32.4], ["MZD09949.jpg", 39.1], ["MZD09952.jpg", 27.9],
          ["MZD09957.jpg", 16.5], ["MZD09966.jpg", 24.6], ["MZD09968.jpg", 31.6],
          ["MZD09975.jpg", 30.9],
        ]),
      },
      {
        slug: "youth-retreat-future-museum-dubai",
        label: "Youth retreat - Future museum - Dubai",
        // Includes a second IMG_42xx-46xx batch (confirmed via curl probes,
        // exact byte sizes) — a different camera/session than IMG_7353.jpg,
        // grouped here per client confirmation.
        assets: photoAssets([
          ["0S3A1928 copy.jpg", 15.4], ["0S3A1928.jpg", 17.7], ["0S3A2466.jpg", 11.3],
          ["ABD07286.jpg", 14.5], ["ABD07415.jpg", 9.9], ["ABD07427.jpg", 9],
          ["ABD07550.jpg", 8.3], ["DSC07898.jpg", 8.4], ["DSC07914.jpg", 6.8],
          ["DSC07918.jpg", 8.6], ["DSC07920.jpg", 6], ["DSC07965.jpg", 8.3],
          ["DSC07966.jpg", 15], ["DSC07985.jpg", 7.7], ["DSC08000.jpg", 13],
          ["DSC08088.jpg", 10.7], ["DSC08095.jpg", 8.9], ["DSC08097.jpg", 10.7],
          ["DSC08114.jpg", 8.7], ["DSC08165.jpg", 8.5], ["DSC08173.jpg", 10.2],
          ["DSC08274.jpg", 8.8], ["DSC08588.jpg", 21.8], ["IMG_7353.jpg", 12.9],
          ["IMG_4219 copy.jpg", 1.4], ["IMG_4233 copy.jpg", 7.6], ["IMG_4263 copy.jpg", 5.2],
          ["IMG_4266 copy.jpg", 6], ["IMG_4290 copy.jpg", 7.7], ["IMG_4296 copy.jpg", 7.1],
          ["IMG_4314 copy.jpg", 8.5], ["IMG_4417 copy.jpg", 5], ["IMG_4439 copy.jpg", 7.5],
          ["IMG_4439 copy.jpg", 8.7], ["IMG_4471.jpg", 9], ["IMG_4483.jpg", 8.5],
          ["IMG_4509.jpg", 9], ["IMG_4524.jpg", 6.7], ["IMG_4572.jpg", 11],
          ["IMG_4574.jpg", 5.2], ["IMG_4593.jpg", 8.1], ["IMG_4595.jpg", 7.4],
          ["IMG_4601.jpg", 10.8], ["IMG_4608.jpg", 12.5],
        ]),
      },
    ] as SubGallery[],

    // Events / Video — flat, plus one nested "podcast" subfolder (not yet
    // expanded — separate from the top-level `podcast` category above).
    video: [
      pending("crown consalut .mp4", "video", 430.2),
      pending("Day 02.mp4", "video", 239.7),
      pending("day 3.mp4", "video", 144.2),
      pending("Day 3.mp4", "video", 302.7),
      pending("Day 04.mp4", "video", 314.4),
      pending("Dubai derma event.mp4", "video", 52.4),
      pending("Dubai World Obstacle 2.mp4", "video", 326.1),
      pending("ethraa.mp4", "video", 90.7),
      pending("ev.mp4", "video", 75.8),
      pending("Golden View Event - Scound interviews HZ04.mp4", "video", 268.7),
      pending("Golden View Event HZ05 interviews 02_1.mp4", "video", 199.2),
      pending("Golden view Event Vertical HZ03 .mp4", "video", 84),
      pending("lifestyle.mp4", "video", 78),
      pending("pca final.mp4", "video", 81.1),
      pending("professional beauty Event .MOV", "video", 80.8),
      pending("Promo.mp4", "video", 279.3),
      pending("Recap.mp4", "video", 206.7),
      pending("slik v1.mp4", "video", 93.1),
      pending("wolter cluwer highlight .mp4", "video", 959.9),
    ],
    // Events / Video / podcast — confirmed via Drive link: same 6 filenames
    // (near-identical sizes) as the top-level `podcast` category. Treated as
    // a duplicate copy, not distinct content.
  },

  fnb: {
    // "food reels" folder — flat, video-only. Confirmed via individual Drive
    // file links (past the earlier scroll cutoff). Naming has a gap — "vid
    // 2/4/6" exist but no "vid 1/3/5" turned up; confirm those don't exist
    // before treating this as the final count.
    video: [
      pending("3.mp4", "video"),
      pending("4.mov", "video"),
      pending("4.mp4", "video"),
      pending("123456 02.mp4", "video"),
      pending("backyard vid 1+.mp4", "video"),
      pending("backyard vid 2.mp4", "video"),
      pending("bbq bros .mp4", "video"),
      pending("bbq reel 1+.mov", "video"),
      pending("Deliveroo x Mr Holmes 1.mp4", "video"),
      pending("DOH 01.mp4", "video"),
      pending("reel 1.mp4", "video"),
      pending("reyhan.mp4", "video"),
      pending("v1.mp4", "video"),
      pending("v2_1.mp4", "video"),
      pending("v2.mp4", "video"),
      pending("v3.mp4", "video"),
      pending("v4.mp4", "video"),
      pending("vid 2.MP4", "video"),
      pending("vid 4.MP4", "video"),
      pending("vid 6.MP4", "video"),
    ],
  },

  medical: {
    // Medical / photo — confirmed via Drive link, only 4 images.
    photo: photoAssets([
      ["MZD04106.jpg", 8.5],
      ["MZD04117.jpg", 8.2],
      ["MZD09860.jpg", 10.3],
      ["MZD09865.jpg", 12.2],
    ]),

    // Medical / Video — confirmed via Drive link, then re-confirmed filename
    // by filename via individual Drive file links. Aesthetic/dermatology
    // clinic content. "Sunny welness .mp4" at 374.9MB needs re-encoding like
    // the Events/Video large files.
    video: [
      pending("Aestheticscc DR shiraz.MOV", "video", 90.1),
      pending("Aestheticscc DR shiraz.MP4", "video", 161.4),
      pending("BEAuty beyond.mp4", "video", 81),
      pending("CEllbooster.MP4", "video", 34.8),
      pending("clinic 2.mp4", "video", 5.2),
      pending("clinic.mp4", "video", 4),
      pending("Dome 4.mp4", "video", 2.5),
      pending("Dome cli.mp4", "video", 12.8),
      pending("Dome clinic.MP4", "video", 19.3),
      pending("DR Al batool clinic .MP4", "video", 35.3),
      pending("DR fady.mp4", "video", 80.6),
      pending("dr hossam 03.mp4", "video", 40.3),
      pending("dr ibrahim 03.mp4", "video", 34.5),
      pending("dr ibrahim.mp4", "video", 34.9),
      pending("Dubai derma.mp4", "video", 52.4),
      pending("Ejal 40.mp4", "video", 2.4),
      pending("EJAL40 (1).mp4", "video", 72.4),
      pending("ev.mp4", "video", 75.8),
      pending("fc .mp4", "video", 2.7),
      pending("fc clinic .mp4", "video", 3.7),
      pending("FC dintist.mp4", "video", 1.9),
      pending("fc french clinic.mp4", "video", 3.5),
      pending("image skin.mp4", "video", 44.5),
      pending("IMG_5261.MP4", "video", 132.5),
      pending("IMG_6842.MP4", "video", 39.9),
      pending("IMG_8750.MOV", "video", 80.8),
      pending("IMG_8765.MP4", "video", 23),
      pending("la belle .mp4", "video", 5.2),
      pending("labelle (1).mp4", "video", 4.4),
      pending("labelle (1).mp4", "video", 1.6), // duplicate name in Drive, different size
      pending("labelle clinic.MP4", "video", 160.2),
      pending("Lux cli.mp4", "video", 2.7),
      pending("Lux cli2.mp4", "video", 4.8),
      pending("Lux clii.mp4", "video", 7.5),
      pending("lux clin.mp4", "video", 2.4),
      pending("Lux clinic.mp4", "video", 2.6),
      pending("pca event.mp4", "video", 81.1),
      pending("Reel 02.mp4", "video", 32.5),
      pending("relaunch cellbooster.MP4", "video", 152),
      pending("Royal-core aesthetic EJAL40.mp4", "video", 72.4),
      pending("Sunny welness .mp4", "video", 374.9),
      pending("workshop.mp4", "video", 4.4),
      pending("workshop.mp4", "video", 2.7), // duplicate name in Drive, different size
      pending("worshop Altderma.MOV", "video", 60.1),
      pending("zo obagi Abu Dhabi.MOV", "video", 103.8),
    ],
  },

  podcast: {
    video: [
      pending("اخطاء تفاداهم قبل م تشتري ف دبي؟.mp4", "video"),
      pending("90% of the people.mp4", "video"),
      pending("Abo Dhabi to Dubai - En_1.mp4", "video"),
      pending("Bullish Final.mp4", "video"),
      pending("Dubai Tourism in 2025 V02.mp4", "video"),
      pending("Evry day - en.mp4", "video"),
    ],
  },
} as const;
