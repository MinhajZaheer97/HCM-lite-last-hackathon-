"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyLeave } from "./actions";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export default function LeaveForm({ leaveTypes }) {
  const [form, setForm] = useState({ leaveTypeId: leaveTypes[0]?.id ?? "", startDate: "", endDate: "", isHalfDay: false, reason: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const result = await applyLeave(form); setBusy(false);
    if (result?.error) setError(result.error);
    else { setForm({ ...form, startDate: "", endDate: "", isHalfDay: false, reason: "" }); router.refresh(); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      <Field label="Leave type"><Select value={form.leaveTypeId} onChange={(e) => update("leaveTypeId", e.target.value)}>{leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.annual_days} days/year)</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date"><Input type="date" required value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field>
        <Field label="End date"><Input type="date" required value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isHalfDay} onChange={(e) => update("isHalfDay", e.target.checked)} /> Half day (single working day only)</label>
      <Field label="Reason"><Textarea required value={form.reason} onChange={(e) => update("reason", e.target.value)} /></Field>
      <Button type="submit" disabled={busy || !leaveTypes.length}>{busy ? "Submitting…" : "Submit request"}</Button>
    </form>
  );
}
