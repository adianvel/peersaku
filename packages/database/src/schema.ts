import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 44 }).unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("users_role_check", sql`${table.role} in ('borrower', 'lender', 'admin')`),
]);

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  university: varchar("university", { length: 255 }).notNull(),
  faculty: varchar("faculty", { length: 255 }),
  major: varchar("major", { length: 255 }).notNull(),
  studentIdNum: varchar("student_id_num", { length: 50 }).notNull(),
  enrollmentYear: integer("enrollment_year").notNull(),
  ktmImageUrl: text("ktm_image_url").notNull(),
  selfieUrl: text("selfie_url").notNull(),
  verification: varchar("verification", { length: 20 }).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  studentNftMint: varchar("student_nft_mint", { length: 44 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("student_profiles_verification_check", sql`${table.verification} in ('pending', 'approved', 'rejected')`),
]);

export const lenderProfiles = pgTable("lender_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kycStatus: varchar("kyc_status", { length: 20 }).default("basic").notNull(),
  totalLent: bigint("total_lent", { mode: "number" }).default(0).notNull(),
  activeLoans: integer("active_loans").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("lender_profiles_kyc_status_check", sql`${table.kycStatus} in ('basic', 'verified', 'rejected')`),
]);

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  onchainAddress: varchar("onchain_address", { length: 44 }).unique(),
  borrowerId: uuid("borrower_id").notNull().references(() => users.id),
  amount: bigint("amount", { mode: "number" }).notNull(),
  interestRate: integer("interest_rate").notNull(),
  tenorDays: integer("tenor_days").notNull(),
  purposeCategory: varchar("purpose_category", { length: 50 }).notNull(),
  purposeDetail: text("purpose_detail"),
  proofUrl: text("proof_url"),
  status: varchar("status", { length: 20 }).notNull(),
  fundedAt: timestamp("funded_at", { withTimezone: true }),
  disbursedAt: timestamp("disbursed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loanFundings = pgTable("loan_fundings", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").notNull().references(() => loans.id),
  lenderId: uuid("lender_id").notNull().references(() => users.id),
  onchainAddress: varchar("onchain_address", { length: 44 }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  txSignature: varchar("tx_signature", { length: 88 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const repayments = pgTable("repayments", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").notNull().references(() => loans.id),
  installmentNum: integer("installment_num").notNull(),
  amountDue: bigint("amount_due", { mode: "number" }).notNull(),
  amountPaid: bigint("amount_paid", { mode: "number" }).default(0).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  txSignature: varchar("tx_signature", { length: 88 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("repayments_status_check", sql`${table.status} in ('pending', 'paid', 'late', 'defaulted')`),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformTransactions = pgTable("platform_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  referenceId: uuid("reference_id"),
  txSignature: varchar("tx_signature", { length: 88 }),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
