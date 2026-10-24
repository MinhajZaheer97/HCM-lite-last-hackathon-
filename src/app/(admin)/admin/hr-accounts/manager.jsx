"use client";

import { useState } from "react";
import { Button, Field, Input, Modal } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { createHrAccount, resetHrPassword, setHrActive } from "./actions";

export default function HrAccountsManager({ accounts }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState(null); // { label, password }

  async function submitCreate() {
    setBusy(true);
    setError("");
    const res = await createHrAccount(form);
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      setCreateOpen(false);
      setForm({ full_name: "", email: "", password: "" });
      setSecret({ label: "HR account created. Temporary password:", password: res.tempPassword });
    }
  }

  async function toggleActive(account) {
    const res = await setHrActive(account.id, !account.is_active);
    if (res?.error) window.alert(res.error);
  }

  async function reset(account) {
    if (!window.confirm(`Reset the password for ${account.full_name}?`)) return;
    const res = await resetHrPassword(account.id);
    if (res?.error) window.alert(res.error);
    else setSecret({ label: `New temporary password for ${account.full_name}:`, password: res.tempPassword });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Add HR account</Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="No HR accounts yet"
          description="Create an HR login — HR registers employees, manages attendance and leave, and drafts payroll."
          icon="🧑‍💼"
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {accounts.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">{a.full_name}</TD>
                  <TD>{a.email}</TD>
                  <TD>
                    <Badge tone={a.is_active ? "success" : "danger"}>
                      {a.is_active ? "active" : "deactivated"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => reset(a)}>
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant={a.is_active ? "danger" : "primary"}
                        onClick={() => toggleActive(a)}
                      >
                        {a.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add HR account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
          </>
        }
      >
        {error && (
          <p className="mb-4 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}
        <div className="space-y-4">
          <Field label="Full name">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field
            label="Password"
            hint="Leave blank to auto-generate a temporary password (shown once after creation)."
          >
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </Field>
        </div>
      </Modal>

      {/* Temp password is displayed exactly once — it is not stored anywhere. */}
      <Modal
        open={secret !== null}
        onClose={() => setSecret(null)}
        title="Temporary password"
        footer={
          <Button onClick={() => setSecret(null)}>I&apos;ve saved it</Button>
        }
      >
        <p className="text-sm text-ink-muted">{secret?.label}</p>
        <p className="mt-2 select-all rounded-lg bg-surface-muted px-4 py-3 font-mono text-base">
          {secret?.password}
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Share it securely with the user. They can change it after signing in. It will not be
          shown again.
        </p>
      </Modal>
    </>
  );
}
