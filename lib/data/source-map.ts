/**
 * Staging manifest for Mostafa's real archive (Drive: "Shared with me / portflio").
 *
 * Mirrors the folder tree exactly as shown in the client's screenshots.
 * `url` fields are filled in once each asset is resized/compressed and
 * dropped into /public/media (served locally, no external host) —
 * until then they stay `null` and the site keeps rendering placeholders.
 *
 * Pipeline status (see scripts/media-pipeline/process_dir.mjs):
 * - Corporate + Events photo folders and the Events/F&B/Podcast video
 *   archives are processed and live in /public/media, with per-folder
 *   manifests in lib/data/generated/.
 * - Podcast is video-only and currently reuses the standard /[category]/video
 *   gallery; a dedicated episode-list template remains a possible follow-up.
 * - Entries still marked `pending` below (medical, plus the large events
 *   reels up to ~960MB in Drive) still need the compress/re-encode step
 *   before they can be served on a page.
 */

import {
  dbCategoryCover,
  dbCategoryHasPhotography,
  dbProjectKind,
  getDbAssets,
  getDbProjectAssets,
  getDbProjects,
} from "@/lib/data/db-assets";

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
  /** Extracted poster frame for a video asset — required for it to render as a thumbnail (the .mp4 itself isn't a decodable image). */
  posterUrl?: string;
  /** Optional display title; overrides the filename-derived title (filenames are kept as-is for traceability to Drive). */
  title?: string;
}

function pending(filename: string, kind: AssetKind, sizeMB: number | null = null): SourceAsset {
  return { filename, kind, sizeMB, url: null };
}

/** Compact form for a flat list of same-kind assets: [filename, sizeMB][]. */
function photoAssets(entries: [string, number][]): SourceAsset[] {
  return entries.map(([filename, sizeMB]) => pending(filename, "photo", sizeMB));
}

/** Builds a URL-safe path into /public/media for a locally-hosted asset. */
function localUrl(...segments: string[]) {
  return "/" + segments.map((s) => encodeURIComponent(s)).join("/");
}

/**
 * A photo asset from the old locally-hosted archive (/public/media, since
 * removed — the client now re-uploads this content through the admin
 * dashboard into Blob storage instead). Kept as `pending` rather than wired
 * back to a live URL so the site falls back to placeholders instead of
 * broken images until each folder is re-uploaded.
 */
function livePhoto(
  filename: string,
  sizeMB: number,
  _url: string,
  _width: number,
  _height: number
): SourceAsset {
  return pending(filename, "photo", sizeMB);
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
          posterUrl: r.posterUrl as string | undefined,
          title: r.title as string | undefined,
        }));
    });
  } catch {
    return [];
  }
}

/** Every uploaded (non-null url) asset of the given kind for a category — merges hand-authored SOURCE_MAP entries, generated pipeline manifests, and client-uploaded DB assets (flat, not attached to a project). */
export async function getLiveAssets(categorySlug: string, kind: AssetKind): Promise<SourceAsset[]> {
  const node = (SOURCE_MAP as Record<string, unknown>)[categorySlug];
  const fromSourceMap = node ? collectAssets(node).filter((a) => a.kind === kind && a.url) : [];
  const fromGenerated = readGeneratedAssets(categorySlug, kind);
  const fromDb = await getDbAssets(categorySlug, kind);
  return [...fromSourceMap, ...fromGenerated, ...fromDb];
}

/** Whether a category has any photography at all (live or pending) — categories with video-only archives (e.g. fnb) skip the Photography/Video split entirely. */
export async function categoryHasPhotography(categorySlug: string): Promise<boolean> {
  const node = (SOURCE_MAP as Record<string, unknown>)[categorySlug];
  if (!node) return true;
  if (collectAssets(node).some((a) => a.kind === "photo")) return true;
  return dbCategoryHasPhotography(categorySlug);
}

/**
 * Real cover image for a category's homepage card, in place of the picsum
 * placeholder — first uploaded photo if the category has any, else the
 * poster frame of its first uploaded video (e.g. fnb, which is video-only).
 */
