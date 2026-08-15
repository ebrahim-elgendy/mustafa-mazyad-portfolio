import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { upsertProject } from "@/lib/data/db-assets";
import { CATEGORIES } from "@/lib/data/categories";

interface CompleteBody {
  categorySlug: string;
  projectLabel?: string;
  kind: "photo" | "video";
  filename: string;
  blobUrl: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = (await request.json()) as CompleteBody;
  const category = CATEGORIES.find((c) => c.slug === data.categorySlug);
  if (!category) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const sql = getSql();
  const projectId = data.projectLabel ? await upsertProject(category.slug, data.projectLabel) : null;

  if (data.kind === "photo") {
    const source = await fetch(data.blobUrl);
    const inputBuffer = Buffer.from(await source.arrayBuffer());
    const processed = await sharp(inputBuffer, { limitInputPixels: false })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    const { width, height } = await sharp(processed).metadata();

    const stem = data.filename.replace(/\.[^.]+$/, "");
    const projectPart = data.projectLabel ? `${category.slug}/${projectId}/` : `${category.slug}/`;
    const finalBlob = await put(`${projectPart}${stem}.jpg`, processed, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    await sql`
      INSERT INTO assets (category_slug, project_id, kind, status, filename, url, width, height, size_mb)
      VALUES (
        ${category.slug}, ${projectId}, 'photo', 'published', ${data.filename},
        ${finalBlob.url}, ${width ?? null}, ${height ?? null}, ${+(processed.length / 1048576).toFixed(2)}
      )
    `;

    await del(data.blobUrl).catch(() => {});
  } else {
    await sql`
      INSERT INTO assets (category_slug, project_id, kind, status, filename, url)
      VALUES (${category.slug}, ${projectId}, 'video', 'pending', ${data.filename}, ${data.blobUrl})
    `;
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
