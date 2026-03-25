use anchor_lang::prelude::*;
use peersaku_credit::{self, program::PeersakuCredit};

declare_id!("Gf97wGLR8bKDH19uMMYJzaon6T9GCwgtpzxp7yUYHz68");

#[program]
pub mod peersaku_lending {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, platform_fee_bps: u16) -> Result<()> {
        require!(
            platform_fee_bps <= MAX_PLATFORM_FEE_BPS,
            LendingError::InvalidPlatformFee
        );

        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.payer.key();
        config.platform_fee_bps = platform_fee_bps;
        config.bump = ctx.bumps.config;

        Ok(())
    }

    pub fn create_loan(
        ctx: Context<CreateLoan>,
        loan_seed: u64,
        amount: u64,
        interest_rate_bps: u16,
        tenor_days: u16,
        total_repayments: u8,
        purpose: String,
    ) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);
        require!(
            interest_rate_bps >= MIN_INTEREST_BPS && interest_rate_bps <= MAX_INTEREST_BPS,
            LendingError::InvalidInterestRate
        );
        require!(tenor_days > 0, LendingError::InvalidTenor);
        require!(total_repayments > 0, LendingError::InvalidRepaymentSchedule);
        require!(
            purpose.len() <= LoanRequest::MAX_PURPOSE_LEN,
            LendingError::PurposeTooLong
        );

        let now = Clock::get()?.unix_timestamp;
        let loan = &mut ctx.accounts.loan;

        loan.loan_seed = loan_seed;
        loan.borrower = ctx.accounts.borrower.key();
        loan.amount = amount;
        loan.funded_amount = 0;
        loan.total_repaid_amount = 0;
        loan.interest_rate_bps = interest_rate_bps;
        loan.tenor_days = tenor_days;
        loan.purpose = purpose;
        loan.status = LoanStatus::Pending;
        loan.created_at = now;
        loan.funded_at = None;
        loan.disbursed_at = None;
        loan.next_repayment = None;
        loan.repayments_made = 0;
        loan.total_repayments = total_repayments;
        loan.bump = ctx.bumps.loan;

        emit!(LoanCreatedEvent {
            loan: loan.key(),
            borrower: loan.borrower,
            amount: loan.amount,
            interest_rate_bps: loan.interest_rate_bps,
            tenor_days: loan.tenor_days,
        });

        Ok(())
    }

    pub fn fund_loan(ctx: Context<FundLoan>, amount: u64) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        let loan = &mut ctx.accounts.loan;

        require!(loan.status == LoanStatus::Pending, LendingError::LoanNotFundable);

        let updated_funded = loan
            .funded_amount
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;

        require!(updated_funded <= loan.amount, LendingError::OverFunding);

        let funding = &mut ctx.accounts.funding;
        if funding.loan == Pubkey::default() {
            funding.loan = loan.key();
            funding.lender = ctx.accounts.lender.key();
            funding.amount = 0;
            funding.expected_return = 0;
            funding.returned_amount = 0;
            funding.funded_at = now;
            funding.bump = ctx.bumps.funding;
        }

        funding.amount = funding
            .amount
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;

        let expected_return_increment = amount
            .checked_add(calculate_interest(amount, loan.interest_rate_bps, loan.tenor_days)?)
            .ok_or(LendingError::MathOverflow)?;

        funding.expected_return = funding
            .expected_return
            .checked_add(expected_return_increment)
            .ok_or(LendingError::MathOverflow)?;

        loan.funded_amount = updated_funded;
        if loan.funded_amount == loan.amount {
            loan.status = LoanStatus::Funded;
            loan.funded_at = Some(now);
        }

        emit!(LoanFundedEvent {
            loan: loan.key(),
            lender: ctx.accounts.lender.key(),
            amount,
            total_funded: loan.funded_amount,
            fully_funded: loan.status == LoanStatus::Funded,
        });

        Ok(())
    }

    pub fn disburse_loan(ctx: Context<DisburseLoan>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let loan = &mut ctx.accounts.loan;

        require!(loan.status == LoanStatus::Funded, LendingError::LoanNotReadyToDisburse);

        let installment_interval_secs = (loan.tenor_days as i64 * ONE_DAY_SECONDS)
            .checked_div(loan.total_repayments as i64)
            .ok_or(LendingError::MathOverflow)?;

        loan.status = LoanStatus::Active;
        loan.disbursed_at = Some(now);
        loan.next_repayment = Some(
            now.checked_add(installment_interval_secs)
                .ok_or(LendingError::MathOverflow)?,
        );

        let cpi_program = ctx.accounts.credit_program.to_account_info();
        let cpi_accounts = peersaku_credit::cpi::accounts::UpdateCreditProfile {
            owner: ctx.accounts.borrower.to_account_info(),
            credit_profile: ctx.accounts.credit_profile.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        peersaku_credit::cpi::record_loan_started(cpi_ctx, loan.amount)?;

        emit!(LoanDisbursedEvent {
            loan: loan.key(),
            borrower: loan.borrower,
            disbursed_at: now,
        });

        Ok(())
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, amount: u64) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        let loan = &mut ctx.accounts.loan;

        require!(loan.status == LoanStatus::Active, LendingError::LoanNotActive);

        loan.total_repaid_amount = loan
            .total_repaid_amount
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;
        loan.repayments_made = loan
            .repayments_made
            .checked_add(1)
            .ok_or(LendingError::MathOverflow)?;

        let total_due = loan
            .amount
            .checked_add(calculate_interest(loan.amount, loan.interest_rate_bps, loan.tenor_days)?)
            .ok_or(LendingError::MathOverflow)?;

        let paid_early = loan
            .next_repayment
            .map(|due| now + ONE_DAY_SECONDS < due)
            .unwrap_or(false);

        let fully_repaid = loan.total_repaid_amount >= total_due;

        let cpi_program = ctx.accounts.credit_program.to_account_info();
        let cpi_accounts = peersaku_credit::cpi::accounts::UpdateCreditProfile {
            owner: ctx.accounts.borrower.to_account_info(),
            credit_profile: ctx.accounts.credit_profile.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        peersaku_credit::cpi::update_score_on_repay(cpi_ctx, amount, paid_early, fully_repaid)?;

        if fully_repaid {
            loan.status = LoanStatus::Repaid;
            loan.next_repayment = None;

            emit!(LoanRepaidEvent {
                loan: loan.key(),
                borrower: loan.borrower,
                amount,
                total_repaid: loan.total_repaid_amount,
                fully_repaid: true,
            });
            return Ok(());
        }

        let installment_interval_secs = (loan.tenor_days as i64 * ONE_DAY_SECONDS)
            .checked_div(loan.total_repayments as i64)
            .ok_or(LendingError::MathOverflow)?;

        loan.next_repayment = Some(
            now.checked_add(installment_interval_secs)
                .ok_or(LendingError::MathOverflow)?,
        );

        emit!(LoanRepaidEvent {
            loan: loan.key(),
            borrower: loan.borrower,
            amount,
            total_repaid: loan.total_repaid_amount,
            fully_repaid: false,
        });

        Ok(())
    }

    pub fn cancel_loan(ctx: Context<CancelLoan>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;

        require!(loan.status == LoanStatus::Pending, LendingError::LoanNotCancellable);
        require!(loan.funded_amount == 0, LendingError::LoanAlreadyFunded);

        loan.status = LoanStatus::Cancelled;

        emit!(LoanCancelledEvent {
            loan: loan.key(),
            borrower: loan.borrower,
        });

        Ok(())
    }

    pub fn mark_default(ctx: Context<MarkDefault>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let loan = &mut ctx.accounts.loan;

        require!(loan.status == LoanStatus::Active, LendingError::LoanNotActive);
        let next_repayment = loan
            .next_repayment
            .ok_or(LendingError::MissingRepaymentSchedule)?;

        let default_threshold = next_repayment
            .checked_add(DEFAULT_GRACE_PERIOD_SECONDS)
            .ok_or(LendingError::MathOverflow)?;
        require!(now >= default_threshold, LendingError::GracePeriodNotElapsed);

        loan.status = LoanStatus::Defaulted;
        loan.next_repayment = None;

        let cpi_program = ctx.accounts.credit_program.to_account_info();
        let cpi_accounts = peersaku_credit::cpi::accounts::UpdateCreditProfileByAuthority {
            authority: ctx.accounts.admin.to_account_info(),
            program_authority_config: ctx.accounts.credit_program_authority_config.to_account_info(),
            credit_profile: ctx.accounts.credit_profile.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        peersaku_credit::cpi::update_score_on_default_by_authority(cpi_ctx)?;

        emit!(LoanDefaultedEvent {
            loan: loan.key(),
            borrower: loan.borrower,
            defaulted_at: now,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(loan_seed: u64)]
pub struct CreateLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(
        init,
        payer = borrower,
        space = 8 + LoanRequest::INIT_SPACE,
        seeds = [b"loan", borrower.key().as_ref(), &loan_seed.to_le_bytes()],
        bump
    )]
    pub loan: Account<'info, LoanRequest>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundLoan<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", loan.borrower.as_ref(), &loan.loan_seed.to_le_bytes()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanRequest>,
    #[account(
        init_if_needed,
        payer = lender,
        space = 8 + LoanFunding::INIT_SPACE,
        seeds = [b"funding", loan.key().as_ref(), lender.key().as_ref()],
        bump
    )]
    pub funding: Account<'info, LoanFunding>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DisburseLoan<'info> {
    #[account(mut, address = loan.borrower)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", loan.borrower.as_ref(), &loan.loan_seed.to_le_bytes()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanRequest>,
    #[account(
        mut,
        constraint = credit_profile.owner == borrower.key() @ LendingError::CreditProfileOwnerMismatch
    )]
    pub credit_profile: Account<'info, peersaku_credit::CreditProfile>,
    pub credit_program: Program<'info, PeersakuCredit>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut, address = loan.borrower)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", loan.borrower.as_ref(), &loan.loan_seed.to_le_bytes()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanRequest>,
    #[account(
        mut,
        constraint = credit_profile.owner == borrower.key() @ LendingError::CreditProfileOwnerMismatch
    )]
    pub credit_profile: Account<'info, peersaku_credit::CreditProfile>,
    pub credit_program: Program<'info, PeersakuCredit>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelLoan<'info> {
    #[account(mut, address = loan.borrower)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", loan.borrower.as_ref(), &loan.loan_seed.to_le_bytes()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanRequest>,
}