export async function getCategoryCover(categorySlug: string): Promise<string | undefined> {
  const photo = (await getLiveAssets(categorySlug, "photo"))[0]?.url;
  if (photo) return photo;
  const videoPoster = (await getLiveAssets(categorySlug, "video"))[0]?.posterUrl;
  if (videoPoster) return videoPoster;
  return dbCategoryCover(categorySlug);
}

export interface Project {
  slug: string;
  label: string;
  /** The project's own first uploaded photo, used as its thumbnail — undefined until real files are ingested. */
  cover?: { url: string; width: number; height: number };
}

interface RawProject {
  slug: string;
  label: string;
  assets: SourceAsset[];
}

function projectsNode(categorySlug: string): RawProject[] | undefined {
  const node = (SOURCE_MAP as Record<string, unknown>)[categorySlug];
  if (!node || typeof node !== "object") return undefined;
  const projects = (node as Record<string, unknown>).projects;
  return Array.isArray(projects) ? (projects as RawProject[]) : undefined;
}

/**
 * Distinct client folders within a category (e.g. Corporate's "Al Dar" and
 * "Al Wathba Hours Race") — only categories whose SOURCE_MAP entry has a
 * `projects` array expose these; everything else returns an empty list and
 * the category page renders a flat gallery instead.
 */
export async function getProjects(categorySlug: string, kind?: AssetKind): Promise<Project[]> {
  const projects = projectsNode(categorySlug);
  const fromSourceMap = (projects ?? [])
    .filter((p) => !kind || collectAssets(p.assets).some((a) => a.kind === kind))
    .map((p) => {
      const cover = collectAssets(p.assets).find((a) => a.kind === "photo" && a.url);
      return {
        slug: p.slug,
        label: p.label,
        cover: cover
          ? { url: cover.url!, width: cover.width ?? 1600, height: cover.height ?? 1200 }
          : undefined,
      };
    });

  const fromDb = await getDbProjects(categorySlug);
  return [...fromSourceMap, ...fromDb.filter((p) => !fromSourceMap.some((sp) => sp.slug === p.slug))];
}

/** Live (uploaded) assets of the given kind scoped to a single project within a category. */
export async function getLiveProjectAssets(
  categorySlug: string,
  projectSlug: string,
  kind: AssetKind
): Promise<SourceAsset[]> {
  const projects = projectsNode(categorySlug);
  const project = projects?.find((p) => p.slug === projectSlug);
  const fromSourceMap = project ? collectAssets(project.assets).filter((a) => a.kind === kind && a.url) : [];
  const fromDb = await getDbProjectAssets(categorySlug, projectSlug, kind);
  return [...fromSourceMap, ...fromDb];
}

/** Whether a project's archive is photos or video — used to pick which gallery template to render. */
export async function getProjectKind(categorySlug: string, projectSlug: string): Promise<AssetKind> {
  const projects = projectsNode(categorySlug);
  const project = projects?.find((p) => p.slug === projectSlug);
  if (project) {
    const assets = collectAssets(project.assets);
    return assets.some((a) => a.kind === "photo") ? "photo" : "video";
  }
  return (await dbProjectKind(categorySlug, projectSlug)) ?? "video";
}

