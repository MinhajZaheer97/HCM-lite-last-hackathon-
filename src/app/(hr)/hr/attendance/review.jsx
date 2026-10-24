"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal } from "@/components/ui";
import { reviewCorrection } from "./actions";

export default function ReviewCorrectionButton({ correctionId, employeeName, requested }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function decide(decision) {
    setBusy(true);
    setError("");
    const res = await reviewCorrection({ correctionId, decision, comment });
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      setOpen(false);
      setComment("");
      router.refresh();
    }
  }

  const proposed = [];
  if (requested?.check_in) proposed.push(`check-in → ${requested.check_in}`);
  if (requested?.check_out) proposed.push(`check-out → ${requested.check_out}`);

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Review
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Correction request — ${employeeName}`}
        footer={
          <>
            <Button variant="danger" onClick={() => decide("rejected")} disabled={busy}>
              Reject
            </Button>
            <Button onClick={() => decide("approved")} disabled={busy}>
              {busy ? "Applying…" : "Approve & apply"}
            </Button>
          </>
        }
      >
        {error && (
          <p className="mb-4 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}
        <p className="mb-4 text-sm">
          Proposed change: <span className="font-medium">{proposed.join(", ")}</span>
        </p>
        <p className="mb-4 text-sm text-ink-muted">
          Approving re-applies the times and recomputes the day&apos;s status (late/half-day) using
          the rules engine — it is recorded in the audit log automatically.
        </p>
        <Field label="Comment (optional, shown to the employee)">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
