"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import {
  getAnalyticsSummary,
  listLoans,
  listKtmSubmissions,
  updateKtmVerification,
  type AnalyticsSummary,
  type KtmSubmissionRecord,
  type LoanRecord,
  type LoanStatus,
} from "@/lib/phase3-api";

/* ── Dashboard Top Bar ── */
function DashboardTopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-white/5 bg-[#050505] px-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-[0.2em] text-white">
          PEERSAKU
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--steel)]">
          / ADMIN DASHBOARD
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
          admin@peersaku.com
        </span>
        <button className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white">
          <LogOut className="h-3 w-3" />
          SIGN OUT
        </button>
      </div>
    </header>
  );
}

/* ── Overview Stats ── */
function OverviewStats({ loans }: { loans: LoanRecord[] }) {
  const totalLoans = loans.length;
  const activeVolume = loans
    .filter((l) => l.status === "active" || l.status === "funded")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalFees = loans.reduce(
    (sum, l) => sum + l.amount * (l.interestRate / 10000),
    0,
  );
  const defaultCount = loans.filter((l) => l.status === "defaulted").length;
  const defaultRate =
    totalLoans > 0 ? ((defaultCount / totalLoans) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "TOTAL LOANS", value: String(totalLoans), unit: "", color: "text-white" },
    {
      label: "ACTIVE VOLUME",
      value: activeVolume.toLocaleString("en-US"),
      unit: "USDC",
      color: "text-white",
    },
    {
      label: "TOTAL FEES",
      value: totalFees.toLocaleString("en-US", { maximumFractionDigits: 0 }),
      unit: "USDC",
      color: "text-[var(--terminal-green)]",
    },
    { label: "DEFAULT RATE", value: `${defaultRate}%`, unit: "", color: "text-white" },
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

/* ── Status color map ── */
const statusColors: Record<LoanStatus, string> = {
  pending: "bg-[var(--steel)]",
  funded: "bg-[var(--cobalt)]",
  active: "bg-[var(--terminal-green)]",
  repaid: "bg-[#22c55e]",
  defaulted: "bg-[#ef4444]",
  cancelled: "bg-[var(--steel)]",
};

const statusTextColors: Record<LoanStatus, string> = {
  pending: "text-[var(--steel)]",
  funded: "text-[var(--cobalt)]",
  active: "text-[var(--terminal-green)]",
  repaid: "text-[#22c55e]",
  defaulted: "text-[#ef4444]",
  cancelled: "text-[var(--steel)]",
};

/* ── Loan Origination Chart (SVG) ── */
function LoanOriginationChart({ loans }: { loans: LoanRecord[] }) {
  // Group loans by status for a bar visualization
  const statuses: LoanStatus[] = ["pending", "funded", "active", "repaid", "defaulted", "cancelled"];
  const counts = statuses.map((s) => ({
    status: s,
    count: loans.filter((l) => l.status === s).length,
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <p className="label mb-4">LOAN ORIGINATION</p>
      <div className="flex h-40 items-end gap-2">
        {counts.map((item) => {
          const height = (item.count / maxCount) * 100;
          return (
            <div key={item.status} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-white">{item.count}</span>
              <div
                className={`w-full ${statusColors[item.status]}`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--steel)]">
                {item.status.slice(0, 4).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Loan Status Pie (SVG donut) ── */
function LoanStatusPie({ loans }: { loans: LoanRecord[] }) {
  const statuses: LoanStatus[] = ["pending", "funded", "active", "repaid", "defaulted", "cancelled"];
  const svgColors: Record<LoanStatus, string> = {
    pending: "#707070",
    funded: "#0047FF",
    active: "#00FF41",
    repaid: "#22c55e",
    defaulted: "#ef4444",
    cancelled: "#555",
  };

  const counts = statuses.map((s) => ({
    status: s,
    count: loans.filter((l) => l.status === s).length,
  }));
  const total = counts.reduce((sum, c) => sum + c.count, 0) || 1;

  // Build donut segments
  let cumulative = 0;
  const segments = counts
    .filter((c) => c.count > 0)
    .map((c) => {
      const start = cumulative;
      cumulative += c.count / total;
      return {
        status: c.status,
        count: c.count,
        start,
        end: cumulative,
        color: svgColors[c.status],
      };
    });

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <p className="label mb-4">LOAN STATUS</p>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="h-32 w-32">
          {segments.map((seg) => (
            <path
              key={seg.status}
              d={describeArc(50, 50, 35, seg.start * 360, seg.end * 360 - 0.5)}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
            />
          ))}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white font-mono text-[14px] font-bold"
          >
            {loans.length}
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {counts
            .filter((c) => c.count > 0)
            .map((c) => (
              <div key={c.status} className="flex items-center gap-2">
                <span
                  className="h-2 w-2"
                  style={{ backgroundColor: svgColors[c.status] }}
                />
                <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                  {c.status.toUpperCase()} ({c.count})
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ── Fee Accumulation Chart (SVG area) ── */
function FeeAccumulationChart({ loans }: { loans: LoanRecord[] }) {
  // Compute cumulative fees by order
  const sorted = [...loans].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let cumFee = 0;
  const points = sorted.map((loan, i) => {
    cumFee += loan.amount * (loan.interestRate / 10000);
    return { x: i, y: cumFee };
  });

  if (points.length === 0) {
    return (
      <div className="border border-white/10 bg-[var(--surface)] p-5">
        <p className="label mb-4">FEE ACCUMULATION</p>
        <div className="flex h-32 items-center justify-center">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">NO DATA</span>
        </div>
      </div>
    );
  }

  const maxFee = Math.max(...points.map((p) => p.y), 1);
  const maxX = Math.max(points.length - 1, 1);
  const w = 300;
  const h = 120;

  const svgPoints = points.map(
    (p) => `${(p.x / maxX) * w},${h - (p.y / maxFee) * h}`,
  );
  const polyline = svgPoints.join(" ");
  const areaPoints = `0,${h} ${polyline} ${w},${h}`;

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <p className="label mb-4">FEE ACCUMULATION</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0047FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0047FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1="0"
            y1={h * (1 - frac)}
            x2={w}
            y2={h * (1 - frac)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        <polygon points={areaPoints} fill="url(#feeGrad)" />
        <polyline points={polyline} fill="none" stroke="#0047FF" strokeWidth="2" />
      </svg>
      <div className="mt-2 flex justify-between">
        <span className="font-mono text-[9px] text-[var(--steel)]">0</span>
        <span className="font-mono text-[9px] text-[var(--terminal-green)]">
          {cumFee.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC
        </span>
      </div>
    </div>
  );
}

/* ── KTM Verification Queue ── */
function KtmQueue({
  submissions,
  onVerify,
}: {
  submissions: KtmSubmissionRecord[];
  onVerify: (id: string, verdict: "approved" | "rejected") => void;
}) {
  const pending = submissions.filter((s) => s.verification === "pending");

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <p className="label mb-4">KTM VERIFICATION QUEUE [{pending.length}]</p>
      {pending.length === 0 ? (
        <div className="flex h-20 items-center justify-center">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
            QUEUE EMPTY
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <div key={sub.id} className="border border-white/5 bg-[var(--background)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--steel)]" />
                <span className="font-mono text-xs font-semibold text-white">
                  {sub.university}
                </span>
              </div>
              <p className="mb-3 font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                {sub.major} · NIM: {sub.studentIdNum} · {sub.enrollmentYear}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onVerify(sub.id, "approved")}
                  className="flex h-8 flex-1 items-center justify-center bg-[var(--terminal-green)] font-mono text-[10px] font-semibold tracking-[0.2em] text-black"
                >
                  APPROVE
                </button>
                <button
                  onClick={() => onVerify(sub.id, "rejected")}
                  className="flex h-8 flex-1 items-center justify-center border border-white/10 font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white"
                >
                  REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Loan Status Table ── */
function LoanStatusTable({ loans }: { loans: LoanRecord[] }) {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"amount" | "status" | "tenorDays">("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const perPage = 10;

  const sorted = [...loans].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "amount") return (a.amount - b.amount) * dir;
    if (sortBy === "tenorDays") return (a.tenorDays - b.tenorDays) * dir;
    return a.status.localeCompare(b.status) * dir;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const visible = sorted.slice(page * perPage, (page + 1) * perPage);

  function toggleSort(col: "amount" | "status" | "tenorDays") {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const columns = [
    { key: "id" as const, label: "ID", sortable: false },
    { key: "borrowerId" as const, label: "STUDENT", sortable: false },
    { key: "amount" as const, label: "AMOUNT", sortable: true },
    { key: "status" as const, label: "STATUS", sortable: true },
    { key: "interestRate" as const, label: "APR", sortable: false },
    { key: "tenorDays" as const, label: "DUE DATE", sortable: true },
    { key: "purposeCategory" as const, label: "PURPOSE", sortable: false },
  ];

  return (
    <div className="border border-white/10 bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.label}
                  onClick={() => col.sortable && toggleSort(col.key as "amount" | "status" | "tenorDays")}
                  className={`px-4 py-3 text-left font-mono text-[9px] tracking-[0.2em] text-[var(--steel)] ${
                    col.sortable ? "cursor-pointer hover:text-white" : ""
                  }`}
                >
                  {col.label}
                  {col.sortable && sortBy === col.key && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((loan) => (
              <tr
                key={loan.id}
                className="border-b border-white/5 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 font-mono text-[11px] text-[var(--steel)]">
                  {loan.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-white">
                  {loan.borrowerId.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 font-mono text-[11px] font-semibold text-white">
                  {loan.amount.toLocaleString("en-US")}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 ${statusColors[loan.status]}`} />
                    <span
                      className={`font-mono text-[10px] tracking-[0.15em] ${statusTextColors[loan.status]}`}
                    >
                      {loan.status.toUpperCase()}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-[var(--terminal-green)]">
                  {(loan.interestRate / 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-[var(--steel)]">
                  {loan.tenorDays}d
                </td>
                <td className="px-4 py-3 font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
                  {loan.purposeCategory.toUpperCase()}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center font-mono text-xs tracking-[0.2em] text-[var(--steel)]"
                >
                  NO LOAN DATA
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
          {loans.length} TOTAL · PAGE {page + 1}/{Math.max(totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-7 w-7 items-center justify-center border border-white/10 text-[var(--steel)] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-7 w-7 items-center justify-center border border-white/10 text-[var(--steel)] hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Analytics Summary ── */
function AnalyticsPanel({ summary }: { summary: AnalyticsSummary | null }) {
  if (!summary) {
    return (
      <div className="border border-white/10 bg-[var(--surface)] p-5">
        <p className="label mb-4">ANALYTICS</p>
        <div className="flex h-20 items-center justify-center">
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--steel)]">
            LOADING...
          </span>
        </div>
      </div>
    );
  }

  const conversions = [
    { label: "REGISTER COMPLETION", value: `${summary.conversion.registerCompletionRate}%` },
    { label: "KTM FROM REGISTER", value: `${summary.conversion.ktmCompletionFromRegisterRate}%` },
    { label: "LOAN FROM KTM", value: `${summary.conversion.loanCreationFromKtmRate}%` },
    { label: "FUNDING FROM LOAN", value: `${summary.conversion.fundingCompletionFromLoanRate}%` },
  ];

  return (
    <div className="border border-white/10 bg-[var(--surface)] p-5">
      <p className="label mb-4">CONVERSION FUNNEL</p>
      <div className="space-y-3">
        {conversions.map((c) => (
          <div key={c.label} className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
              {c.label}
            </span>
            <span className="font-mono text-xs font-bold text-white">{c.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--steel)]">
            TOTAL EVENTS
          </span>
          <span className="stat-number text-white">{summary.totalEvents}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function AdminDashboardPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [submissions, setSubmissions] = useState<KtmSubmissionRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  async function refreshAll() {
    const [loanResult, submissionResult, analyticsResult] = await Promise.all([
      listLoans(),
      listKtmSubmissions(),
      getAnalyticsSummary(),
    ]);

    if (loanResult.ok && loanResult.data) setLoans(loanResult.data);
    if (submissionResult.ok && submissionResult.data)
      setSubmissions(submissionResult.data);
    if (analyticsResult.ok && analyticsResult.data)
      setAnalytics(analyticsResult.data);
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  async function handleVerification(id: string, verdict: "approved" | "rejected") {
    const result = await updateKtmVerification(id, verdict);
    if (!result.ok) {
      toast.error(result.error ?? "Verification failed");
      return;
    }
    toast.success(`KTM ${verdict}`);
    void refreshAll();
  }

  return (
    <>
      <DashboardTopBar />

      <main className="min-h-screen bg-[var(--background)] pt-12">
        <div className="peer-container py-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="label mb-2">DASHBOARD // ADMIN</p>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Protocol Overview
              </h1>
            </div>
            <button
              onClick={() => void refreshAll()}
              className="flex h-9 items-center gap-2 border border-white/10 px-4 font-mono text-[10px] tracking-[0.2em] text-[var(--steel)] hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
              REFRESH
            </button>
          </div>

          {/* Overview Stats */}
          <div className="mb-8">
            <OverviewStats loans={loans} />
          </div>

          {/* Charts Row */}
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <LoanOriginationChart loans={loans} />
            <LoanStatusPie loans={loans} />
            <FeeAccumulationChart loans={loans} />
          </div>

          {/* KTM Queue + Analytics */}
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <KtmQueue submissions={submissions} onVerify={handleVerification} />
            <AnalyticsPanel summary={analytics} />
          </div>

          {/* Loan Table */}
          <div className="mb-4">
            <p className="label">LOAN STATUS TABLE</p>
          </div>
          <LoanStatusTable loans={loans} />
        </div>
      </main>
    </>
  );
}
