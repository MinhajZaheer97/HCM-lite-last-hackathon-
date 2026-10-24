"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { completeSetup, verifyAccessCode } from "./actions";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [accessCode, setAccessCode] = useState("");
  const [company, setCompany] = useState({
    name: "",
    address: "",
    office_location: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    office_start: "09:00",
    office_end: "17:00",
    grace_minutes: 10,
    weekend_days: [0, 6],
  });
  const [admin, setAdmin] = useState({ full_name: "", email: "", password: "" });

  const set = (obj, setter) => (key, value) => setter({ ...obj, [key]: value });
  const setCompanyField = set(company, setCompany);
  const setAdminField = set(admin, setAdmin);

  const toggleWeekend = (day) => {
    setCompanyField(
      "weekend_days",
      company.weekend_days.includes(day)
        ? company.weekend_days.filter((d) => d !== day)
        : [...company.weekend_days, day].sort()
    );
  };

  async function submit() {
    setBusy(true);
    setError("");
    const result = await completeSetup({ accessCode, company, admin });
    setBusy(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <ol className="mb-6 flex gap-2 text-xs">
        {["Access", "Company", "Admin account"].map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-full px-3 py-1 text-center ${
              step === i + 1
                ? "bg-brand-600 font-medium text-white"
                : step > i + 1
                  ? "bg-brand-50 text-brand-700"
                  : "bg-surface-muted text-ink-muted"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-4 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field
            label="Setup access code"
            hint="The SETUP_ACCESS_CODE secret from your server environment. Setup only works while no company exists."
          >
            <Input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Access code"
              autoFocus
            />
          </Field>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const result = await verifyAccessCode(accessCode);
              setBusy(false);
              if (result?.error) setError(result.error);
              else setStep(2);
            }}
          >
            {busy ? "Checking…" : "Continue"}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Company name">
            <Input value={company.name} onChange={(e) => setCompanyField("name", e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={company.address} onChange={(e) => setCompanyField("address", e.target.value)} />
          </Field>
          <Field label="Office location (informational)">
            <Input
              value={company.office_location}
              onChange={(e) => setCompanyField("office_location", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timezone">
              <Select
                value={company.timezone}
                onChange={(e) => setCompanyField("timezone", e.target.value)}
              >
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Asia/Kolkata</option>
                <option>UTC</option>
              </Select>
            </Field>
            <Field label="Currency">
              <Select
                value={company.currency}
                onChange={(e) => setCompanyField("currency", e.target.value)}
              >
                <option>PKR</option>
                <option>USD</option>
                <option>AED</option>
                <option>EUR</option>
              </Select>
            </Field>
            <Field label="Office start">
              <Input
                type="time"
                value={company.office_start}
                onChange={(e) => setCompanyField("office_start", e.target.value)}
              />
            </Field>
            <Field label="Office end">
              <Input
                type="time"
                value={company.office_end}
                onChange={(e) => setCompanyField("office_end", e.target.value)}
              />
            </Field>
            <Field label="Grace minutes (late allowance)">
              <Input
                type="number"
                min={0}
                max={120}
                value={company.grace_minutes}
                onChange={(e) => setCompanyField("grace_minutes", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Weekend days" hint="These days are excluded from working days and attendance.">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWeekend(d.value)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    company.weekend_days.includes(d.value)
                      ? "border-brand-600 bg-brand-50 font-medium text-brand-700"
                      : "border-border text-ink-muted hover:bg-surface-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              disabled={busy || company.weekend_days.length === 0}
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Field label="Admin full name">
            <Input value={admin.full_name} onChange={(e) => setAdminField("full_name", e.target.value)} />
          </Field>
          <Field label="Admin email">
            <Input
              type="email"
              value={admin.email}
              onChange={(e) => setAdminField("email", e.target.value)}
            />
          </Field>
          <Field label="Admin password" hint="At least 8 characters.">
            <Input
              type="password"
              value={admin.password}
              onChange={(e) => setAdminField("password", e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button disabled={busy} onClick={submit}>
              {busy ? "Creating…" : "Create company & admin"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
