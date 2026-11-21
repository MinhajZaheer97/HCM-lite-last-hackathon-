"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";
import NotificationBell from "./NotificationBell";
import { navByRole } from "@/lib/nav";

export default function Topbar({ role, userName, onMenuClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentItem = navByRole[role]?.find((item) =>
    pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const pageTitle = currentItem?.label ?? (role === "employee" ? "My Dashboard" : "Dashboard");

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-[#E2E8F0] p-2 text-[#64748B] hover:bg-[#F8FAFC] lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="hidden items-center gap-3 sm:flex">
          <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-[#10264A]">{pageTitle}</h1>
          <span className="h-4 w-px bg-[#E2E8F0]" />
          <span className="text-[13px] font-medium text-[#64748B]">{role === "employee" ? "Personal Overview" : "Workforce Overview"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-[12.5px] font-medium text-[#10264A] hover:bg-[#F8FAFC]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0B1F3A] text-[11px] font-semibold text-white">
              {(userName || "U").slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden sm:inline">Account ▾</span>
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
