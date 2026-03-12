const features = [
  {
    num: "01",
    eyebrow: "LENDING VAULTS",
    headline: "SUPPLY\nLIQUIDITY",
    body: "Deposit SOL or USDC into lending vaults. Earn competitive yields while funding the next generation. Smart contracts handle all risk parameters and rate calculations.",
    stat: "8.2%",
    statLabel: "CURRENT APY",
    layout: "text-left" as const,
  },
  {
    num: "02",
    eyebrow: "BORROWING ENGINE",
    headline: "ACCESS\nCAPITAL",
    body: "Request loans with transparent terms. No hidden fees. No predatory rates. Maximum interest capped at 12% annually by protocol governance.",
    stat: "12%",
    statLabel: "MAX RATE CAP",
    layout: "text-right" as const,
  },
  {
    num: "03",
    eyebrow: "STAKING LAYER",
    headline: "STAKE\n& GOVERN",
    body: "Stake PEER tokens to participate in protocol governance. Vote on interest rate caps, new university partnerships, and treasury allocation.",
    stat: "14.6%",
    statLabel: "STAKING REWARD",
    layout: "text-left" as const,
  },
];

function VisualPlaceholder() {
  return (
    <div className="flex aspect-[4/3] items-center justify-center border border-white/10 bg-[var(--surface)]">
      <span className="font-mono text-xs text-[var(--steel-dim)]">
        [VISUAL]
      </span>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="peer-container flex flex-col gap-8">
        {features.map((feature) => (
          <div
            key={feature.num}
            className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
          >
            {/* Text block */}
            <div
              className={`lg:col-span-4 ${
                feature.layout === "text-right"
                  ? "order-2 lg:col-start-9"
                  : "order-1 lg:col-start-1"
              }`}
            >
              <p className="label mb-4">
                [{feature.num}] {feature.eyebrow}
              </p>

              <h3 className="section-heading mb-6 whitespace-pre-line text-white">
                {feature.headline}
              </h3>

              <div className="divider mb-6 max-w-[400px]" />

              <p className="mb-6 max-w-[420px] text-base leading-relaxed text-[var(--steel)]">
                {feature.body}
              </p>

              <div className="flex items-center gap-3">
                <span className="stat-number text-[var(--terminal-green)]">
                  {feature.stat}
                </span>
                <span className="micro-label">{feature.statLabel}</span>
              </div>
            </div>

            {/* Visual placeholder */}
            <div
              className={`lg:col-span-7 ${
                feature.layout === "text-right"
                  ? "order-1 lg:col-start-1"
                  : "order-2 lg:col-start-6"
              }`}
            >
              <VisualPlaceholder />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
