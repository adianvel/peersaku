"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, LogOut, Plus, ShieldCheck, Clock, X } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { createLoan, listLoans, type LoanRecord } from "@/lib/phase3-api";

/* ── Types ── */
type Tab = "overview" | "applications" | "schedule";
type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

/* ── Mock user (replace with real auth later) ── */
const mockUser = {
  name: "adianvel",
  email: "ilhamadian346@gmail.com",
  verificationStatus: "unverified" as VerificationStatus,
};

/* ── Dashboard Top Bar ── */
function DashboardTopBar({ email }: { email: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-white/5 bg-[#050505] px-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-[0.2em] text-white">
          PEERSAKU
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
          / STUDENT DASHBOARD
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
          {email}
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
function StatsRow({ loans }: { loans: LoanRecord[] }) {
  const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalRepaid = loans
    .filter((l) => l.status === "repaid")
    .reduce((sum, l) => sum + l.amount, 0);
  const activeCount = loans.filter(
    (l) => l.status === "active" || l.status === "funded",
  ).length;
  const pendingCount = loans.filter((l) => l.status === "pending").length;

  const stats = [
    {
      label: "TOTAL BORROWED",
      value: totalBorrowed.toLocaleString("en-US"),
      unit: "USDC",
      color: "text-white",
    },
    {
      label: "TOTAL REPAID",
      value: totalRepaid.toLocaleString("en-US"),
      unit: "USDC",
      color: "text-[var(--terminal-green)]",
    },
    {
      label: "ACTIVE LOANS",
      value: String(activeCount),
      unit: "",
      color: "text-white",
    },
    {
      label: "PENDING",
      value: String(pendingCount),
      unit: "",
      color: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 border border-white/10 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`p-5 ${i > 0 ? "border-l border-white/10" : ""}`}
        >
          <p className="label mb-3">{stat.label}</p>
          <p className="flex items-baseline gap-2">
            <span className={`stat-number ${stat.color}`}>{stat.value}</span>
            {stat.unit && (
              <span className="font-mono text-sm font-bold text-white">
                {stat.unit}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Tab Navigation ── */
function TabNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "OVERVIEW" },
    { id: "applications", label: "APPLICATIONS" },
    { id: "schedule", label: "SCHEDULE" },
  ];

  return (
    <div className="flex gap-8 border-b border-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-3 font-mono text-xs tracking-[0.2em] ${
            active === tab.id
              ? "border-b-2 border-[var(--cobalt)] text-white"
              : "text-[var(--steel)] hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── Identity Card ── */
function IdentityCard({ status }: { status: VerificationStatus }) {
  const config = {
    unverified: {
      dot: "bg-[var(--steel)]",
      label: "NOT VERIFIED",
      icon: AlertTriangle,
      iconColor: "text-[var(--steel)]",
      showButton: true,
    },
    pending: {
      dot: "bg-[var(--yellow-risk)]",
      label: "PENDING VERIFICATION",
      icon: Clock,
      iconColor: "text-[var(--yellow-risk)]",
      showButton: false,
    },
    verified: {
      dot: "bg-[var(--terminal-green)]",
      label: "VERIFIED",
      icon: ShieldCheck,
      iconColor: "text-[var(--terminal-green)]",
      showButton: false,
    },
    rejected: {
      dot: "bg-[var(--red-risk)]",
      label: "REJECTED",
      icon: AlertTriangle,
      iconColor: "text-[var(--red-risk)]",
      showButton: true,
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-6">
      <p className="label mb-6">IDENTITY // BLOCKCHAIN STATUS</p>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 ${c.dot}`} />
          <span className="font-mono text-xs tracking-[0.15em] text-[var(--steel)]">
            {c.label}
          </span>
        </div>
        <Icon className={`h-5 w-5 ${c.iconColor}`} />
      </div>

      {c.showButton && (
        <button className="flex h-12 w-full items-center justify-center bg-[var(--cobalt)] font-mono text-xs font-semibold tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]">
          BEGIN VERIFICATION
        </button>
      )}
    </div>
  );
}

/* ── Active Loans Panel ── */
function ActiveLoansPanel({
  loans,
  onNewApplication,
}: {
  loans: LoanRecord[];
  onNewApplication: () => void;
}) {
  const activeLoans = loans.filter(
    (l) => l.status === "active" || l.status === "funded",
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="label">ACTIVE LOANS [{activeLoans.length}]</p>
        <button
          onClick={onNewApplication}
          className="flex h-9 items-center gap-2 bg-[var(--cobalt)] px-4 font-mono text-[10px] tracking-[0.2em] text-white hover:bg-[var(--cobalt-hover)]"
        >
          <Plus className="h-3 w-3" />
          NEW APPLICATION
        </button>
      </div>

      {activeLoans.length === 0 ? (
        <div className="flex h-32 items-center justify-center border border-white/10 bg-[var(--surface)]">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
            NO ACTIVE LOANS
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="border border-white/10 bg-[var(--surface)] p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="stat-number text-white">
                  {loan.amount.toLocaleString("en-US")}{" "}
                  <span className="font-mono text-sm font-bold">USDC</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 ${
                      loan.status === "active"
                        ? "bg-[var(--terminal-green)]"
                        : "bg-[var(--cobalt)]"
                    }`}
                  />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                    {loan.status.toUpperCase()}
                  </span>
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                {loan.purposeCategory.toUpperCase()} · {loan.tenorDays} DAYS ·{" "}
                {(loan.interestRate / 100).toFixed(1)}% APR
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Applications Tab ── */
function ApplicationsTab({ loans }: { loans: LoanRecord[] }) {
  return (
    <div>
      <p className="label mb-4">ALL APPLICATIONS [{loans.length}]</p>
      {loans.length === 0 ? (
        <div className="flex h-32 items-center justify-center border border-white/10 bg-[var(--surface)]">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
            NO APPLICATIONS YET
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="border border-white/10 bg-[var(--surface)] p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="stat-number text-white">
                  {loan.amount.toLocaleString("en-US")}{" "}
                  <span className="font-mono text-sm font-bold">USDC</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 ${
                      loan.status === "pending"
                        ? "bg-[var(--steel)]"
                        : loan.status === "funded"
                          ? "bg-[var(--cobalt)]"
                          : loan.status === "active"
                            ? "bg-[var(--terminal-green)]"
                            : loan.status === "repaid"
                              ? "bg-[var(--terminal-green)]"
                              : "bg-[var(--red-risk)]"
                    }`}
                  />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
                    {loan.status.toUpperCase()}
                  </span>
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                {loan.purposeCategory.toUpperCase()} · {loan.tenorDays} DAYS ·{" "}
                {(loan.interestRate / 100).toFixed(1)}% APR
              </p>
              <p className="mt-2 font-mono text-[9px] text-[var(--steel-dim)]">
                ID: {loan.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Schedule Tab ── */
function ScheduleTab() {
  return (
    <div className="flex h-48 items-center justify-center border border-white/10 bg-[var(--surface)]">
      <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
        NO REPAYMENT SCHEDULE
      </span>
    </div>
  );
}

/* ── New Loan Modal ── */
function NewLoanModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    currency: string;
    purpose: string;
    durationDays: number;
  }) => void;
}) {
  const [amount, setAmount] = useState("0.00");
  const [currency, setCurrency] = useState("USDC");
  const [purpose, setPurpose] = useState("");
  const [durationDays, setDurationDays] = useState(180);

  if (!isOpen) return null;

  function handleSubmit() {
    onSubmit({
      amount: parseFloat(amount) || 0,
      currency,
      purpose,
      durationDays,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85">
      <div className="w-full max-w-md border border-white/10 bg-[var(--surface)] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="label">NEW LOAN APPLICATION</p>
          <button
            onClick={onClose}
            className="text-[var(--steel)] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-5">
          <p className="label mb-2">AMOUNT</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 flex-1 border border-white/10 bg-[var(--background)] px-4 font-mono text-sm text-white placeholder:text-[var(--steel-dim)] focus:border-[var(--cobalt)] focus:outline-none"
              placeholder="0.00"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 border border-white/10 bg-[var(--cobalt)] px-3 font-mono text-xs font-semibold tracking-[0.15em] text-white focus:outline-none"
            >
              <option value="USDC">USDC</option>
              <option value="SOL">SOL</option>
            </select>
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-5">
          <p className="label mb-2">PURPOSE</p>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="min-h-[80px] w-full border border-white/10 bg-[var(--background)] px-4 py-3 font-mono text-sm text-white placeholder:text-[var(--steel-dim)] focus:border-[var(--cobalt)] focus:outline-none"
            placeholder="Tuition, housing, equipment..."
          />
        </div>

        {/* Duration */}
        <div className="mb-6">
          <p className="label mb-2">DURATION</p>
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="h-11 w-full border border-white/10 bg-[var(--background)] px-4 font-mono text-sm font-bold text-white focus:outline-none"
          >
            <option value={90}>90 DAYS</option>
            <option value={180}>180 DAYS</option>
            <option value={270}>270 DAYS</option>
            <option value={360}>360 DAYS</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center bg-[var(--cobalt)] font-mono text-xs font-semibold tracking-[0.3em] text-white hover:bg-[var(--cobalt-hover)]"
        >
          SUBMIT APPLICATION
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function StudentDashboardPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [modalOpen, setModalOpen] = useState(false);

  async function refreshLoans() {
    const result = await listLoans();
    if (result.ok && result.data) {
      setLoans(result.data);
    }
  }

  useEffect(() => {
    void refreshLoans();
  }, []);

  async function handleNewLoan(data: {
    amount: number;
    currency: string;
    purpose: string;
    durationDays: number;
  }) {
    await trackEvent({ name: "loan_create_started", actor: "borrower" });

    const result = await createLoan({
      borrowerId: "mock-borrower-id",
      amount: data.amount,
      interestRate: 1200,
      tenorDays: data.durationDays,
      purposeCategory: "lainnya",
      purposeDetail: data.purpose || undefined,
    });

    if (!result.ok) {
      toast.error(result.error ?? "Failed to create loan");
      return;
    }

    await trackEvent({
      name: "loan_create_completed",
      actor: "borrower",
      meta: { amount: data.amount },
    });

    toast.success("Loan application submitted");
    setModalOpen(false);
    void refreshLoans();
  }

  return (
    <>
      <DashboardTopBar email={mockUser.email} />

      <main className="min-h-screen bg-[var(--background)] pt-12">
        <div className="peer-container py-10">
          {/* Header */}
          <div className="mb-8">
            <p className="label mb-2">DASHBOARD // STUDENT</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Welcome, {mockUser.name}
            </h1>
          </div>

          {/* Stats Row */}
          <div className="mb-8">
            <StatsRow loans={loans} />
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <TabNav active={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
              <IdentityCard status={mockUser.verificationStatus} />
              <ActiveLoansPanel
                loans={loans}
                onNewApplication={() => setModalOpen(true)}
              />
            </div>
          )}

          {activeTab === "applications" && <ApplicationsTab loans={loans} />}

          {activeTab === "schedule" && <ScheduleTab />}
        </div>
      </main>

      {/* New Loan Modal */}
      <NewLoanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewLoan}
      />
    </>
  );
}
