"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-display text-2xl text-ink">Admin Login</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="rounded-md border border-ink/15 bg-bg px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-4 py-2 text-bg transition-opacity disabled:opacity-50"
        >
          {pending ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
