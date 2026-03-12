import Link from "next/link";

const protocolLinks = [
  { label: "Swap", href: "#" },
  { label: "Lend", href: "#" },
  { label: "Stake", href: "#" },
  { label: "Governance", href: "#" },
];

const resourceLinks = [
  { label: "Documentation", href: "#" },
  { label: "Whitepaper", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Audit Report", href: "#" },
];

const socialLinks = [
  { label: "TWITTER", href: "#" },
  { label: "DISCORD", href: "#" },
  { label: "GITHUB", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      {/* Main footer content */}
      <div className="peer-container py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div>
            <p className="mb-4 font-display text-xl font-black tracking-tight text-white">
              PEERSAKU
            </p>
            <p className="max-w-[240px] text-sm leading-relaxed text-[var(--steel)]">
              Peer-to-peer lending protocol built on Solana. Connecting
              students and alumni for transparent, fair-rate lending.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <p className="label mb-4">PROTOCOL</p>
            <ul className="space-y-3">
              {protocolLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white hover:text-[var(--cobalt)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="label mb-4">RESOURCES</p>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white hover:text-[var(--cobalt)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="label mb-4">LEGAL</p>
            <p className="mb-4 text-sm leading-relaxed text-[var(--steel)]">
              PeerSaku is a decentralized protocol. Users are responsible for
              their own funds and compliance with local regulations.
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white underline hover:text-[var(--cobalt)]"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white underline hover:text-[var(--cobalt)]"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="peer-container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel-dim)]">
            2026 PEERSAKU PROTOCOL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
