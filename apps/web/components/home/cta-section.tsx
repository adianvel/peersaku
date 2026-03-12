import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 py-24">

      <div className="peer-container relative z-10 grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
        {/* Left: Text */}
        <div className="lg:col-span-5">
          <p className="label mb-4">JOIN THE PROTOCOL</p>

          <h2 className="section-heading mb-6">
            <span className="block text-white">START</span>
            <span className="block text-white">LENDING</span>
            <span className="block text-[var(--cobalt)]">TODAY</span>
          </h2>

          <div className="divider mb-6 max-w-[400px]" />

          <p className="max-w-[480px] text-base leading-relaxed text-[var(--steel)]">
            Whether you are a student seeking fair access to capital or an
            alumni looking to make an impact, PeerSaku connects you on-chain.
          </p>
        </div>

        {/* Right: CTAs */}
        <div className="lg:col-start-8 lg:col-span-5">
          <div className="flex flex-col gap-4">
            <Link
              href="/student-dashboard"
              className="flex h-14 w-full items-center justify-center bg-[var(--cobalt)] font-mono text-xs font-semibold tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]"
            >
              LAUNCH APP
            </Link>
            <Link
              href="#"
              className="flex h-14 w-full items-center justify-center border border-white/10 bg-transparent font-mono text-xs font-semibold tracking-[0.3em] text-white hover:border-white/20"
            >
              READ DOCUMENTATION
            </Link>
            <p className="micro-label mt-2 text-right">POWERED BY SOLANA</p>
          </div>
        </div>
      </div>
    </section>
  );
}
