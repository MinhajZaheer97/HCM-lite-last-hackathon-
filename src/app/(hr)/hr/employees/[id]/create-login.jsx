"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import { createEmployeeLogin } from "../actions";

export default function CreateLoginButton({ employeeId, employeeName }) {
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState(null);
  const [error, setError] = useState("");

  async function create() {
    if (!window.confirm(`Create a login for ${employeeName}?`)) return;
    setBusy(true);
    setError("");
    const res = await createEmployeeLogin(employeeId);
    setBusy(false);
    if (res?.error) setError(res.error);
    else setSecret(res.tempPassword);
  }

  return (
    <>
      <Button onClick={create} disabled={busy}>
        {busy ? "Creating…" : "Create login"}
      </Button>
      {error && (
        <p className="mt-2 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </p>
      )}
      <Modal
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Temporary password"
        footer={<Button onClick={() => setSecret(null)}>I&apos;ve saved it</Button>}
      >
        <p className="text-sm text-ink-muted">
          Temporary password for <strong>{employeeName}</strong> (shown once, never stored):
        </p>
        <p className="mt-2 select-all rounded-lg bg-surface-muted px-4 py-3 font-mono text-base">
          {secret}
        </p>
      </Modal>
    </>
  );
}
