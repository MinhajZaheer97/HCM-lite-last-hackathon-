"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import NotificationBell from "./NotificationBell";

export default function Topbar({ role, userName, onMenuClick }) {
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
        <NotificationBell />
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
