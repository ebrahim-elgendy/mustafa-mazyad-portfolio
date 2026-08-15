import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const cookieStore = await cookies();
        const authed = isValidSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
        if (!authed) {
          throw new Error("Not authenticated");
        }
        return {
          allowedContentTypes: ["image/*", "video/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 20 * 1024 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
