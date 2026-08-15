import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getSql } from "@/lib/db";

interface PublishBody {
  assetId: number;
  videoUrl: string;
  posterUrl?: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { assetId, videoUrl, posterUrl } = (await request.json()) as PublishBody;

  const sql = getSql();
  const [row] = await sql`
    SELECT url FROM assets WHERE id = ${assetId} AND kind = 'video' AND status = 'pending'
  `;
  if (!row) {
    return NextResponse.json({ error: "Pending video not found" }, { status: 404 });
  }

  await sql`
    UPDATE assets
    SET url = ${videoUrl}, poster_url = ${posterUrl ?? null}, status = 'published'
    WHERE id = ${assetId}
  `;

  await del((row as { url: string }).url).catch(() => {});

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
