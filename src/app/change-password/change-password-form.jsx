"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { changePassword } from "@/lib/auth-actions";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {});

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      {state?.error && (
        <p className="rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-success-600/30 bg-success-50 px-3 py-2 text-sm text-success-700">
          {state.success}
        </p>
      )}
      <Field label="Current password">
        <Input name="current" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <Input name="next" type="password" required autoComplete="new-password" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
