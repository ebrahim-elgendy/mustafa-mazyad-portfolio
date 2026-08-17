import { getSql } from "@/lib/db";
import type { AssetKind, Project, SourceAsset } from "@/lib/data/source-map";

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface AssetRow {
  filename: string;
  url: string;
  poster_url: string | null;
  width: number | null;
  height: number | null;
  size_mb: number | null;
  is_cover: boolean;
}

function toSourceAsset(kind: AssetKind, row: AssetRow): SourceAsset {
  return {
    filename: row.filename,
    kind,
    sizeMB: row.size_mb,
    url: row.url,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    posterUrl: row.poster_url ?? undefined,
    isCover: row.is_cover,
  };
}

/** Every published asset of the given kind for a category — flat and folder-attached alike, so the public gallery shows everything together. An admin-pinned cover (if any) sorts first. */
export async function getDbAssets(categorySlug: string, kind: AssetKind): Promise<SourceAsset[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT filename, url, poster_url, width, height, size_mb, is_cover
    FROM assets
    WHERE category_slug = ${categorySlug} AND kind = ${kind} AND status = 'published'
    ORDER BY is_cover DESC, created_at ASC
  `) as AssetRow[];
  return rows.map((row) => toSourceAsset(kind, row));
}

/** DB-backed projects that have at least one published asset, with a cover if a photo exists. */
export async function getDbProjects(categorySlug: string): Promise<Project[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      projects.slug,
      projects.label,
      (
        SELECT jsonb_build_object('url', url, 'width', width, 'height', height)
        FROM assets
        WHERE assets.project_id = projects.id AND assets.kind = 'photo' AND assets.status = 'published'
        ORDER BY assets.created_at ASC
        LIMIT 1
      ) AS cover
    FROM projects
    WHERE projects.category_slug = ${categorySlug}
      AND EXISTS (
        SELECT 1 FROM assets WHERE assets.project_id = projects.id AND assets.status = 'published'
      )
    ORDER BY projects.label ASC
  `) as { slug: string; label: string; cover: { url: string; width: number; height: number } | null }[];

  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    cover: row.cover ?? undefined,
  }));
}

