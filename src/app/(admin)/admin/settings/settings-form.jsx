"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Field, Input, Select } from "@/components/ui";
import { saveSettings } from "./actions";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function SettingsForm({ company }) {
  const [values, setValues] = useState(company);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const toggleWeekend = (day) =>
    set(
      "weekend_days",
      values.weekend_days.includes(day)
        ? values.weekend_days.filter((d) => d !== day)
        : [...values.weekend_days, day].sort()
    );

  async function submit() {
    setBusy(true);
    setError("");
    setSuccess("");
    const res = await saveSettings(values);
    setBusy(false);
    if (res?.error) setError(res.error);
    else setSuccess("Settings saved.");
  }

  return (
    <Card>
      <CardHeader
        title="Company profile & policies"
        subtitle="These values drive attendance, leave, and payroll calculations."
      />
      <CardBody className="space-y-4">
        {error && (
          <p className="rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-success-600/30 bg-success-50 px-3 py-2 text-sm text-success-700">
            {success}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Office location (informational)">
            <Input
              value={values.office_location ?? ""}
              onChange={(e) => set("office_location", e.target.value)}
            />
          </Field>
          <Field label="Timezone" hint="All attendance dates are computed in this timezone.">
            <Select value={values.timezone} onChange={(e) => set("timezone", e.target.value)}>
              <option>Asia/Karachi</option>
              <option>Asia/Dubai</option>
              <option>Asia/Kolkata</option>
              <option>UTC</option>
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={values.currency} onChange={(e) => set("currency", e.target.value)}>
              <option>PKR</option>
              <option>USD</option>
              <option>AED</option>
              <option>EUR</option>
            </Select>
          </Field>
          <Field label="Grace minutes" hint="Check-ins after office start + grace count as late.">
            <Input
              type="number"
              min={0}
              max={120}
              value={values.grace_minutes}
              onChange={(e) => set("grace_minutes", e.target.value)}
            />
          </Field>
          <Field label="Office start">
            <Input
              type="time"
              value={values.office_start}
              onChange={(e) => set("office_start", e.target.value)}
            />
          </Field>
          <Field label="Office end">
            <Input
              type="time"
              value={values.office_end}
              onChange={(e) => set("office_end", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Weekend days" hint="Excluded from working days, attendance, and payroll.">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleWeekend(d.value)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  values.weekend_days.includes(d.value)
                    ? "border-brand-600 bg-brand-50 font-medium text-brand-700"
                    : "border-border text-ink-muted hover:bg-surface-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
