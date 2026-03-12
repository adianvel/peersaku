import {
  Eye,
  FileCheck,
  Lock,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SecurityFeature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: Shield,
    title: "SMART CONTRACT AUDITED",
    body: "All protocol contracts are audited by leading security firms. Open-source and verifiable.",
  },
  {
    icon: Lock,
    title: "NON-CUSTODIAL",
    body: "Your funds never leave your wallet until a match is confirmed. Full self-custody at all times.",
  },
  {
    icon: Eye,
    title: "ON-CHAIN TRANSPARENCY",
    body: "Every loan, repayment, and liquidation is recorded on Solana. Public and immutable.",
  },
  {
    icon: FileCheck,
    title: "RATE GOVERNANCE",
    body: "Maximum interest rates are capped by protocol governance. No predatory lending possible.",
  },
];

export function SecuritySection() {
  return (
    <section className="py-24">
      <div className="peer-container">
        {/* Header */}
        <p className="label mb-4">TRUST ARCHITECTURE</p>

        <h2 className="section-heading mb-6">
          <span className="text-white">BUILT ON </span>
          <span className="text-[var(--cobalt)]">SECURITY</span>
        </h2>

        <div className="divider mb-12" />

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {securityFeatures.map((feature, i) => {
            const Icon = feature.icon;
            const isRight = i % 2 === 1;
            const isBottom = i >= 2;

            return (
              <div
                key={feature.title}
                className={`p-8 ${isRight ? "md:border-l md:border-white/10" : ""} ${isBottom ? "border-t border-white/5" : ""}`}
              >
                <Icon className="mb-4 h-5 w-5 text-[var(--cobalt)]" />
                <h3 className="mb-3 font-mono text-sm font-bold tracking-[0.15em] text-white">
                  {feature.title}
                </h3>
                <p className="max-w-[400px] text-base leading-relaxed text-[var(--steel)]">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
