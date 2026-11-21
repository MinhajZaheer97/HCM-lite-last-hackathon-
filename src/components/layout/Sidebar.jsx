"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navByRole, roleLabels } from "@/lib/nav";

export default function Sidebar({ role, open, onClose }) {
  const pathname = usePathname();
  const items = navByRole[role] ?? [];

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#071529]/45 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#162F54] bg-[#0B1F3A] text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[68px] items-center gap-3 border-b border-white/[0.08] px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
            <Image src="/hcm-lite-logo.jpg" alt="" width={36} height={36} className="h-full w-full object-contain" />
          </span>
          <div className="leading-tight">
            <span className="block text-[16px] font-bold tracking-tight text-white">HCM Lite</span>
            <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#93C5FD]/90">
              {roleLabels[role]} workspace
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-5" aria-label="Main navigation">
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400/80">
            Workforce Suite
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`block rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-all ${
                      active
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/[0.08] p-3.5">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.08] bg-white/[0.05] p-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-xs font-bold">
              HC
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-white">HCM Lite</p>
              <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{roleLabels[role]} workspace</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
