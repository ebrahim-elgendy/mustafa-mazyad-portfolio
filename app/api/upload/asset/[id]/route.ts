import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getSql } from "@/lib/db";

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
