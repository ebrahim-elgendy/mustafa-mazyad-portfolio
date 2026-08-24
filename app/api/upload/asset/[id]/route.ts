import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { moveAssetToCategory, setAssetCover, setAssetFocalY } from "@/lib/data/db-assets";
import { CATEGORIES } from "@/lib/data/categories";

interface UpdateAssetBody {
  categorySlug?: string;
  setCover?: boolean;
  focalY?: number;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const data = (await request.json()) as UpdateAssetBody;

  if (data.categorySlug) {
    if (!CATEGORIES.some((c) => c.slug === data.categorySlug)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }
    await moveAssetToCategory(Number(id), data.categorySlug);
  } else if (data.setCover) {
    await setAssetCover(Number(id));
  } else if (typeof data.focalY === "number") {
    await setAssetFocalY(Number(id), data.focalY);
  } else {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const sql = getSql();
  const [row] = await sql`
    SELECT url, poster_url FROM assets WHERE id = ${id}
  `;
  if (!row) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const { url, poster_url } = row as { url: string; poster_url: string | null };
  await del(url).catch(() => {});
  if (poster_url) await del(poster_url).catch(() => {});

  await sql`DELETE FROM assets WHERE id = ${id}`;

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
