import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { CATEGORIES } from "@/lib/data/categories";
import { getSql } from "@/lib/db";
import UploadForm from "@/components/admin/UploadForm";
import PendingVideos, { type PendingVideo } from "@/components/admin/PendingVideos";
import { logout } from "./actions";

export default async function AdminUploadPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const sql = getSql();

  const projectRows = (await sql`
    SELECT category_slug, label FROM projects ORDER BY label ASC
  `) as { category_slug: string; label: string }[];

  const projectsByCategory: Record<string, string[]> = {};
  for (const row of projectRows) {
    (projectsByCategory[row.category_slug] ??= []).push(row.label);
  }

  const pendingRows = (await sql`
    SELECT assets.id, assets.category_slug, assets.filename, assets.url, projects.label AS project_label
    FROM assets
    LEFT JOIN projects ON projects.id = assets.project_id
    WHERE assets.kind = 'video' AND assets.status = 'pending'
    ORDER BY assets.created_at DESC
  `) as { id: number; category_slug: string; filename: string; url: string; project_label: string | null }[];

  const pendingVideos: PendingVideo[] = pendingRows.map((row) => ({
    id: row.id,
    categorySlug: row.category_slug,
    filename: row.filename,
    rawUrl: row.url,
    projectLabel: row.project_label ?? undefined,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Upload media</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-muted underline">
            Log out
          </button>
        </form>
      </div>

      <UploadForm
        categories={CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }))}
        projectsByCategory={projectsByCategory}
      />

      <PendingVideos videos={pendingVideos} />
    </main>
  );
}
