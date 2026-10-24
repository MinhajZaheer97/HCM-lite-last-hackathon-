"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Select, Modal } from "@/components/ui";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";

// Generic admin CRUD table + modal form. `saveAction` / `deleteAction` are
// server actions that validate + revalidate on the server.
//
// columns: [{ key, label }] — display values must already be plain strings
// (compute derived values in the server page before passing rows).
// linkKey + linkHrefBase: render that column as a Link to `${base}/${row.id}`.
// fields:  [{ name, label, type: "text"|"number"|"date"|"select"|"checkbox",
//             options?: [{value,label}], required?, step?, placeholder? }]
export default function SimpleCrud({
  rows,
  columns,
  fields,
  saveAction,
  deleteAction,
  linkKey,
  linkHrefBase,
  addLabel = "Add",
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records you create will appear here.",
}) {
  const [editing, setEditing] = useState(null); // null = closed, {} = new
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function openNew() {
    setValues({});
    setEditing({});
    setError("");
  }

  function openEdit(row) {
    setValues({ ...row });
    setEditing(row);
    setError("");
  }

  function setValue(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function save() {
    setBusy(true);
    setError("");
    const res = await saveAction(values);
    setBusy(false);
    if (res?.error) setError(res.error);
    else setEditing(null);
  }

  async function remove(row) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const res = await deleteAction(row.id);
    if (res?.error) window.alert(res.error);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>{addLabel}</Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon="🗂️" />
      ) : (
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <Table>
            <THead>
              <tr>
                {columns.map((c) => (
                  <TH key={c.key}>{c.label}</TH>
                ))}
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  {columns.map((c) => (
                    <TD key={c.key}>
                      {linkKey === c.key ? (
                        <Link
                          href={`${linkHrefBase}/${row.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {row[c.key] ?? "—"}
                        </Link>
                      ) : (
                        (row[c.key] ?? "—")
                      )}
                    </TD>
                  ))}
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      {deleteAction && (
                        <Button size="sm" variant="danger" onClick={() => remove(row)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit" : addLabel}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
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
          {fields.map((f) => (
            <Field key={f.name} label={f.label} hint={f.hint}>
              {f.type === "select" ? (
                <Select
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValue(f.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[f.name])}
                  onChange={(e) => setValue(f.name, e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  step={f.step}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) =>
                    setValue(
                      f.name,
                      f.type === "number" ? e.target.value : e.target.value
                    )
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </Modal>
    </>
  );
}