/** Whether the category has any published DB photo, either project-scoped or flat. */
export async function dbCategoryHasPhotography(categorySlug: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT 1
    FROM assets
    WHERE category_slug = ${categorySlug} AND kind = 'photo' AND status = 'published'
    LIMIT 1
  `;
  return rows.length > 0;
}

/** First published DB photo for the category, else the poster of its first published DB video. */
export async function dbCategoryCover(categorySlug: string): Promise<string | undefined> {
  const sql = getSql();
  const [photo] = await sql`
    SELECT url FROM assets
    WHERE category_slug = ${categorySlug} AND kind = 'photo' AND status = 'published'
    ORDER BY is_cover DESC, created_at ASC LIMIT 1
  `;
  if (photo) return (photo as { url: string }).url;

  const [video] = await sql`
    SELECT poster_url FROM assets
    WHERE category_slug = ${categorySlug} AND kind = 'video' AND status = 'published' AND poster_url IS NOT NULL
    ORDER BY is_cover DESC, created_at ASC LIMIT 1
  `;
  return (video as { poster_url: string } | undefined)?.poster_url;
}

export interface AdminAsset {
  id: number;
  categorySlug: string;
  kind: AssetKind;
  status: "published" | "pending";
  filename: string;
  url: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  isCover: boolean;
}

export interface AdminProject {
  id: number;
  slug: string;
  label: string;
  assets: AdminAsset[];
}

export interface AdminCategoryLibrary {
  categorySlug: string;
  projects: AdminProject[];
  flatAssets: AdminAsset[];
}

interface AdminAssetRow {
  id: number;
  category_slug: string;
  project_id: number | null;
  kind: AssetKind;
  status: "published" | "pending";
  filename: string;
  url: string;
  poster_url: string | null;
  width: number | null;
  height: number | null;
  is_cover: boolean;
}

function toAdminAsset(row: AdminAssetRow): AdminAsset {
  return {
    id: row.id,
    categorySlug: row.category_slug,
    kind: row.kind,
    status: row.status,
    filename: row.filename,
    url: row.url,
    posterUrl: row.poster_url ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    isCover: row.is_cover,
  };
}

/**
 * Every asset + project in the DB, grouped by category then by project
 * (assets with no project_id land in flatAssets). Powers the admin
 * media-library view so the admin can delete/rename/create folders and
 * delete individual assets.
 */
export async function getAdminLibrary(): Promise<AdminCategoryLibrary[]> {
  const sql = getSql();
  const assetRows = (await sql`
    SELECT id, category_slug, project_id, kind, status, filename, url, poster_url, width, height, is_cover
    FROM assets
    ORDER BY created_at ASC
  `) as AdminAssetRow[];
  const projectRows = (await sql`
    SELECT id, category_slug, slug, label FROM projects ORDER BY label ASC
  `) as { id: number; category_slug: string; slug: string; label: string }[];

  const categories = new Map<string, AdminCategoryLibrary>();
  const projectsById = new Map<number, AdminProject>();

  function getCategory(categorySlug: string): AdminCategoryLibrary {
    let category = categories.get(categorySlug);
    if (!category) {
      category = { categorySlug, projects: [], flatAssets: [] };
      categories.set(categorySlug, category);
    }
    return category;
  }

  for (const row of projectRows) {
    const project: AdminProject = { id: row.id, slug: row.slug, label: row.label, assets: [] };
    projectsById.set(row.id, project);
    getCategory(row.category_slug).projects.push(project);
  }

  for (const row of assetRows) {
    const asset = toAdminAsset(row);
    if (row.project_id !== null) {
      projectsById.get(row.project_id)?.assets.push(asset);
    } else {
      getCategory(row.category_slug).flatAssets.push(asset);
    }
  }

  return [...categories.values()];
}

/** The category's explicitly admin-pinned thumbnail, if one exists — photo or video alike, and takes priority over the kind-priority default in getCategoryCover. */
export async function getPinnedCover(
  categorySlug: string
): Promise<{ kind: AssetKind; url: string; posterUrl?: string } | undefined> {
  const sql = getSql();
  const [row] = await sql`
    SELECT kind, url, poster_url FROM assets
    WHERE category_slug = ${categorySlug} AND is_cover AND status = 'published'
    LIMIT 1
  `;
  if (!row) return undefined;
  const r = row as { kind: AssetKind; url: string; poster_url: string | null };
  return { kind: r.kind, url: r.url, posterUrl: r.poster_url ?? undefined };
}

/** Moves an asset to a different category — detaches it from its project (projects are scoped to one category) and clears any cover pin (a pin is scoped to its old category). */
export async function moveAssetToCategory(assetId: number, categorySlug: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE assets SET category_slug = ${categorySlug}, project_id = NULL, is_cover = false
    WHERE id = ${assetId}
  `;
}

/** Pins one asset (photo or video) as its category's thumbnail, clearing any previous pin in that category. */
export async function setAssetCover(assetId: number): Promise<void> {
  const sql = getSql();
  const [row] = await sql`SELECT category_slug FROM assets WHERE id = ${assetId}`;
  if (!row) throw new Error("Asset not found");
  const categorySlug = (row as { category_slug: string }).category_slug;
  await sql`UPDATE assets SET is_cover = false WHERE category_slug = ${categorySlug}`;
  await sql`UPDATE assets SET is_cover = true WHERE id = ${assetId}`;
}

/** Finds or creates a project row for a client-supplied project label, returning its id. */
export async function upsertProject(categorySlug: string, label: string): Promise<number> {
  const sql = getSql();
  const slug = slugify(label);
  const [row] = await sql`
    INSERT INTO projects (category_slug, slug, label)
    VALUES (${categorySlug}, ${slug}, ${label})
    ON CONFLICT (category_slug, slug) DO UPDATE SET label = EXCLUDED.label
    RETURNING id
  `;
  return (row as { id: number }).id;
}
