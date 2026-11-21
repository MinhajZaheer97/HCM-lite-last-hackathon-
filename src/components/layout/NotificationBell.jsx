"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((response) => (response.ok ? response.json() : { notifications: [] }))
      .then((data) => setItems(data.notifications ?? []));
  }, []);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(item) {
    if (!item.read_at) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry
        )
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
        aria-label="Notifications"
      >
        <span aria-hidden="true" className="text-base">●</span>
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[320px] rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <p className="text-[13px] font-semibold text-[#10264A]">Notifications</p>
            {unread > 0 && <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#2563EB]">{unread} unread</span>}
          </div>
          {!items.length ? (
            <p className="py-4 text-xs text-[#64748B]">No notifications yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <div key={item.id} className={`rounded-lg p-2.5 text-xs ${item.read_at ? "bg-[#F5F8FD]" : "bg-[#EFF6FF]"}`}>
                  <p className="font-semibold text-[#10264A]">{item.title}</p>
                  <p className="mt-1 text-[#64748B]">{item.body}</p>
                  {item.link && <Link href={item.link} onClick={() => markRead(item)} className="mt-2 inline-block font-medium text-[#2563EB]">Open</Link>}
                  {!item.read_at && <button type="button" onClick={() => markRead(item)} className="ml-3 mt-2 text-[#2563EB]">Mark read</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
