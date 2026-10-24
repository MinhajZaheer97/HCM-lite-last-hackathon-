"use client";

import { useState } from "react";
import { Button, Modal, Badge } from "@/components/ui";
import { importCsvDryRun, importCsvCommit } from "./actions";

// Two-step CSV import: upload → dry-run report → explicit confirm.
export default function CsvImport() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null); // { valid, invalid }
  const [fileName, setFileName] = useState("");

  async function handleFile(file) {
    setFileName(file.name);
    setBusy(true);
    setError("");
    setReport(null);
    const text = await file.text();
    const res = await importCsvDryRun(text);
    setBusy(false);
    if (res?.error) setError(res.error);
    else setReport(res);
  }

  async function confirmImport() {
    setBusy(true);
    setError("");
    const res = await importCsvCommit(report.valid);
    setBusy(false);
    if (res?.error) setError(res.error);
    else {
      window.alert(`Imported ${res.imported} employee(s).`);
      setOpen(false);
      setReport(null);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => { setOpen(true); setReport(null); setError(""); }}>
        Import CSV
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Import employees from CSV"
        footer={
          report ? (
            <Button onClick={confirmImport} disabled={busy || report.valid.length === 0}>
              {busy ? "Importing…" : `Confirm import (${report.valid.length} valid rows)`}
            </Button>
          ) : null
        }
      >
        <p className="mb-3 text-sm text-ink-muted">
          Required columns: <code className="text-xs">emp_code, full_name, email, join_date</code>.
          Optional: <code className="text-xs">phone, gender, dob, department, designation, status, address</code>.
          Dates are <code className="text-xs">YYYY-MM-DD</code>. Column order is free when a header
          row is present. Nothing is written until you confirm.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        {fileName && <p className="mt-2 text-xs text-ink-muted">File: {fileName}</p>}

        {busy && <p className="mt-4 text-sm text-ink-muted">Validating…</p>}
        {error && (
          <p className="mt-4 rounded-lg border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}

        {report && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Badge tone="success">{report.valid.length} valid</Badge>
              <Badge tone={report.invalid.length ? "danger" : "neutral"}>
                {report.invalid.length} invalid
              </Badge>
            </div>
            {report.invalid.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border text-ink-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Problems</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.invalid.map((r) => (
                      <tr key={r.rowNumber}>
                        <td className="px-3 py-2">{r.rowNumber}</td>
                        <td className="px-3 py-2 text-danger-700">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.valid.length > 0 && (
              <p className="text-xs text-ink-muted">
                {report.valid.length} row(s) will be imported after confirmation. Invalid rows are
                never written; valid rows import as one all-or-nothing batch.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
