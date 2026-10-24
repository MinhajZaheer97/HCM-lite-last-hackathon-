"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { finalizePayroll } from "./actions";
export default function FinalizeButton({ runId }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function finalize() { setBusy(true); setError(""); const result = await finalizePayroll(runId); setBusy(false); if (result?.error) setError(result.error); else router.refresh(); }
  return <span>{error && <span className="mr-2 text-xs text-danger-700">{error}</span>}<Button size="sm" onClick={finalize} disabled={busy}>{busy ? "…" : "Finalize"}</Button></span>;
}
