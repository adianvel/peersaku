import { ArrowDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-14">

      {/* Top divider */}
      <div className="absolute top-14 left-0 right-0 h-px bg-white/5" />

      <div className="peer-container grid min-h-[calc(100vh-56px)] grid-cols-1 items-center gap-12 py-24 lg:grid-cols-12">
        {/* Left: Text Content */}
        <div className="lg:col-span-7">
          {/* Eyebrow */}
          <p className="label mb-6">PEER-TO-PEER LENDING PROTOCOL</p>

          {/* Headline */}
          <h1 className="hero-heading mb-8">
            <span className="block text-white">LEND</span>
            <span className="block text-white">WITHOUT</span>
            <span className="block text-[var(--cobalt)]">BORDERS</span>
          </h1>

          {/* Divider */}
          <div className="divider mb-8 max-w-[600px]" />

          {/* Body */}
          <p className="mb-10 max-w-[480px] text-base leading-relaxed text-[var(--steel)]">
            Connecting students directly to alumni lenders on Solana.
            Transparent rates. Zero intermediaries. Full on-chain
            accountability.
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-0">
            <div className="pr-8">
              <p className="stat-number text-white">$2.4M</p>
              <p className="micro-label mt-2">TOTAL VALUE LOCKED</p>
            </div>
            <div className="border-l border-white/10 px-8">
              <p className="stat-number text-[var(--terminal-green)]">8.2%</p>
              <p className="micro-label mt-2">AVG LENDING APY</p>
            </div>
            <div className="border-l border-white/10 pl-8">
              <p className="stat-number text-white">1,247</p>
              <p className="micro-label mt-2">ACTIVE USERS</p>
            </div>
          </div>
        </div>

        {/* Right: Swap Monolith */}
        <div className="lg:col-start-9 lg:col-span-4">
          <div className="border border-white/10 bg-[var(--surface)] p-6">
            {/* Swap Header */}
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-sm font-medium text-white">
                SWAP
              </span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                SOLANA NETWORK
              </span>
            </div>

            {/* FROM Input */}
            <div className="mb-2 border border-white/10 bg-[var(--background)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                  FROM
                </span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                  BAL: 12.450 SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl text-[var(--steel-dim)]">
                  0.00
                </span>
                <span className="border border-white/10 px-3 py-1 font-mono text-xs font-medium text-white">
                  SOL
                </span>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center py-2">
              <div className="flex h-8 w-8 items-center justify-center border border-white/10 bg-[var(--background)]">
                <ArrowDown className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* TO Input */}
            <div className="mt-2 border border-white/10 bg-[var(--background)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                  TO
                </span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                  BAL: 0.00 USDC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl text-[var(--steel-dim)]">
                  0.00
                </span>
                <span className="border border-white/10 px-3 py-1 font-mono text-xs font-medium text-white">
                  USDC
                </span>
              </div>
            </div>

            {/* Rate */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                RATE
              </span>
              <span className="font-mono text-xs text-[var(--terminal-green)]">
                1 SOL = 142.50 USDC
              </span>
            </div>

            {/* CTA */}
            <button className="mt-4 flex h-12 w-full items-center justify-center bg-[var(--cobalt)] font-mono text-xs font-semibold tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]">
              CONNECT WALLET
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
