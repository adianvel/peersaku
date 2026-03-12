import Link from "next/link";
import type { ReactNode } from "react";

import { WalletConnect } from "@/components/wallet-connect";

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/auth", label: "AUTH" },
  { href: "/student-dashboard", label: "STUDENT" },
  { href: "/lender-dashboard", label: "LENDER" },
  { href: "/admin-dashboard", label: "ADMIN" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  children: ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="peer-container py-8 md:py-10">
        <header className="mb-6 border border-white/10 bg-[var(--surface)] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="label mb-1">PEERSAKU PROTOCOL</p>
              <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[var(--steel)]">{subtitle}</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <WalletConnect />
              <nav className="flex flex-wrap justify-end gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border border-white/10 bg-[var(--background)] px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
