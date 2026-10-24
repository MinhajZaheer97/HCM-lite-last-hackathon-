"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-actions";

export default function Topbar({ role, userName, onMenuClick }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-ink-muted hover:bg-surface-muted lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="hidden text-sm text-ink-muted sm:inline">
          <span className="font-medium text-ink">{userName || "…"}</span> · {role}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Notification bell — real notifications arrive in Phase 9 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded-md p-2 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Notifications"
          >
            🔔
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-11 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
              <p className="text-sm font-medium text-ink">Notifications</p>
              <p className="mt-2 text-xs text-ink-muted">
                No notifications yet. Leave decisions and payslip alerts will appear here.
              </p>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md px-2 py-1.5 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            Account ▾
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 rounded-xl border border-border bg-surface py-1 shadow-lg">
              <Link
                href="/change-password"
                className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                onClick={() => setMenuOpen(false)}
              >
                Change password
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="block w-full px-4 py-2 text-left text-sm text-danger-700 hover:bg-surface-muted"
                >
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
