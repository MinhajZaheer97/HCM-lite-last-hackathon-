"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal } from "@/components/ui";
import { decideLeave } from "./actions";
export default function DecisionButton({ requestId, employeeName }) {
  const [open, setOpen] = useState(false); const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function decide(decision) { setBusy(true); setError(""); const result = await decideLeave({ requestId, decision, comment }); setBusy(false); if (result?.error) setError(result.error); else { setOpen(false); router.refresh(); } }
  return <><Button size="sm" onClick={() => setOpen(true)}>Review</Button><Modal open={open} onClose={() => setOpen(false)} title={`Leave request — ${employeeName}`} footer={<><Button variant="danger" disabled={busy} onClick={() => decide("rejected")}>Reject</Button><Button disabled={busy} onClick={() => decide("approved")}>{busy ? "Saving…" : "Approve"}</Button></>}>{error && <p className="mb-3 text-sm text-danger-700">{error}</p>}<Field label="Comment (optional)"><Input value={comment} onChange={(e) => setComment(e.target.value)} /></Field></Modal></>;
}
