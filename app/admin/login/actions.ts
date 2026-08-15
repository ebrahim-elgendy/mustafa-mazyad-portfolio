"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createSessionToken } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!checkAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin/upload");
}
