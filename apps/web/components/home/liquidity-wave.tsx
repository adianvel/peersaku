export function LiquidityWave() {
  return (
    <section className="border-b border-white/5 py-24">
      <div className="peer-container grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left: Text */}
        <div className="lg:col-span-4">
          <p className="label mb-4">LIQUIDITY DEPTH</p>

          <h2 className="section-heading mb-6">
            <span className="block text-white">DEEP</span>
            <span className="block text-[var(--cobalt)]">POOLS</span>
          </h2>

          <div className="divider mb-6 max-w-[400px]" />

          <p className="max-w-[420px] text-base leading-relaxed text-[var(--steel)]">
            Concentrated liquidity pools powered by Solana ensure instant
            matching between student borrowers and alumni lenders. Every
            transaction is verifiable on-chain.
          </p>
        </div>

        {/* Right: Chart */}
        <div className="lg:col-start-7 lg:col-span-6">
          <div className="border border-white/10 bg-[var(--surface)] p-6">
            {/* Chart header */}
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--steel)]">
                TVL / 30D
              </span>
              <span className="font-mono text-xs text-[var(--terminal-green)]">
                +12.4%
              </span>
            </div>

            {/* SVG Step Chart */}
            <div className="relative h-[200px] w-full">
              <svg
                viewBox="0 0 600 200"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Horizontal grid lines */}
                {[0, 50, 100, 150].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="600"
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Step-line chart area fill */}
                <path
                  d="M0,200 L0,170 L60,170 L60,155 L120,155 L120,160 L150,160 L150,140 L210,140 L210,135 L240,135 L240,130 L300,130 L300,120 L330,120 L330,110 L390,110 L390,100 L420,100 L420,95 L480,95 L480,85 L540,85 L540,80 L600,80 L600,200 Z"
                  fill="var(--cobalt)"
                  opacity="0.9"
                />

                {/* Step-line chart stroke */}
                <path
                  d="M0,170 L60,170 L60,155 L120,155 L120,160 L150,160 L150,140 L210,140 L210,135 L240,135 L240,130 L300,130 L300,120 L330,120 L330,110 L390,110 L390,100 L420,100 L420,95 L480,95 L480,85 L540,85 L540,80 L600,80"
                  fill="none"
                  stroke="var(--cobalt)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="mt-4 flex justify-between">
              {["MAR 01", "MAR 08", "MAR 15", "MAR 22", "MAR 29"].map(
                (label) => (
                  <span
                    key={label}
                    className="font-mono text-[9px] tracking-wider text-[var(--steel-dim)]"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
