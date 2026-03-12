"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LogOut,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Zap,
  X,
  SlidersHorizontal,
} from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import {
  listLoans,
  updateLoanStatus,
  type LoanRecord,
  type LoanStatus,
} from "@/lib/phase3-api";

/* ── Types ── */
type RiskFilter = "all" | "low" | "medium" | "high";

/* ── Dashboard Top Bar ── */
function DashboardTopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-white/5 bg-[#050505] px-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-[0.2em] text-white">
          PEERSAKU
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
          / LENDER DASHBOARD
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
          lender@peersaku.com
        </span>
        <button className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white">
          <LogOut className="h-3 w-3" />
          SIGN OUT
        </button>
      </div>
    </header>
  );
}

/* ── Stats Row ── */
function LenderStatsRow({ loans }: { loans: LoanRecord[] }) {
  const fundedVolume = loans
    .filter((l) => l.status === "funded" || l.status === "active" || l.status === "repaid")
    .reduce((sum, l) => sum + l.amount, 0);
  const availableToFund = loans
    .filter((l) => l.status === "pending")
    .reduce((sum, l) => sum + l.amount, 0);
  const activePositions = loans.filter(
    (l) => l.status === "funded" || l.status === "active",
  ).length;
  const avgApy = loans.length > 0
    ? (loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length / 100).toFixed(1)
    : "0.0";

  const stats = [
    { label: "AVAILABLE TO FUND", value: availableToFund.toLocaleString("en-US"), unit: "USDC", color: "text-white" },
    { label: "FUNDED VOLUME", value: fundedVolume.toLocaleString("en-US"), unit: "USDC", color: "text-white" },
    { label: "AVG APY", value: `${avgApy}%`, unit: "", color: "text-[var(--terminal-green)]" },
    { label: "ACTIVE POSITIONS", value: String(activePositions), unit: "", color: "text-white" },
  ];

  return (
    <div className="grid grid-cols-2 border border-white/10 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className={`p-5 ${i > 0 ? "border-l border-white/10" : ""}`}>
          <p className="label mb-3">{stat.label}</p>
          <p className="flex items-baseline gap-2">
            <span className={`stat-number ${stat.color}`}>{stat.value}</span>
            {stat.unit && (
              <span className="font-mono text-sm font-bold text-white">{stat.unit}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Filters Panel ── */
function LenderFilters({
  institution,
  currency,
  riskFilter,
  onInstitutionChange,
  onCurrencyChange,
  onRiskChange,
  onReset,
}: {
  institution: string;
  currency: string;
  riskFilter: RiskFilter;
  onInstitutionChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onRiskChange: (v: RiskFilter) => void;
  onReset: () => void;
}) {
  const riskOptions: { id: RiskFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "low", label: "LOW 75+" },
    { id: "medium", label: "MED 50–74" },
    { id: "high", label: "HIGH <50" },
  ];

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--steel)]" />
          <p className="label">FILTERS</p>
        </div>
        <button
          onClick={onReset}
          className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)] hover:text-white"
        >
          RESET
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Institution */}
        <div>
          <p className="label mb-2">INSTITUTION</p>
          <select
            value={institution}
            onChange={(e) => onInstitutionChange(e.target.value)}
            className="h-10 w-full border border-white/10 bg-[var(--background)] px-3 font-mono text-xs text-white focus:outline-none"
          >
            <option value="all">All</option>
            <option value="UI">Universitas Indonesia</option>
            <option value="ITB">ITB</option>
            <option value="UGM">UGM</option>
            <option value="UNPAD">UNPAD</option>
            <option value="ITS">ITS</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <p className="label mb-2">CURRENCY</p>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="h-10 w-full border border-white/10 bg-[var(--background)] px-3 font-mono text-xs text-white focus:outline-none"
          >
            <option value="all">All</option>
            <option value="USDC">USDC</option>
            <option value="SOL">SOL</option>
          </select>
        </div>

        {/* Risk Score */}
        <div className="md:col-span-2">
          <p className="label mb-2">RISK SCORE</p>
          <div className="flex gap-0 border border-white/10">
            {riskOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onRiskChange(opt.id)}
                className={`flex-1 py-2 font-mono text-[10px] tracking-[0.15em] ${
                  riskFilter === opt.id
                    ? "bg-[var(--cobalt)] text-white"
                    : "bg-[var(--background)] text-[var(--steel)] hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Risk score helper (mock) ── */
function getRiskScore(_loan: LoanRecord): number {
  // Mock risk score based on amount/tenor for demo
  const base = Math.min(100, Math.max(20, 100 - (_loan.amount / 1000) + (_loan.tenorDays > 180 ? -15 : 10)));
  return Math.round(base);
}

function getRiskColor(score: number) {
  if (score >= 75) return "bg-[var(--terminal-green)]";
  if (score >= 50) return "bg-[var(--yellow-risk)]";
  return "bg-[var(--red-risk)]";
}

function getVerificationIcon(status: LoanStatus) {
  if (status === "active" || status === "repaid") return { Icon: ShieldCheck, color: "text-[var(--terminal-green)]" };
  if (status === "funded") return { Icon: Clock, color: "text-[var(--yellow-risk)]" };
  return { Icon: AlertTriangle, color: "text-[var(--steel)]" };
}

/* ── Loan Request Card ── */
function LoanRequestCard({
  loan,
  onFund,
}: {
  loan: LoanRecord;
  onFund: (loan: LoanRecord) => void;
}) {
  const riskScore = getRiskScore(loan);
  const riskColor = getRiskColor(riskScore);
  const apr = (loan.interestRate / 100).toFixed(1);
  const estReturn = (loan.amount * (loan.interestRate / 10000)).toFixed(0);
  const verification = getVerificationIcon(loan.status);
  const VerificationIcon = verification.Icon;
  const canFund = loan.status === "pending";

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="stat-number text-white">
          {loan.amount.toLocaleString("en-US")}{" "}
          <span className="font-mono text-sm font-bold text-[var(--steel)]">USDC</span>
        </span>
        <span className="font-mono text-lg font-bold text-[var(--terminal-green)]">
          {apr}% <span className="text-[10px] tracking-[0.15em] text-[var(--steel)]">APR</span>
        </span>
      </div>

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-4 font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
        <span>{loan.purposeCategory.toUpperCase()}</span>
        <span>{loan.tenorDays} DAYS</span>
        <span>EST. {Number(estReturn).toLocaleString("en-US")} USDC</span>
        <VerificationIcon className={`h-3.5 w-3.5 ${verification.color}`} />
      </div>

      {/* Risk bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--steel)]">
            RISK SCORE
          </span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--steel)]">
            {riskScore}/100
          </span>
        </div>
        <div className="h-px w-full bg-white/10">
          <div className={`h-px ${riskColor}`} style={{ width: `${riskScore}%` }} />
        </div>
      </div>

      {/* CTA */}
      {canFund ? (
        <button
          onClick={() => onFund(loan)}
          className="flex h-11 w-full items-center justify-center bg-[var(--cobalt)] font-mono text-xs font-semibold tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]"
        >
          FUND THIS LOAN
        </button>
      ) : (
        <div className="flex h-11 w-full items-center justify-center border border-white/10 bg-[var(--background)] font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
          {loan.status === "funded" ? "AWAITING VERIFICATION" : loan.status.toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* ── Fund Confirm Modal ── */
function FundConfirmModal({
  loan,
  onClose,
  onConfirm,
}: {
  loan: LoanRecord | null;
  onClose: () => void;
  onConfirm: (loanId: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);

  if (!loan) return null;

  const apr = (loan.interestRate / 100).toFixed(1);
  const estReturn = (loan.amount * (loan.interestRate / 10000)).toFixed(0);

  const rows = [
    { label: "BORROWER", value: loan.borrowerId.slice(0, 8) + "..." },
    { label: "AMOUNT", value: `${loan.amount.toLocaleString("en-US")} USDC` },
    { label: "TERM", value: `${loan.tenorDays} DAYS` },
    { label: "APR", value: `${apr}%` },
    { label: "EST. RETURN", value: `${Number(estReturn).toLocaleString("en-US")} USDC` },
    { label: "PURPOSE", value: loan.purposeCategory.toUpperCase() },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85">
      <div className="w-full max-w-md border border-white/10 bg-[var(--surface)] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="label">CONFIRM FUNDING</p>
          <button onClick={onClose} className="text-[var(--steel)] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary table */}
        <div className="mb-6 space-y-0 border border-white/10">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                {row.label}
              </span>
              <span className="font-mono text-xs font-semibold text-white">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Agreement */}
        <label className="mb-6 flex cursor-pointer items-start gap-3">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
              agreed ? "border-[var(--cobalt)] bg-[var(--cobalt)]" : "border-white/10 bg-[var(--background)]"
            }`}
          >
            {agreed && <span className="text-[10px] text-white">✓</span>}
          </div>
          <span className="font-mono text-[10px] leading-relaxed text-[var(--steel)]">
            I understand that this is a peer-to-peer lending transaction on Solana blockchain.
            Funds will be locked until the borrower repays or the loan defaults.
          </span>
        </label>

        {/* Confirm */}
        <button
          onClick={() => agreed && onConfirm(loan.id)}
          disabled={!agreed}
          className={`flex h-12 w-full items-center justify-center gap-2 font-mono text-xs font-semibold tracking-[0.3em] text-white ${
            agreed
              ? "bg-[var(--cobalt)] hover:bg-[var(--cobalt-hover)]"
              : "cursor-not-allowed bg-[var(--cobalt)] opacity-40"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          CONFIRM & FUND ON SOLANA
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function LenderDashboardPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [institution, setInstitution] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [fundingLoan, setFundingLoan] = useState<LoanRecord | null>(null);

  async function refreshLoans() {
    const result = await listLoans();
    if (result.ok && result.data) {
      setLoans(result.data);
    }
  }

  useEffect(() => {
    void refreshLoans();
    void trackEvent({ name: "lender_marketplace_view", actor: "lender" });
  }, []);

  // Filter loans
  const filteredLoans = loans.filter((loan) => {
    if (riskFilter !== "all") {
      const score = getRiskScore(loan);
      if (riskFilter === "low" && score < 75) return false;
      if (riskFilter === "medium" && (score < 50 || score >= 75)) return false;
      if (riskFilter === "high" && score >= 50) return false;
    }
    return true;
  });

  async function handleFundConfirm(loanId: string) {
    await trackEvent({
      name: "lender_funding_clicked",
      actor: "lender",
      meta: { loanId, status: "funded" },
    });

    const result = await updateLoanStatus(loanId, "funded");

    if (!result.ok) {
      toast.error(result.error ?? "Failed to fund loan");
      return;
    }

    await trackEvent({
      name: "lender_funding_completed",
      actor: "lender",
      meta: { loanId },
    });

    toast.success("Loan funded successfully");
    setFundingLoan(null);
    void refreshLoans();
  }

  function handleReset() {
    setInstitution("all");
    setCurrency("all");
    setRiskFilter("all");
  }

  return (
    <>
      <DashboardTopBar />

      <main className="min-h-screen bg-[var(--background)] pt-12">
        <div className="peer-container py-10">
          {/* Header */}
          <div className="mb-8">
            <p className="label mb-2">DASHBOARD // LENDER</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Loan Marketplace
            </h1>
          </div>

          {/* Stats Row */}
          <div className="mb-8">
            <LenderStatsRow loans={loans} />
          </div>

          {/* Filters */}
          <div className="mb-8">
            <LenderFilters
              institution={institution}
              currency={currency}
              riskFilter={riskFilter}
              onInstitutionChange={setInstitution}
              onCurrencyChange={setCurrency}
              onRiskChange={setRiskFilter}
              onReset={handleReset}
            />
          </div>

          {/* Loan request cards */}
          <div className="mb-4">
            <p className="label">LOAN REQUESTS [{filteredLoans.length}]</p>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="flex h-48 items-center justify-center border border-white/10 bg-[var(--surface)]">
              <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
                NO MATCHING LOAN REQUESTS
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLoans.map((loan) => (
                <LoanRequestCard
                  key={loan.id}
                  loan={loan}
                  onFund={setFundingLoan}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fund Confirm Modal */}
      <FundConfirmModal
        loan={fundingLoan}
        onClose={() => setFundingLoan(null)}
        onConfirm={handleFundConfirm}
      />
    </>
  );
}
