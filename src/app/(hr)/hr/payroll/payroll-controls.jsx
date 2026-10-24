"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { createDraft, saveSalary } from "./actions";
export function DraftForm() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(e) { e.preventDefault(); setBusy(true); const result = await createDraft(month); setBusy(false); setMessage(result?.error ?? `Draft generated for ${result.count} employee(s)`); if (!result?.error) router.refresh(); }
  return <form onSubmit={submit} className="flex flex-wrap items-end gap-2"><label className="text-sm">Period<input className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label><Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate draft"}</Button>{message && <span className="text-sm text-ink-muted">{message}</span>}</form>;
}
export function SalaryForm({ employee }) {
  const [basic, setBasic] = useState(employee.salary?.basic ?? ""); const [allowances, setAllowances] = useState(Object.entries(employee.salary?.allowances ?? {}).map(([key, value]) => `${key}:${value}`).join(", ")); const [date, setDate] = useState(employee.salary?.effective_from ?? new Date().toISOString().slice(0, 10)); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(e) { e.preventDefault(); setBusy(true); const result = await saveSalary({ employeeId: employee.id, basic, allowances, effectiveFrom: date }); setBusy(false); setMessage(result?.error ?? "Saved"); }
  return <form onSubmit={submit} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"><div><p className="mb-1 text-sm font-medium">{employee.full_name}</p><p className="text-xs text-ink-muted">{employee.emp_code}</p></div><label className="text-xs">Basic<input className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm" type="number" min="0" step="0.01" value={basic} onChange={(e) => setBasic(e.target.value)} /></label><label className="text-xs">Allowances<label className="sr-only">Allowances</label><Input value={allowances} onChange={(e) => setAllowances(e.target.value)} placeholder="Transport:2000, Bonus:500" /></label><label className="text-xs">Effective<input className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><Button size="sm" type="submit" disabled={busy}>{busy ? "…" : "Save"}</Button>{message && <span className="text-xs text-ink-muted sm:col-span-4">{message}</span>}</form>;
}