export const SOURCE_MAP = {
  corporate: {
    projects: [
      {
        slug: "al-dar",
        label: "Al Dar",
        // LIVE — resized (max 2400px, q82) locally and served from
        // /public/media, no external host. Originals were 100MP Fujifilm
        // GFX100 II files (25-52MB each).
        assets: [
          livePhoto("ADH 10030.jpg", 0.28, localUrl("media", "corporate", "al-dar", "ADH 10030.jpg"), 2400, 1800),
          livePhoto("ADH 10055.jpg", 0.19, localUrl("media", "corporate", "al-dar", "ADH 10055.jpg"), 2400, 1800),
          livePhoto("ADH 10062.jpg", 0.31, localUrl("media", "corporate", "al-dar", "ADH 10062.jpg"), 2400, 1800),
          livePhoto("ADH 10070.jpg", 0.16, localUrl("media", "corporate", "al-dar", "ADH 10070.jpg"), 2400, 2399),
          livePhoto("ADH 10119.jpg", 0.19, localUrl("media", "corporate", "al-dar", "ADH 10119.jpg"), 2400, 2400),
          livePhoto("ADH 10129.jpg", 0.29, localUrl("media", "corporate", "al-dar", "ADH 10129.jpg"), 2400, 2400),
          livePhoto("ADH 10164.jpg", 0.23, localUrl("media", "corporate", "al-dar", "ADH 10164.jpg"), 2400, 2400),
        ] as SourceAsset[],
      },
      {
        slug: "al-wathba-hours-race",
        label: "Al Wathba Hours Race",
        // LIVE — resized (max 2400px, q82) locally and served from /public/media.
        assets: [
          livePhoto("75 - ESSA ABDULLA.JPG", 0.31, localUrl("media", "corporate", "al-wathba-hours-race", "75 - ESSA ABDULLA.JPG"), 1600, 2400),
          livePhoto("77 - SULTAN AREF.JPG", 0.45, localUrl("media", "corporate", "al-wathba-hours-race", "77 - SULTAN AREF.JPG"), 1600, 2400),
          livePhoto("AL wathba5559.jpg", 0.20, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5559.jpg"), 1600, 2400),
          livePhoto("AL wathba5562.jpg", 0.23, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5562.jpg"), 1600, 2400),
          livePhoto("AL wathba5568.jpg", 0.26, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5568.jpg"), 1662, 2400),
          livePhoto("AL wathba5572.jpg", 0.21, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5572.jpg"), 1870, 2400),
          livePhoto("AL wathba5585.jpg", 0.22, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5585.jpg"), 1757, 2400),
          livePhoto("AL wathba5586.jpg", 0.18, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5586.jpg"), 1773, 2400),
          livePhoto("AL wathba5589.jpg", 0.22, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5589.jpg"), 1689, 2400),
          livePhoto("AL wathba5591.jpg", 0.25, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5591.jpg"), 1647, 2400),
          livePhoto("AL wathba5596.jpg", 0.23, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5596.jpg"), 1659, 2400),
          livePhoto("AL wathba5600.jpg", 0.17, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5600.jpg"), 1685, 2400),
          livePhoto("AL wathba5604.jpg", 0.24, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5604.jpg"), 1703, 2400),
          livePhoto("AL wathba5605.jpg", 0.22, localUrl("media", "corporate", "al-wathba-hours-race", "AL wathba5605.jpg"), 1641, 2400),
        ] as SourceAsset[],
      },
    ],
  },

  events: {
    // Events / Photo — one project per client/event folder, mirroring the
    // real Drive structure exactly (LIVE, resized locally to /public/media).
    projects: [
      {
        slug: "council-for-motherhood-childhood-hatta",
        label: "Council for Motherhood & Childhood - HATTA",
        assets: [
          livePhoto("MZD01478.jpg", 0.41, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01478.jpg"), 2400, 1600),
          livePhoto("MZD01506.jpg", 0.31, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01506.jpg"), 2400, 1600),
          livePhoto("MZD01565.jpg", 0.37, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01565.jpg"), 2400, 1600),
          livePhoto("MZD01601.jpg", 0.25, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01601.jpg"), 2400, 1600),
          livePhoto("MZD01611.jpg", 0.32, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01611.jpg"), 2400, 1600),
          livePhoto("MZD01649.jpg", 0.28, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01649.jpg"), 2400, 1600),
          livePhoto("MZD01662.jpg", 0.23, localUrl("media", "events", "council-for-motherhood-childhood-hatta", "MZD01662.jpg"), 2400, 1600),
        ] as SourceAsset[],
      },
      {
        slug: "du-event-dubai",
        label: "Du Event - Dubai",
        assets: [
          livePhoto("MZD03473-2.jpg", 0.27, localUrl("media", "events", "du-event-dubai", "MZD03473-2.jpg"), 2400, 1600),
          livePhoto("MZD03516-2.jpg", 0.27, localUrl("media", "events", "du-event-dubai", "MZD03516-2.jpg"), 2400, 1600),
          livePhoto("MZD03612-2.jpg", 0.27, localUrl("media", "events", "du-event-dubai", "MZD03612-2.jpg"), 2400, 1600),
        ] as SourceAsset[],
      },
      {
        slug: "ducap-abu-dhabi",
        label: "Ducap Abu Dhabi",
        assets: [] as SourceAsset[], // confirmed empty
      },
      {
        slug: "rayad-bank-abu-dhabi",
        label: "Rayad Bank - Abu Dhabi",
        assets: [
          livePhoto("MZD00489.jpg", 0.22, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00489.jpg"), 2400, 1600),
          livePhoto("MZD00498.jpg", 0.29, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00498.jpg"), 2400, 1846),
          livePhoto("MZD00648.jpg", 0.34, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00648.jpg"), 2400, 1600),
          livePhoto("MZD00677.jpg", 0.34, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00677.jpg"), 2400, 1600),
          livePhoto("MZD00750.jpg", 0.38, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00750.jpg"), 2400, 1600),
          livePhoto("MZD00829.jpg", 0.37, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00829.jpg"), 2400, 1739),
          livePhoto("MZD00872.jpg", 0.33, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00872.jpg"), 2400, 1600),
          livePhoto("MZD00930.jpg", 0.23, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00930.jpg"), 2400, 1635),
          livePhoto("MZD00941.jpg", 0.19, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00941.jpg"), 2400, 1634),
          livePhoto("MZD00969.jpg", 0.34, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00969.jpg"), 2400, 1635),
          livePhoto("MZD00985.jpg", 0.26, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00985.jpg"), 2400, 1600),
          livePhoto("MZD00989.jpg", 0.22, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00989.jpg"), 2400, 1602),
          livePhoto("MZD00994.jpg", 0.19, localUrl("media", "events", "rayad-bank-abu-dhabi", "MZD00994.jpg"), 2400, 1595),
        ] as SourceAsset[],
      },
      {
        slug: "t100-triathlon-dubai",
        label: "T100 Triathlon - Dubai",
        assets: [
          livePhoto("MZD07562.jpg", 0.37, localUrl("media", "events", "t100-triathlon-dubai", "MZD07562.jpg"), 2400, 2027),
          livePhoto("MZD07564.jpg", 0.38, localUrl("media", "events", "t100-triathlon-dubai", "MZD07564.jpg"), 2400, 2027),
          livePhoto("MZD07575.jpg", 0.31, localUrl("media", "events", "t100-triathlon-dubai", "MZD07575.jpg"), 2400, 2027),
          livePhoto("MZD07602.jpg", 0.22, localUrl("media", "events", "t100-triathlon-dubai", "MZD07602.jpg"), 2400, 1600),
          livePhoto("MZD07644.jpg", 0.34, localUrl("media", "events", "t100-triathlon-dubai", "MZD07644.jpg"), 2400, 1600),
          livePhoto("MZD07680.jpg", 0.45, localUrl("media", "events", "t100-triathlon-dubai", "MZD07680.jpg"), 2191, 2400),
          livePhoto("MZD07713.jpg", 0.34, localUrl("media", "events", "t100-triathlon-dubai", "MZD07713.jpg"), 2400, 1738),
          livePhoto("MZD07732.jpg", 0.37, localUrl("media", "events", "t100-triathlon-dubai", "MZD07732.jpg"), 2400, 1600),
          livePhoto("MZD07766.jpg", 0.5, localUrl("media", "events", "t100-triathlon-dubai", "MZD07766.jpg"), 1811, 2400),
          livePhoto("MZD07784.jpg", 0.7, localUrl("media", "events", "t100-triathlon-dubai", "MZD07784.jpg"), 2017, 2400),
          livePhoto("MZD07788.jpg", 0.76, localUrl("media", "events", "t100-triathlon-dubai", "MZD07788.jpg"), 2192, 2400),
          livePhoto("MZD07848.jpg", 1.17, localUrl("media", "events", "t100-triathlon-dubai", "MZD07848.jpg"), 2378, 2400),
          livePhoto("MZD07883.jpg", 0.63, localUrl("media", "events", "t100-triathlon-dubai", "MZD07883.jpg"), 2400, 2210),
          livePhoto("MZD07884.jpg", 0.33, localUrl("media", "events", "t100-triathlon-dubai", "MZD07884.jpg"), 2210, 2400),
          livePhoto("MZD07888.jpg", 0.38, localUrl("media", "events", "t100-triathlon-dubai", "MZD07888.jpg"), 2400, 2021),
          livePhoto("MZD07891.jpg", 0.51, localUrl("media", "events", "t100-triathlon-dubai", "MZD07891.jpg"), 2021, 2400),
          livePhoto("MZD07905.jpg", 0.33, localUrl("media", "events", "t100-triathlon-dubai", "MZD07905.jpg"), 2400, 1600),
          livePhoto("MZD07923.jpg", 0.41, localUrl("media", "events", "t100-triathlon-dubai", "MZD07923.jpg"), 2400, 1600),
          livePhoto("MZD07931.jpg", 0.5, localUrl("media", "events", "t100-triathlon-dubai", "MZD07931.jpg"), 2189, 2400),
          livePhoto("MZD08021.jpg", 0.55, localUrl("media", "events", "t100-triathlon-dubai", "MZD08021.jpg"), 2400, 1925),
          livePhoto("MZD08035.jpg", 0.41, localUrl("media", "events", "t100-triathlon-dubai", "MZD08035.jpg"), 1600, 2400),
        ] as SourceAsset[],
      },
      {
        slug: "turkish-embassy-dubai",
        label: "Turkish Embassy - Dubai",
        assets: [
          livePhoto("DSC02900.jpg", 0.26, localUrl("media", "events", "turkish-embassy-dubai", "DSC02900.jpg"), 2400, 1600),
          livePhoto("DSC03054.jpg", 0.23, localUrl("media", "events", "turkish-embassy-dubai", "DSC03054.jpg"), 2400, 1600),
        ] as SourceAsset[],
      },
      {
        slug: "ufc-dubai",
        label: "UFC - Dubai",
        assets: [
          livePhoto("AA6I3966-Enhanced-NR.jpg", 0.47, localUrl("media", "events", "ufc-dubai", "AA6I3966-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4020-Enhanced-NR.jpg", 0.61, localUrl("media", "events", "ufc-dubai", "AA6I4020-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4024-Enhanced-NR.jpg", 0.44, localUrl("media", "events", "ufc-dubai", "AA6I4024-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4075-Enhanced-NR.jpg", 0.24, localUrl("media", "events", "ufc-dubai", "AA6I4075-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4107-Enhanced-NR.jpg", 0.32, localUrl("media", "events", "ufc-dubai", "AA6I4107-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4131-Enhanced-NR.jpg", 0.48, localUrl("media", "events", "ufc-dubai", "AA6I4131-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("AA6I4141-Enhanced-NR.jpg", 0.58, localUrl("media", "events", "ufc-dubai", "AA6I4141-Enhanced-NR.jpg"), 2400, 1809),
          livePhoto("AA6I4144-Enhanced-NR.jpg", 0.53, localUrl("media", "events", "ufc-dubai", "AA6I4144-Enhanced-NR.jpg"), 2400, 1808),
          livePhoto("AA6I4151-Enhanced-NR.jpg", 0.41, localUrl("media", "events", "ufc-dubai", "AA6I4151-Enhanced-NR.jpg"), 2400, 1579),
          livePhoto("AA6I4204-Enhanced-NR.jpg", 0.32, localUrl("media", "events", "ufc-dubai", "AA6I4204-Enhanced-NR.jpg"), 2400, 1579),
          livePhoto("AA6I4292-Enhanced-NR.jpg", 0.31, localUrl("media", "events", "ufc-dubai", "AA6I4292-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4327-Enhanced-NR.jpg", 0.4, localUrl("media", "events", "ufc-dubai", "AA6I4327-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4507-Enhanced-NR.jpg", 0.51, localUrl("media", "events", "ufc-dubai", "AA6I4507-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4597-Enhanced-NR.jpg", 0.42, localUrl("media", "events", "ufc-dubai", "AA6I4597-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4638-Enhanced-NR.jpg", 0.35, localUrl("media", "events", "ufc-dubai", "AA6I4638-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4734-Enhanced-NR.jpg", 0.44, localUrl("media", "events", "ufc-dubai", "AA6I4734-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4745-Enhanced-NR.jpg", 0.55, localUrl("media", "events", "ufc-dubai", "AA6I4745-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4750-Enhanced-NR.jpg", 0.59, localUrl("media", "events", "ufc-dubai", "AA6I4750-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4874-Enhanced-NR.jpg", 0.37, localUrl("media", "events", "ufc-dubai", "AA6I4874-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I4922-Enhanced-NR.jpg", 0.38, localUrl("media", "events", "ufc-dubai", "AA6I4922-Enhanced-NR.jpg"), 2400, 1649),
          livePhoto("AA6I5058-Enhanced-NR.jpg", 0.21, localUrl("media", "events", "ufc-dubai", "AA6I5058-Enhanced-NR.jpg"), 2400, 1600),
        ] as SourceAsset[],
      },
      {
        slug: "xpanse-abu-dhabi",
        label: "Xpanse - Abu Dhabi",
        assets: [
          livePhoto("MZD09957.jpg", 0.59, localUrl("media", "events", "xpanse-abu-dhabi", "MZD09957.jpg"), 2400, 1600),
        ] as SourceAsset[],
      },
      {
        slug: "dubai-land-event",
        label: "dubai land event",
        assets: [
          livePhoto("MZD03707.jpg", 0.34, localUrl("media", "events", "dubai-land-event", "MZD03707.jpg"), 2400, 1600),
          livePhoto("MZD03717.jpg", 0.28, localUrl("media", "events", "dubai-land-event", "MZD03717.jpg"), 2400, 1600),
          livePhoto("MZD03747.jpg", 0.32, localUrl("media", "events", "dubai-land-event", "MZD03747.jpg"), 1600, 2400),
          livePhoto("MZD03760.jpg", 0.37, localUrl("media", "events", "dubai-land-event", "MZD03760.jpg"), 2400, 1600),
          livePhoto("MZD03794.jpg", 0.25, localUrl("media", "events", "dubai-land-event", "MZD03794.jpg"), 1600, 2400),
          livePhoto("MZD03804-Edit.jpg", 0.3, localUrl("media", "events", "dubai-land-event", "MZD03804-Edit.jpg"), 2400, 1600),
          livePhoto("MZD03889-Edit.jpg", 0.2, localUrl("media", "events", "dubai-land-event", "MZD03889-Edit.jpg"), 2400, 1600),
          livePhoto("MZD03912.jpg", 0.24, localUrl("media", "events", "dubai-land-event", "MZD03912.jpg"), 2400, 1600),
          livePhoto("MZD03917.jpg", 0.19, localUrl("media", "events", "dubai-land-event", "MZD03917.jpg"), 2400, 1600),
          livePhoto("MZD04038-Enhanced-NR.jpg", 0.2, localUrl("media", "events", "dubai-land-event", "MZD04038-Enhanced-NR.jpg"), 2400, 1600),
          livePhoto("MZD04054.jpg", 0.33, localUrl("media", "events", "dubai-land-event", "MZD04054.jpg"), 2400, 1600),
          livePhoto("MZD04077.jpg", 0.34, localUrl("media", "events", "dubai-land-event", "MZD04077.jpg"), 1600, 2400),
          livePhoto("MZD04084.jpg", 0.67, localUrl("media", "events", "dubai-land-event", "MZD04084.jpg"), 2400, 1731),
          livePhoto("MZD04085.jpg", 0.46, localUrl("media", "events", "dubai-land-event", "MZD04085.jpg"), 2400, 1731),
          livePhoto("MZD04090.jpg", 0.26, localUrl("media", "events", "dubai-land-event", "MZD04090.jpg"), 2400, 1600),
          livePhoto("MZD04096.jpg", 0.62, localUrl("media", "events", "dubai-land-event", "MZD04096.jpg"), 2400, 2400),
        ] as SourceAsset[],
      },
    ],

    // Events / Video — flat, plus one nested "podcast" subfolder (not yet
    // expanded — separate from the top-level `content-creator` category above).
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
    // (near-identical sizes) as the top-level `content-creator` category. Treated
    // as a duplicate copy, not distinct content.
  },

  fnb: {
    // "food reels" folder — flat, video-only. Confirmed via individual Drive
    // file links (past the earlier scroll cutoff). Naming has a gap — "vid
    // 2/4/6" exist but no "vid 1/3/5"; the processed manifest
    // (lib/data/generated/fnb__video__food-reels.json) confirms they're absent.
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

  "content-creator": {
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
