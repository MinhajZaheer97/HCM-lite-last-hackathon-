"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal } from "@/components/ui";
import { punchClock, requestCorrection } from "./actions";

export function PunchCard({ state }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function punch() {
    setBusy(true);
    setError("");
    setResult(null);
    const res = await punchClock();
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      setResult(res.message);
      router.refresh();
    }
  }

  const label = state.canCheckIn ? "Check in" : state.canCheckOut ? "Check out" : "Day complete";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={punch} disabled={busy || (!state.canCheckIn && !state.canCheckOut)}>
          {busy ? "…" : label}
        </Button>
        {state.checkIn && (
          <span className="text-sm text-ink-muted">
            Checked in at <span className="font-medium text-ink">{state.checkIn}</span>
            {state.checkOut && (
              <>
                {" · "}checked out at <span className="font-medium text-ink">{state.checkOut}</span>
              </>
            )}
          </span>
        )}
      </div>
      {state.status && (
        <p className="mt-2 text-sm text-ink-muted">
          Today&apos;s status: <span className="font-medium capitalize">{state.status.replaceAll("_", " ")}</span>
        </p>
      )}
      {result && (
        <p className="mt-3 rounded-lg border border-success-600/30 bg-success-50 px-3 py-2 text-sm text-success-700">
          {result}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function CorrectButton({ recordId, recordDate }) {
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    setBusy(true);
    setError("");
    const res = await requestCorrection({ recordId, checkIn, checkOut, reason });
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      setOpen(false);
      setCheckIn("");
      setCheckOut("");
      setReason("");
      router.refresh();
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Request correction
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Correction request — ${recordDate}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send request"}
            </Button>
          </>
        }
      >
        {error && (
          <p className="mb-4 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}
        <p className="mb-4 text-sm text-ink-muted">
          Propose corrected times (HH:MM) for this day. HR reviews every request — nothing changes
          until they approve.
        </p>
        <div className="space-y-4">
          <Field label="Corrected check-in time (optional)">
            <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </Field>
          <Field label="Corrected check-out time (optional)">
            <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </Field>
          <Field label="Reason (required)">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. forgot to check out" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