#[derive(Accounts)]
pub struct MarkDefault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ LendingError::Unauthorized
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        mut,
        seeds = [b"loan", loan.borrower.as_ref(), &loan.loan_seed.to_le_bytes()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanRequest>,
    #[account(
        mut,
        constraint = credit_profile.owner == loan.borrower @ LendingError::CreditProfileOwnerMismatch
    )]
    pub credit_profile: Account<'info, peersaku_credit::CreditProfile>,
    pub credit_program: Program<'info, PeersakuCredit>,
    #[account(
        seeds = [b"credit_config"],
        bump = credit_program_authority_config.bump,
        constraint = credit_program_authority_config.authority == admin.key() @ LendingError::Unauthorized
    )]
    pub credit_program_authority_config: Account<'info, peersaku_credit::ProgramAuthorityConfig>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub platform_fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LoanRequest {
    pub loan_seed: u64,
    pub borrower: Pubkey,
    pub amount: u64,
    pub funded_amount: u64,
    pub total_repaid_amount: u64,
    pub interest_rate_bps: u16,
    pub tenor_days: u16,
    #[max_len(160)]
    pub purpose: String,
    pub status: LoanStatus,
    pub created_at: i64,
    pub funded_at: Option<i64>,
    pub disbursed_at: Option<i64>,
    pub next_repayment: Option<i64>,
    pub repayments_made: u8,
    pub total_repayments: u8,
    pub bump: u8,
}

