import Link from "next/link";

const navLinks = [
  { label: "SWAP", href: "#" },
  { label: "LEND", href: "#" },
  { label: "STAKE", href: "#" },
  { label: "DOCS", href: "#" },
];

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-sm">
      <div className="peer-container flex h-14 items-center justify-between">
        {/* Left: Wordmark + Circle Indicator */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-sm font-bold tracking-[0.25em] text-white"
          >
            PEERSAKU
          </Link>
        </div>

        {/* Right: Nav Links + CTA */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-mono text-[10px] tracking-[0.3em] text-[var(--steel)] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/student-dashboard"
            className="flex h-9 items-center bg-[var(--cobalt)] px-5 font-mono text-[10px] tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]"
          >
            LAUNCH APP
          </Link>
        </nav>
      </div>
    </header>
  );
}
