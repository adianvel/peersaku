import { eq, sql, and } from "drizzle-orm";
import { db, schema } from "@peersaku/database";

const {
  users,
  studentProfiles,
  loans,
  auditEvents,
  analyticsEvents,
  siwsNonces,
} = schema;

// ===== USERS =====

export async function createUser(input: {
  email: string;
  fullName: string;
  role: string;
  walletAddress?: string;
}) {
  const [user] = await db
    .insert(users)
    .values(input)
    .returning();
  return user;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

// ===== LOANS =====

export async function listLoans() {
  return db.select().from(loans);
}

export async function createLoan(input: {
  borrowerId: string;
  amount: number;
  interestRate: number;
  tenorDays: number;
  purposeCategory: string;
  purposeDetail?: string;
}) {
  const [loan] = await db
    .insert(loans)
    .values({ ...input, status: "pending" })
    .returning();
  return loan;
}

export async function getLoanById(id: string) {
  const [loan] = await db
    .select()
    .from(loans)
    .where(eq(loans.id, id))
    .limit(1);
  return loan ?? null;
}

export async function updateLoanStatus(id: string, status: string) {
  const [updated] = await db
    .update(loans)
    .set({ status, updatedAt: new Date() })
    .where(eq(loans.id, id))
    .returning();
  return updated ?? null;
}

// ===== KTM / STUDENT PROFILES =====

export async function createKtmSubmission(input: {
  userId: string;
  university: string;
  major: string;
  studentIdNum: string;
  enrollmentYear: number;
  ktmImageUrl: string;
  selfieUrl: string;
}) {
  const [submission] = await db
    .insert(studentProfiles)
    .values({
      ...input,
      verification: "pending",
    })
    .returning();
  return submission;
}

export async function listKtmSubmissions() {
  return db.select().from(studentProfiles);
}

export async function getKtmSubmissionById(id: string) {
  const [submission] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, id))
    .limit(1);
  return submission ?? null;
}

export async function updateKtmVerification(id: string, verification: string) {
  const now = verification === "approved" ? new Date() : undefined;
  const [updated] = await db
    .update(studentProfiles)
    .set({ verification, verifiedAt: now })
    .where(eq(studentProfiles.id, id))
    .returning();
  return updated ?? null;
}

export async function updateStudentNftMint(id: string, nftMintAddress: string) {
  const [updated] = await db
    .update(studentProfiles)
    .set({ studentNftMint: nftMintAddress })
    .where(eq(studentProfiles.id, id))
    .returning();
  return updated ?? null;
}

// ===== SIWS NONCES =====

export async function setSiwsNonce(walletAddress: string, nonce: string) {
  await db
    .insert(siwsNonces)
    .values({ walletAddress, nonce })
    .onConflictDoUpdate({
      target: siwsNonces.walletAddress,
      set: { nonce, createdAt: new Date() },
    });
}

export async function consumeSiwsNonce(walletAddress: string) {
  const [row] = await db
    .select()
    .from(siwsNonces)
    .where(eq(siwsNonces.walletAddress, walletAddress))
    .limit(1);

  if (!row) return null;

  await db
    .delete(siwsNonces)
    .where(eq(siwsNonces.walletAddress, walletAddress));

  return row.nonce;
}

// ===== AUDIT EVENTS =====

export async function appendAuditEvent(input: {
  source: string;
  type: string;
  payload: unknown;
}) {
  const [event] = await db
    .insert(auditEvents)
    .values(input)
    .returning();
  return event;
}

// ===== ANALYTICS EVENTS =====

export async function appendAnalyticsEvent(input: {
  name: string;
  actor?: string;
  meta?: Record<string, unknown>;
}) {
  const [event] = await db
    .insert(analyticsEvents)
    .values(input)
    .returning();
  return event;
}

export async function listAnalyticsEvents() {
  return db.select().from(analyticsEvents);
}

export async function getAnalyticsSummary() {
  const events = await db.select().from(analyticsEvents);

  const count = (name: string) =>
    events.filter((e) => e.name === name).length;

  const registerStarted = count("auth_register_started");
  const registerCompleted = count("auth_register_completed");
  const ktmCompleted = count("ktm_submit_completed");
  const loanCreated = count("loan_create_completed");
  const lenderFundingCompleted = count("lender_funding_completed");

  const toRate = (num: number, den: number) =>
    den === 0 ? 0 : Math.round((num / den) * 100);

  return {
    totalEvents: events.length,
    counts: {
      auth_register_started: registerStarted,
      auth_register_completed: registerCompleted,
      auth_siws_nonce_requested: count("auth_siws_nonce_requested"),
      auth_siws_verified: count("auth_siws_verified"),
      ktm_submit_started: count("ktm_submit_started"),
      ktm_submit_completed: ktmCompleted,
      loan_create_started: count("loan_create_started"),
      loan_create_completed: loanCreated,
      lender_marketplace_view: count("lender_marketplace_view"),
      lender_funding_clicked: count("lender_funding_clicked"),
      lender_funding_completed: lenderFundingCompleted,
      loan_repaid_on_time: count("loan_repaid_on_time"),
    },
    conversion: {
      registerCompletionRate: toRate(registerCompleted, registerStarted),
      ktmCompletionFromRegisterRate: toRate(ktmCompleted, registerCompleted),
      loanCreationFromKtmRate: toRate(loanCreated, ktmCompleted),
      fundingCompletionFromLoanRate: toRate(lenderFundingCompleted, loanCreated),
    },
  };
}

export const dbService = {
  createUser,
  findUserByEmail,
  findUserById,
  listLoans,
  createLoan,
  getLoanById,
  updateLoanStatus,
  createKtmSubmission,
  listKtmSubmissions,
  getKtmSubmissionById,
  updateKtmVerification,
  updateStudentNftMint,
  setSiwsNonce,
  consumeSiwsNonce,
  appendAuditEvent,
  appendAnalyticsEvent,
  listAnalyticsEvents,
  getAnalyticsSummary,
};
