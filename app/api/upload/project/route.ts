import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";
import { CATEGORIES } from "@/lib/data/categories";
import { slugify, upsertProject } from "@/lib/data/db-assets";

interface CreateProjectBody {
  categorySlug: string;
  label: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = (await request.json()) as CreateProjectBody;
  const category = CATEGORIES.find((c) => c.slug === data.categorySlug);
  if (!category) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const label = data.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const id = await upsertProject(category.slug, label);

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, id, slug: slugify(label) });
}
