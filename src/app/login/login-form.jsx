"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/auth-actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, {});

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      {state?.error && (
        <p className="rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-xs text-ink-muted">
        First time here?{" "}
        <Link href="/setup" className="text-brand-700 hover:underline">
          Run the first-run setup
        </Link>
      </p>
    </form>
  );
}
