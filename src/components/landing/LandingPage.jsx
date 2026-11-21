"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LandingIcon from "./LandingIcon";

const navItems = [
  ["Features", "features"],
  ["Solutions", "roles"],
  ["About", "security"],
  ["Contact", "footer"],
];

function Brand({ light = false }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="HCM Lite home">
      <Image
        src="/hcm-lite-logo.jpg"
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 rounded-lg object-contain"
      />
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>HCM Lite</span>
    </Link>
  );
}

function DashboardPreview({ compact = false }) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(7,24,49,0.22)] ${
        compact ? "w-full" : ""
      }`}
      aria-label="Illustrative HCM Lite dashboard preview"
    >
      <Image
        src="/hcm-lite-dashboard-clean.jpg"
        alt="HCM Lite dashboard preview showing employees, attendance, leave requests, payroll, and department analytics"
        width={2497}
        height={1536}
        sizes={compact ? "(max-width: 1024px) 100vw, 68vw" : "55vw"}
        className="h-auto w-full"
        priority
      />
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="overflow-hidden bg-white text-[#10264A]">
      <section className="relative bg-[#071831] text-white">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-[52%] top-[-130px] h-[470px] w-[470px] -rotate-[28deg] rounded-[42px] border border-white/[0.07]" />
          <div className="absolute bottom-[-180px] left-[60%] h-[420px] w-[420px] -rotate-[28deg] rounded-[42px] border border-[#3B82F6]/20" />
        </div>

        <header className="relative z-20">
          <div className="mx-auto flex h-[82px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
            <Brand light />
            <nav className="hidden items-center gap-8 text-sm text-slate-200 lg:flex" aria-label="Main navigation">
              {navItems.map(([label, id]) => (
                <a key={id} href={`#${id}`} className="transition-colors hover:text-white">
                  {label}
                </a>
              ))}
            </nav>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/setup"
                className="rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#1D4ED8]"
              >
                Get Started <span aria-hidden="true">→</span>
              </Link>
            </div>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 sm:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <LandingIcon name="menu" />
            </button>
          </div>
          {menuOpen && (
            <nav className="absolute left-5 right-5 top-[70px] z-30 rounded-xl border border-white/10 bg-[#0B1F3A] p-3 shadow-2xl sm:hidden" aria-label="Mobile navigation">
              {navItems.map(([label, id]) => (
                <a key={id} href={`#${id}`} onClick={closeMenu} className="block rounded-lg px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
                  {label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href="/login" onClick={closeMenu} className="rounded-lg border border-white/15 px-3 py-3 text-center text-sm font-semibold">Sign In</Link>
                <Link href="/setup" onClick={closeMenu} className="rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-3 py-3 text-center text-sm font-semibold">Get Started</Link>
              </div>
            </nav>
          )}
        </header>

        <div className="relative z-10 mx-auto grid min-h-[520px] max-w-[1180px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[43%_57%] lg:py-10">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex rounded-md border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              Human Capital Management
            </p>
            <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[58px] lg:text-[64px]">
              Complete HR Management for Your Organization
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Streamline HR processes with a powerful, easy-to-use platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/setup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-6 text-sm font-bold shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#1D4ED8]">
                Get Started <LandingIcon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="/setup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#60A5FA]/60 bg-gradient-to-r from-white/[0.10] to-[#2563EB]/20 px-6 text-sm font-bold transition-all hover:-translate-y-0.5 hover:border-[#93C5FD]/80 hover:from-white/[0.16]">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-white/40">
                  <LandingIcon name="play" className="ml-0.5 h-3 w-3" />
                </span>
                Start Demo
              </Link>
            </div>
          </div>
          <div className="-mr-20 hidden scale-[0.88] origin-right lg:block">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <div className="mx-auto block max-w-[1180px] px-5 pb-10 sm:px-8 lg:hidden">
        <div className="-mt-1">
          <DashboardPreview compact />
        </div>
      </div>

      <section className="border-y border-[#E2E8F0] bg-white" aria-label="Product highlights">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 px-5 sm:px-8 md:grid-cols-4">
          {[
            ["Employee Management", "users"],
            ["Attendance Tracking", "calendar"],
            ["Leave Management", "leave"],
            ["Payroll Management", "wallet"],
          ].map(([label, icon], index) => (
            <div key={label} className={`flex min-h-28 items-center gap-3 px-3 ${index > 0 ? "md:border-l md:border-[#E2E8F0]" : ""}`}>
              <LandingIcon name={icon} className="h-9 w-9 shrink-0 text-[#2563EB]" />
              <span className="text-sm font-bold leading-5">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#F5F8FD] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] items-start gap-10 lg:grid-cols-[36%_64%]">
          <div className="lg:sticky lg:top-8">
            <p className="inline-flex rounded-md bg-[#E4EFFF] px-3 py-1.5 text-xs font-bold text-[#2563EB]">Why HCM Lite?</p>
            <h2 className="mt-5 text-[38px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">Everything You Need for HR Management</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#64748B]">
              Powerful features designed to simplify your HR workflow and help you focus on what matters.
            </p>
            <a href="#product-preview" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#1D4ED8]">
              Explore Features <LandingIcon name="arrow" className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Employee Management", "users", "Manage employee records and organizational information."],
              ["Attendance Tracking", "calendar", "Monitor daily attendance and check-in and check-out records."],
              ["Leave Management", "leave", "Manage leave requests and approval workflows."],
              ["Payroll Management", "wallet", "Simplify payroll calculations and payslip management."],
              ["HR Analytics", "chart", "View workforce insights and relevant operational reports."],
              ["AI Assistant", "sparkle", "Ask role-scoped questions about your attendance and HR data."],
            ].map(([title, icon, copy]) => (
              <article key={title} className="group min-h-[170px] rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#C7D7F5] hover:shadow-[0_14px_30px_rgba(37,99,235,0.10)]">
                <LandingIcon name={icon} className="h-7 w-7 text-[#2563EB]" />
                <h3 className="mt-4 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-white px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563EB]">Built for every role</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">One platform, clear responsibilities</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Admin", "Manage company setup, organization structure, HR accounts, and payroll finalization."],
              ["HR", "Handle employees, attendance, leave decisions, payroll, and announcements."],
              ["Employee", "Record attendance, request leave, view payslips, and keep a personal profile."],
            ].map(([role, copy], index) => (
              <article key={role} className="rounded-xl border border-[#E2E8F0] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#EEF4FF] text-sm font-bold text-[#2563EB]">0{index + 1}</div>
                <h3 className="mt-5 text-lg font-bold">{role}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="product-preview" className="bg-[#F5F8FD] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[32%_68%]">
          <div>
            <p className="inline-flex rounded-md bg-[#E4EFFF] px-3 py-1.5 text-xs font-bold text-[#2563EB]">Product Preview</p>
            <h2 className="mt-5 text-[38px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">Powerful Dashboard at Your Fingertips</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#64748B]">
              Get clear insights into your workforce with an intuitive HR dashboard.
            </p>
            <a href="#features" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-5 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#1D4ED8]">
              Explore Features <LandingIcon name="arrow" className="h-4 w-4" />
            </a>
          </div>
          <div className="min-w-0">
            <DashboardPreview compact />
          </div>
        </div>
      </section>

      <section id="security" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold text-[#2563EB]">Security and access</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Built around company boundaries</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#64748B]">
              HCM Lite keeps organization data separate and presents role-specific workflows to Admin, HR, and Employee users.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Company isolation", "Separate company-scoped records and settings."],
              ["Role-based access", "Dedicated capabilities for Admin, HR, and Employee users."],
              ["Protected payroll", "Finalized payroll runs are locked from further changes."],
              ["Audit visibility", "Record changes are captured in the company audit log."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-xl border border-[#E2E8F0] p-5">
                <LandingIcon name="shield" className="h-7 w-7 text-[#2563EB]" />
                <h3 className="mt-4 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F8FD] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1180px] text-center">
          <p className="text-xs font-bold text-[#2563EB]">Getting Started</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-sm text-[#64748B] sm:text-base">Get started with HCM Lite in just a few simple steps.</p>

          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden border-t border-dashed border-[#CBD5E1] md:block" />
            {[
              ["01", "Set Up Your Company", "Configure your organization and basic company information.", "building"],
              ["02", "Add Your Team", "Register employees and organize departments.", "users"],
              ["03", "Start Managing HR", "Handle daily attendance, leave, and payroll operations.", "shield"],
            ].map(([number, title, copy, icon]) => (
              <article key={number} className="relative z-10 mx-auto max-w-xs">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-[#2563EB] text-sm font-bold text-white shadow-md">
                  {number}
                </div>
                <LandingIcon name={icon === "building" ? "calendar" : icon} className="mx-auto mt-5 h-7 w-7 text-[#2563EB]" />
                <h3 className="mt-3 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 rounded-xl bg-[#071831] px-6 py-8 text-white sm:px-10 lg:flex-row lg:items-center">
          <div className="flex items-start gap-5">
            <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#2563EB]/30 sm:grid">
              <LandingIcon name="shield" className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-[30px]">Ready to Simplify Your HR Operations?</h2>
              <p className="mt-2 text-sm text-slate-300">Create your company and take control of your workforce.</p>
            </div>
          </div>
          <Link href="/setup" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-white to-[#E0EFFF] px-5 text-sm font-bold text-[#10264A] shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5 hover:from-[#FFFFFF] hover:to-[#CFE1FF] sm:w-auto">
            Create Your Account <LandingIcon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer id="footer" className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 px-5 py-8 sm:px-8 md:flex-row">
          <Brand />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#64748B]" aria-label="Footer navigation">
            <a href="#features" className="hover:text-[#2563EB]">Features</a>
            <a href="#roles" className="hover:text-[#2563EB]">Solutions</a>
            <a href="#security" className="hover:text-[#2563EB]">About</a>
            <Link href="/login" className="hover:text-[#2563EB]">Sign In</Link>
            <a href="mailto:minusahab69@gmail.com" className="hover:text-[#2563EB]">Email</a>
            <a href="https://www.linkedin.com/in/minhaj-zaheer-187231396/" target="_blank" rel="noreferrer" className="hover:text-[#2563EB]">LinkedIn</a>
          </nav>
        </div>
        <div className="border-t border-[#E2E8F0] py-5 text-center text-xs text-[#64748B]">
          © {new Date().getFullYear()} HCM Lite. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
