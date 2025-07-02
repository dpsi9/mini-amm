use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::*;
use crate::constants::*;

pub fn process_initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    *ctx.accounts.pool = Pool {
        token_a_vault: ctx.accounts.token_a_vault.key(),
        token_b_vault: ctx.accounts.token_b_vault.key(),
        lp_mint: ctx.accounts.lp_mint.key(),
        total_lp: 0,
        bump: ctx.bumps.pool
    };
    Ok(())
}



#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Pool::INIT_SPACE,
        seeds = [SEED_POOL_ACCOUNT, lp_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = payer,
        token::mint = token_a_mint,
        token::authority = pool,
        seeds = [SEED_VAULT_A_ACCOUNT, lp_mint.key().as_ref()],
        bump
    )]
    pub token_a_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = payer,
        token::mint = token_b_mint,
        token::authority = pool,
        seeds = [SEED_VAULT_B_ACCOUNT, lp_mint.key().as_ref()],
        bump
    )]
    pub token_b_vault: InterfaceAccount<'info, TokenAccount>,
    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = pool
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}