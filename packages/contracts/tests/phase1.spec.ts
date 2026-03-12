import { strict as assert } from "node:assert";
import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { describe, it } from "mocha";

const { SystemProgram, Keypair, PublicKey, LAMPORTS_PER_SOL } = web3;

const PLATFORM_FEE_BPS = 150;
const LOAN_AMOUNT = 1_000_000;
const INTEREST_BPS = 1_500;
const TENOR_DAYS = 30;
const TOTAL_REPAYMENTS = 3;

const CREDIT_BASE_SCORE = 500;
const EARLY_REPAY_BONUS = 25;
const FIRST_LOAN_COMPLETION_BONUS = 50;
const DEFAULT_PENALTY = 100;

function loanStatusName(status: unknown): string {
  const value = status as Record<string, unknown>;
  return Object.keys(value)[0] ?? "unknown";
}

function calculateInterest(principal: number, interestRateBps: number, tenorDays: number): number {
  return Math.floor((principal * interestRateBps * tenorDays) / (10_000 * 365));
}

async function fundWallet(
  provider: anchor.AnchorProvider,
  recipient: PublicKey,
  lamports = LAMPORTS_PER_SOL,
): Promise<void> {
  const tx = new web3.Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: recipient,
      lamports,
    }),
  );

  await provider.sendAndConfirm(tx);
}

/**
 * Jalankan dengan:
 * pnpm --filter @peersaku/contracts test:anchor
 */
describe("PeerSaku Phase 1 - contract flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const lendingProgram = anchor.workspace.PeersakuLending as Program;
  const creditProgram = anchor.workspace.PeersakuCredit as Program;

  const borrower = Keypair.generate();
  const lender = Keypair.generate();

  const [lendingConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    lendingProgram.programId,
  );

  const [creditConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("credit_config")],
    creditProgram.programId,
  );

  const [creditProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("credit_profile"), borrower.publicKey.toBuffer()],
    creditProgram.programId,
  );

  const loanSeed = new BN(1);
  const [loanPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan"), borrower.publicKey.toBuffer(), loanSeed.toArrayLike(Buffer, "le", 8)],
    lendingProgram.programId,
  );

  const [fundingPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("funding"), loanPda.toBuffer(), lender.publicKey.toBuffer()],
    lendingProgram.programId,
  );

  it("initializes lending + credit authority configs", async () => {
    await fundWallet(provider, borrower.publicKey, 2 * LAMPORTS_PER_SOL);
    await fundWallet(provider, lender.publicKey, 2 * LAMPORTS_PER_SOL);

    await lendingProgram.methods
      .initialize(PLATFORM_FEE_BPS)
      .accounts({
        payer: provider.wallet.publicKey,
        config: lendingConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await creditProgram.methods
      .initializeProgram()
      .accounts({
        authority: provider.wallet.publicKey,
        programAuthorityConfig: creditConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const lendingConfig = await lendingProgram.account.protocolConfig.fetch(lendingConfigPda);
    assert.equal(lendingConfig.admin.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(lendingConfig.platformFeeBps, PLATFORM_FEE_BPS);

    const creditConfig = await creditProgram.account.programAuthorityConfig.fetch(creditConfigPda);
    assert.equal(creditConfig.authority.toBase58(), provider.wallet.publicKey.toBase58());
  });

  it("creates, funds, disburses, and repays loan with score update CPI", async () => {
    await creditProgram.methods
      .initializeProfile(Keypair.generate().publicKey)
      .accounts({
        owner: borrower.publicKey,
        creditProfile: creditProfilePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    await lendingProgram.methods
      .createLoan(
        loanSeed,
        new BN(LOAN_AMOUNT),
        INTEREST_BPS,
        TENOR_DAYS,
        TOTAL_REPAYMENTS,
        "Biaya UKT semester berjalan",
      )
      .accounts({
        borrower: borrower.publicKey,
        loan: loanPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    await lendingProgram.methods
      .fundLoan(new BN(LOAN_AMOUNT))
      .accounts({
        lender: lender.publicKey,
        loan: loanPda,
        funding: fundingPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([lender])
      .rpc();

    await lendingProgram.methods
      .disburseLoan()
      .accounts({
        borrower: borrower.publicKey,
        loan: loanPda,
        creditProfile: creditProfilePda,
        creditProgram: creditProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    const loanAfterDisburse = await lendingProgram.account.loanRequest.fetch(loanPda);
    assert.equal(loanStatusName(loanAfterDisburse.status), "active");

    const creditAfterDisburse = await creditProgram.account.creditProfile.fetch(creditProfilePda);
    assert.equal(creditAfterDisburse.totalLoans, 1);
    assert.equal(creditAfterDisburse.score, CREDIT_BASE_SCORE);

    await lendingProgram.methods
      .repayLoan(new BN(500_000))
      .accounts({
        borrower: borrower.publicKey,
        loan: loanPda,
        creditProfile: creditProfilePda,
        creditProgram: creditProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    const creditAfterPartial = await creditProgram.account.creditProfile.fetch(creditProfilePda);
    assert.equal(creditAfterPartial.score, CREDIT_BASE_SCORE + EARLY_REPAY_BONUS);

    const totalDue = LOAN_AMOUNT + calculateInterest(LOAN_AMOUNT, INTEREST_BPS, TENOR_DAYS);
    const finalRepayAmount = totalDue - 500_000;

    await lendingProgram.methods
      .repayLoan(new BN(finalRepayAmount))
      .accounts({
        borrower: borrower.publicKey,
        loan: loanPda,
        creditProfile: creditProfilePda,
        creditProgram: creditProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([borrower])
      .rpc();

    const loanAfterFullRepay = await lendingProgram.account.loanRequest.fetch(loanPda);
    assert.equal(loanStatusName(loanAfterFullRepay.status), "repaid");

    const creditAfterFullRepay = await creditProgram.account.creditProfile.fetch(creditProfilePda);
    const expectedFinalScore =
      CREDIT_BASE_SCORE + EARLY_REPAY_BONUS + EARLY_REPAY_BONUS + FIRST_LOAN_COMPLETION_BONUS;
    assert.equal(creditAfterFullRepay.loansRepaid, 1);
    assert.equal(creditAfterFullRepay.score, expectedFinalScore);
  });

  it("applies authority-based default penalty in credit program", async () => {
    await creditProgram.methods
      .updateScoreOnDefaultByAuthority()
      .accounts({
        authority: provider.wallet.publicKey,
        programAuthorityConfig: creditConfigPda,
        creditProfile: creditProfilePda,
      })
      .rpc();

    const creditAfterDefault = await creditProgram.account.creditProfile.fetch(creditProfilePda);
    const scoreBeforeDefault =
      CREDIT_BASE_SCORE + EARLY_REPAY_BONUS + EARLY_REPAY_BONUS + FIRST_LOAN_COMPLETION_BONUS;
    assert.equal(creditAfterDefault.score, scoreBeforeDefault - DEFAULT_PENALTY);
    assert.equal(creditAfterDefault.loansDefaulted, 1);
  });
});
