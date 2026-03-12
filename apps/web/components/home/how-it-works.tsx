const steps = [
  {
    num: "01",
    title: "VERIFY",
    body: "Students verify their campus identity through on-chain credential attestation. Alumni verify through institutional records.",
  },
  {
    num: "02",
    title: "REQUEST",
    body: "Students submit loan requests with purpose, amount, and preferred terms. Smart contracts enforce maximum rate caps.",
  },
  {
    num: "03",
    title: "MATCH",
    body: "The protocol matches borrowers with lenders based on university affiliation, risk score, and available liquidity.",
  },
  {
    num: "04",
    title: "SETTLE",
    body: "Funds transfer instantly via Solana. Repayments are automated through smart contract schedules. Every transaction is immutable.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="peer-container grid grid-cols-1 gap-16 lg:grid-cols-12">
        {/* Left: Section Header */}
        <div className="lg:col-span-4">
          <p className="label mb-4">PROTOCOL FLOW</p>

          <h2 className="section-heading mb-6">
            <span className="block text-white">HOW IT</span>
            <span className="block text-[var(--cobalt)]">WORKS</span>
          </h2>

          <div className="divider mb-6 max-w-[300px]" />

          <p className="max-w-[360px] text-base leading-relaxed text-[var(--steel)]">
            Four steps from identity to settlement. No paperwork. No
            intermediaries. Pure peer-to-peer on Solana.
          </p>
        </div>

        {/* Right: Steps List */}
        <div className="lg:col-start-6 lg:col-span-7">
          <div className="border-t border-white/5">
            {steps.map((step) => (
              <div
                key={step.num}
                className="border-b border-white/5 py-8"
              >
                <div className="flex items-start gap-6">
                  <span className="font-mono text-xs text-[var(--steel-dim)]">
                    [{step.num}]
                  </span>
                  <div>
                    <h3 className="mb-3 text-3xl font-black text-white md:text-4xl">
                      {step.title}
                    </h3>
                    <p className="max-w-[520px] text-base leading-relaxed text-[var(--steel)]">
                      {step.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
