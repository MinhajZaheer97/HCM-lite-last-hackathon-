"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { cancelLeave } from "./actions";
export default function CancelButton({ requestId }) {
  const [busy, setBusy] = useState(false); const router = useRouter();
  async function cancel() { setBusy(true); const result = await cancelLeave(requestId); setBusy(false); if (!result?.error) router.refresh(); }
  return <Button size="sm" variant="ghost" disabled={busy} onClick={cancel}>{busy ? "…" : "Cancel"}</Button>;
}
