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
  };
}

/** Published, category-level assets (not attached to any project) of the given kind. */
export async function getDbAssets(categorySlug: string, kind: AssetKind): Promise<SourceAsset[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT filename, url, poster_url, width, height, size_mb
    FROM assets
    WHERE category_slug = ${categorySlug} AND kind = ${kind} AND status = 'published' AND project_id IS NULL
    ORDER BY created_at ASC
  `) as AssetRow[];
  return rows.map((row) => toSourceAsset(kind, row));
}

/** Published assets of the given kind attached to a specific project. */
export async function getDbProjectAssets(
  categorySlug: string,
  projectSlug: string,
  kind: AssetKind
): Promise<SourceAsset[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT assets.filename, assets.url, assets.poster_url, assets.width, assets.height, assets.size_mb
    FROM assets
    JOIN projects ON projects.id = assets.project_id
    WHERE projects.category_slug = ${categorySlug}
      AND projects.slug = ${projectSlug}
      AND assets.kind = ${kind}
      AND assets.status = 'published'
    ORDER BY assets.created_at ASC
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
    ORDER BY created_at ASC LIMIT 1
  `;
  if (photo) return (photo as { url: string }).url;

  const [video] = await sql`
    SELECT poster_url FROM assets
    WHERE category_slug = ${categorySlug} AND kind = 'video' AND status = 'published' AND poster_url IS NOT NULL
    ORDER BY created_at ASC LIMIT 1
  `;
  return (video as { poster_url: string } | undefined)?.poster_url;
}

/** "photo" or "video" for a DB-only project (one not defined in SOURCE_MAP), or undefined if it doesn't exist. */
export async function dbProjectKind(categorySlug: string, projectSlug: string): Promise<AssetKind | undefined> {
  const sql = getSql();
  const [project] = await sql`
    SELECT id FROM projects WHERE category_slug = ${categorySlug} AND slug = ${projectSlug}
  `;
  if (!project) return undefined;

  const [photo] = await sql`
    SELECT 1 FROM assets WHERE project_id = ${(project as { id: number }).id} AND kind = 'photo' AND status = 'published' LIMIT 1
  `;
  return photo ? "photo" : "video";
}

export interface AdminAsset {
  id: number;
  kind: AssetKind;
  status: "published" | "pending";
  filename: string;
  url: string;
  posterUrl?: string;
  width?: number;
  height?: number;
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
}

function toAdminAsset(row: AdminAssetRow): AdminAsset {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    filename: row.filename,
    url: row.url,
    posterUrl: row.poster_url ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
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
    SELECT id, category_slug, project_id, kind, status, filename, url, poster_url, width, height
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