impl LoanRequest {
    pub const MAX_PURPOSE_LEN: usize = 160;
}

#[account]
#[derive(InitSpace)]
pub struct LoanFunding {
    pub loan: Pubkey,
    pub lender: Pubkey,
    pub amount: u64,
    pub expected_return: u64,
    pub returned_amount: u64,
    pub funded_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum LoanStatus {
    Pending,
    Funded,
    Active,
    Repaid,
    Defaulted,
    Cancelled,
}

const ONE_DAY_SECONDS: i64 = 86_400;
const DEFAULT_GRACE_PERIOD_SECONDS: i64 = 30 * ONE_DAY_SECONDS;
const MIN_INTEREST_BPS: u16 = 800;
const MAX_INTEREST_BPS: u16 = 2_000;
const MAX_PLATFORM_FEE_BPS: u16 = 500;

fn calculate_interest(principal: u64, interest_rate_bps: u16, tenor_days: u16) -> Result<u64> {
    let numerator = (principal as u128)
        .checked_mul(interest_rate_bps as u128)
        .ok_or(LendingError::MathOverflow)?
        .checked_mul(tenor_days as u128)
        .ok_or(LendingError::MathOverflow)?;

    let denominator = 10_000_u128
        .checked_mul(365_u128)
        .ok_or(LendingError::MathOverflow)?;

    Ok(numerator
        .checked_div(denominator)
        .ok_or(LendingError::MathOverflow)? as u64)
}

#[error_code]
pub enum LendingError {
    #[msg("Loan amount must be greater than zero")]
    InvalidAmount,
    #[msg("Interest rate is outside allowed range")]
    InvalidInterestRate,
    #[msg("Tenor must be greater than zero")]
    InvalidTenor,
    #[msg("Repayment schedule must have at least one installment")]
    InvalidRepaymentSchedule,
    #[msg("Purpose exceeds maximum allowed length")]
    PurposeTooLong,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Loan is not fundable")]
    LoanNotFundable,
    #[msg("Funding amount exceeds requested loan amount")]
    OverFunding,
    #[msg("Loan is not ready for disbursement")]
    LoanNotReadyToDisburse,
    #[msg("Loan is not active")]
    LoanNotActive,
    #[msg("Loan is not cancellable")]
    LoanNotCancellable,
    #[msg("Loan already has funding")]
    LoanAlreadyFunded,
    #[msg("Only protocol admin can execute this instruction")]
    Unauthorized,
    #[msg("Repayment schedule is missing")]
    MissingRepaymentSchedule,
    #[msg("Default grace period has not elapsed")]
    GracePeriodNotElapsed,
    #[msg("Invalid platform fee")]
    InvalidPlatformFee,
    #[msg("Credit profile owner does not match borrower")]
    CreditProfileOwnerMismatch,
}

#[event]
pub struct LoanCreatedEvent {
    pub loan: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub interest_rate_bps: u16,
    pub tenor_days: u16,
}

#[event]
pub struct LoanFundedEvent {
    pub loan: Pubkey,
    pub lender: Pubkey,
    pub amount: u64,
    pub total_funded: u64,
    pub fully_funded: bool,
}

#[event]
pub struct LoanDisbursedEvent {
    pub loan: Pubkey,
    pub borrower: Pubkey,
    pub disbursed_at: i64,
}

#[event]
pub struct LoanRepaidEvent {
    pub loan: Pubkey,
    pub borrower: Pubkey,
    pub amount: u64,
    pub total_repaid: u64,
    pub fully_repaid: bool,
}

#[event]
pub struct LoanCancelledEvent {
    pub loan: Pubkey,
    pub borrower: Pubkey,
}

#[event]
pub struct LoanDefaultedEvent {
    pub loan: Pubkey,
    pub borrower: Pubkey,
    pub defaulted_at: i64,
}
