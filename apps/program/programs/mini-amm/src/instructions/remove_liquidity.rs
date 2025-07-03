use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, BurnChecked, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::{constants::*, state::Pool, errors::ErrorCode};

pub fn process_remove_liquidity(ctx: Context<RemoveLiquidity>, lp_burn: u64) -> Result<()> {
    let supply = ctx.accounts.lp_mint.supply;
    require!(lp_burn <= supply, ErrorCode::InvalidAmount); // check if lp to burn does not exceed the total lp
    require!(lp_burn <= ctx.accounts.user_lp_token_account.amount, ErrorCode::InvalidAmount); // if user has the lp he want's to burn

    // Calculate amount of token A, B to transfer
    let amount_a = ((ctx.accounts.token_a_vault.amount as u128 * lp_burn as u128) / supply as u128 ) as u64;
    let amount_b  = ((ctx.accounts.token_b_vault.amount as u128 * lp_burn as u128) / supply as u128) as u64;

    // burn the lp
    token_interface::burn_checked(ctx.accounts.burn_lp(), lp_burn, ctx.accounts.lp_mint.decimals)?;

    let lp_mint_key = ctx.accounts.lp_mint.key();
    let pool_signer_seeds: &[&[&[u8]]] = &[
        &[
            SEED_POOL_ACCOUNT,
            lp_mint_key.as_ref(),
            &[ctx.accounts.pool.bump]
        ]
    ];

    // transfer token A out
    token_interface::transfer_checked(
        ctx.accounts.transfer_tokens(
        &ctx.accounts.token_a_vault,
         &ctx.accounts.user_token_a,
          &ctx.accounts.token_a_mint
         ).with_signer(pool_signer_seeds), amount_a, ctx.accounts.token_a_mint.decimals)?;

    // transfer token A out
    token_interface::transfer_checked(
        ctx.accounts.transfer_tokens(
        &ctx.accounts.token_b_vault,
         &ctx.accounts.user_token_b,
          &ctx.accounts.token_b_mint
        ).with_signer(pool_signer_seeds), amount_b, ctx.accounts.token_b_mint.decimals)?;
    
    ctx.accounts.pool.total_lp  = ctx.accounts.pool.total_lp.checked_sub(lp_burn).ok_or(ErrorCode::MathOverflow)?;
    Ok(())

}


#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut, 
        has_one = token_a_vault,
        has_one = token_b_vault,
        has_one = lp_mint,
        seeds = [SEED_POOL_ACCOUNT, lp_mint.key().as_ref()],
        bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,
    #[account(
        mut,
        seeds = [SEED_LP_MINT_ACCOUNT, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump = pool.bump_lp_mint
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [SEED_VAULT_A_ACCOUNT, lp_mint.key().as_ref()],
        bump //consider adding it from pool
    )]
        pub token_a_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [SEED_VAULT_B_ACCOUNT, lp_mint.key().as_ref()],
        bump // consider adding it from pool
    )]
    pub token_b_vault: InterfaceAccount<'info, TokenAccount>,
    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        constraint = user_token_a.mint == token_a_mint.key() @ ErrorCode::InvalidTokenMint,
        constraint = user_token_a.owner == user.key() @ ErrorCode::InvalidTokenOwner
    )]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_b.mint == token_b_mint.key() @ ErrorCode::InvalidTokenMint,
        constraint = user_token_b.owner == user.key() @ ErrorCode::InvalidTokenOwner
    )]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_lp_token_account.mint == lp_mint.key() @ ErrorCode::InvalidTokenMint,
        constraint = user_lp_token_account.owner == user.key() @ ErrorCode::InvalidTokenOwner
    )]
    pub user_lp_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> RemoveLiquidity<'info> {
    fn burn_lp(&self) -> CpiContext<'_, '_, '_, 'info, BurnChecked<'info>> {
        let cpi_accounts = BurnChecked {
            mint: self.lp_mint.to_account_info(),
            from: self.user_lp_token_account.to_account_info(),
            authority: self.user.to_account_info()
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn transfer_tokens(
        &self,
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        mint: &InterfaceAccount<'info, Mint>,
    ) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: from.to_account_info(),
            to: to.to_account_info(),
            mint: mint.to_account_info(),
            authority: self.pool.to_account_info()
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}