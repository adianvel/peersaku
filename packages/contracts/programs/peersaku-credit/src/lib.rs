use anchor_lang::prelude::*;

declare_id!("58LeTSriTNYYvvrZotWGwercniqsAoNEovq9sr1AJXyF");

#[program]
pub mod peersaku_credit {
    use super::*;

    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        let config = &mut ctx.accounts.program_authority_config;
        config.authority = ctx.accounts.authority.key();
        config.bump = ctx.bumps.program_authority_config;

        Ok(())
    }

    pub fn initialize_profile(ctx: Context<InitializeProfile>, student_nft: Pubkey) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        profile.owner = ctx.accounts.owner.key();
        profile.student_nft = student_nft;
        profile.score = BASE_SCORE;
        profile.total_loans = 0;
        profile.loans_repaid = 0;
        profile.loans_defaulted = 0;
        profile.total_borrowed = 0;
        profile.total_repaid = 0;
        profile.on_time_payments = 0;
        profile.late_payments = 0;
        profile.last_updated = now;
        profile.bump = ctx.bumps.credit_profile;

        Ok(())
    }

    pub fn record_loan_started(ctx: Context<UpdateCreditProfile>, loan_amount: u64) -> Result<()> {
        require!(loan_amount > 0, CreditError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        profile.total_loans = profile
            .total_loans
            .checked_add(1)
            .ok_or(CreditError::MathOverflow)?;
        profile.total_borrowed = profile
            .total_borrowed
            .checked_add(loan_amount)
            .ok_or(CreditError::MathOverflow)?;
        profile.last_updated = now;

        Ok(())
    }

    pub fn update_score_on_repay(
        ctx: Context<UpdateCreditProfile>,
        repayment_amount: u64,
        paid_early: bool,
        loan_completed: bool,
    ) -> Result<()> {
        require!(repayment_amount > 0, CreditError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        let base_reward = if paid_early { EARLY_REPAY_BONUS } else { ON_TIME_REPAY_BONUS };
        let mut delta = base_reward as u32;

        profile.on_time_payments = profile
            .on_time_payments
            .checked_add(1)
            .ok_or(CreditError::MathOverflow)?;

        if loan_completed {
            profile.loans_repaid = profile
                .loans_repaid
                .checked_add(1)
                .ok_or(CreditError::MathOverflow)?;

            if profile.loans_repaid == 1 {
                delta = delta
                    .checked_add(FIRST_LOAN_COMPLETION_BONUS as u32)
                    .ok_or(CreditError::MathOverflow)?;
            }

            if profile.loans_repaid % 5 == 0 {
                delta = delta
                    .checked_add(FIVE_LOANS_COMPLETION_BONUS as u32)
                    .ok_or(CreditError::MathOverflow)?;
            }
        }

        profile.total_repaid = profile
            .total_repaid
            .checked_add(repayment_amount)
            .ok_or(CreditError::MathOverflow)?;
        profile.score = increase_score(profile.score, delta as u16)?;
        profile.last_updated = now;

        Ok(())
    }

    pub fn update_score_on_late_payment(
        ctx: Context<UpdateCreditProfile>,
        days_late: u8,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        let penalty = if (1..=7).contains(&days_late) {
            LATE_1_TO_7_DAYS_PENALTY
        } else if (8..=30).contains(&days_late) {
            LATE_8_TO_30_DAYS_PENALTY
        } else {
            return err!(CreditError::InvalidLateDays);
        };

        profile.late_payments = profile
            .late_payments
            .checked_add(1)
            .ok_or(CreditError::MathOverflow)?;
        profile.score = decrease_score(profile.score, penalty)?;
        profile.last_updated = now;

        Ok(())
    }

    pub fn update_score_on_default(ctx: Context<UpdateCreditProfile>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        apply_default_penalty(profile, now)?;

        Ok(())
    }

    pub fn update_score_on_default_by_authority(
        ctx: Context<UpdateCreditProfileByAuthority>,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.credit_profile;

        apply_default_penalty(profile, now)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramAuthorityConfig::INIT_SPACE,
        seeds = [b"credit_config"],
        bump
    )]
    pub program_authority_config: Account<'info, ProgramAuthorityConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + CreditProfile::INIT_SPACE,
        seeds = [b"credit_profile", owner.key().as_ref()],
        bump
    )]
    pub credit_profile: Account<'info, CreditProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCreditProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        has_one = owner,
        seeds = [b"credit_profile", owner.key().as_ref()],
        bump = credit_profile.bump
    )]
    pub credit_profile: Account<'info, CreditProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCreditProfileByAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"credit_config"],
        bump = program_authority_config.bump,
        constraint = program_authority_config.authority == authority.key() @ CreditError::Unauthorized
    )]
    pub program_authority_config: Account<'info, ProgramAuthorityConfig>,
    #[account(mut)]
    pub credit_profile: Account<'info, CreditProfile>,
}

#[account]
#[derive(InitSpace)]
pub struct ProgramAuthorityConfig {
    pub authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CreditProfile {
    pub owner: Pubkey,
    pub student_nft: Pubkey,
    pub score: u16,
    pub total_loans: u16,
    pub loans_repaid: u16,
    pub loans_defaulted: u16,
    pub total_borrowed: u64,
    pub total_repaid: u64,
    pub on_time_payments: u16,
    pub late_payments: u16,
    pub last_updated: i64,
    pub bump: u8,
}

const MIN_SCORE: u16 = 0;
const MAX_SCORE: u16 = 1_000;
const BASE_SCORE: u16 = 500;

const ON_TIME_REPAY_BONUS: u16 = 15;
const EARLY_REPAY_BONUS: u16 = 25;
const FIRST_LOAN_COMPLETION_BONUS: u16 = 50;
const FIVE_LOANS_COMPLETION_BONUS: u16 = 30;

const LATE_1_TO_7_DAYS_PENALTY: u16 = 10;
const LATE_8_TO_30_DAYS_PENALTY: u16 = 30;
const DEFAULT_PENALTY: u16 = 100;

fn increase_score(current: u16, delta: u16) -> Result<u16> {
    let increased = current
        .checked_add(delta)
        .ok_or(CreditError::MathOverflow)?;
    Ok(increased.min(MAX_SCORE))
}

fn decrease_score(current: u16, delta: u16) -> Result<u16> {
    let decreased = current.saturating_sub(delta);
    Ok(decreased.max(MIN_SCORE))
}

fn apply_default_penalty(profile: &mut CreditProfile, now: i64) -> Result<()> {
    profile.loans_defaulted = profile
        .loans_defaulted
        .checked_add(1)
        .ok_or(CreditError::MathOverflow)?;
    profile.score = decrease_score(profile.score, DEFAULT_PENALTY)?;
    profile.last_updated = now;

    Ok(())
}

#[error_code]
pub enum CreditError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Late days must be in range 1-30")]
    InvalidLateDays,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Only authorized program authority can execute this instruction")]
    Unauthorized,
}
