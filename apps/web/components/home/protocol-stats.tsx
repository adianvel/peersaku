const stats = [
  { label: "TOTAL LOANS ISSUED", value: "3,842", sub: "CUMULATIVE", color: "text-white" },
  { label: "DEFAULT RATE", value: "0.3%", sub: "HISTORICAL", color: "text-[var(--terminal-green)]" },
  { label: "AVG LOAN DURATION", value: "180D", sub: "MEDIAN", color: "text-white" },
  { label: "PROTOCOL FEE", value: "0.5%", sub: "PER TRANSACTION", color: "text-[var(--terminal-green)]" },
];

export function ProtocolStats() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 py-16">

      <div className="peer-container relative z-10">
        {/* Section label */}
        <p className="label mb-2">PROTOCOL METRICS // REAL-TIME</p>
        <div className="divider mb-10" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`${i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}`}
            >
              <p className="label mb-4">{stat.label}</p>
              <p className={`stat-number ${stat.color}`}>{stat.value}</p>
              <p className="micro-label mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
