import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { getSql } from "@/lib/db";

interface RenameProjectBody {
  label: string;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const data = (await request.json()) as RenameProjectBody;
  const label = data.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const sql = getSql();
  await sql`UPDATE projects SET label = ${label} WHERE id = ${id}`;

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
  const rows = (await sql`
    SELECT url, poster_url FROM assets WHERE project_id = ${id}
  `) as { url: string; poster_url: string | null }[];

  await Promise.all(
    rows.flatMap((row) => [del(row.url).catch(() => {}), ...(row.poster_url ? [del(row.poster_url).catch(() => {})] : [])])
  );

  await sql`DELETE FROM projects WHERE id = ${id}`;

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
