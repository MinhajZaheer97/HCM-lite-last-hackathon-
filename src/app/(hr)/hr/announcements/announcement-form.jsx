"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { postAnnouncement } from "./actions";
export default function AnnouncementForm() {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await postAnnouncement({ title, body });
      if (result?.error) setError(result.error);
      else {
        setTitle("");
        setBody("");
        router.refresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to post announcement");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="space-y-3">{error && <p className="text-sm text-danger-700">{error}</p>}<Field label="Title"><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Message"><Textarea required value={body} onChange={(e) => setBody(e.target.value)} /></Field><Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post announcement"}</Button></form>;
}
