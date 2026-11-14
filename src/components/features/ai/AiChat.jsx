"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { ROLE_SUGGESTIONS } from "@/lib/ai/prompts";

export default function AiChat({ role }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(content = input) {
    const text = content.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to answer");
      setMessages([...next, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border border-border bg-surface">
        <div className="min-h-80 space-y-3 p-5">
          {!messages.length && <p className="text-sm text-ink-muted">Ask a question about the records available to your role. The assistant is read-only.</p>}
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-lg p-3 text-sm ${message.role === "user" ? "ml-8 bg-brand-50 text-brand-950" : "mr-8 bg-surface-muted text-ink"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.sources?.length ? <p className="mt-2 text-xs text-ink-muted">Sources: {message.sources.map((source) => source.label).join(", ")}</p> : null}</div>)}
          {busy && <p className="text-sm text-ink-muted">Thinking…</p>}
          {error && <p className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</p>}
        </div>
        <form className="flex gap-2 border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); send(); }}>
          <input className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask a question…" aria-label="Ask the AI assistant" />
          <Button type="submit" disabled={busy || !input.trim()}>Send</Button>
        </form>
      </div>
      <aside className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Try asking</h2><Button variant="ghost" size="sm" onClick={() => { setMessages([]); setError(""); }}>Clear</Button></div>
        <div className="mt-3 space-y-2">{(ROLE_SUGGESTIONS[role] ?? []).map((suggestion) => <button key={suggestion} className="block w-full rounded-lg border border-border p-2 text-left text-xs hover:bg-surface-muted" onClick={() => send(suggestion)} type="button">{suggestion}</button>)}</div>
      </aside>
    </div>
  );
}
