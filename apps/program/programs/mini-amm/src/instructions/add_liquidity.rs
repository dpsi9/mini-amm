use crate::errors::ErrorCode;
use crate::utils::integer_sqrt;
use crate::{constants::*, state::Pool};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    self, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
};

pub fn process_add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    //2. Calculate LP to mint
    // first check that user provides both the tokens to liquidate
    require!(amount_a > 0 && amount_b > 0, ErrorCode::ZeroLiquidityInput);
    let lp_to_mint = if ctx.accounts.pool.total_lp == 0 {
        integer_sqrt(amount_a as u128 * amount_b as u128) as u64
    } else {
        let supply = ctx.accounts.lp_mint.supply;
        let vault_a = ctx.accounts.token_a_vault.amount;
        let vault_b = ctx.accounts.token_b_vault.amount;

        let lp_a = (amount_a as u128 * supply as u128 / vault_a as u128) as u64;
        let lp_b = (amount_b as u128 * supply as u128 / vault_b as u128) as u64;

        lp_a.min(lp_b)
    };
    // 1.transfer token from both user token accounts to both vault accounts
    token_interface::transfer_checked(
        ctx.accounts.transfer_liquidity(
            &ctx.accounts.user_token_a,
            &ctx.accounts.token_a_vault,
            &ctx.accounts.token_a_mint,
        ),
        amount_a,
        ctx.accounts.token_a_mint.decimals,
    )?;
    token_interface::transfer_checked(
        ctx.accounts.transfer_liquidity(
            &ctx.accounts.user_token_b,
            &ctx.accounts.token_b_vault,
            &ctx.accounts.token_b_mint,
        ),
        amount_b,
        ctx.accounts.token_b_mint.decimals,
    )?;

    require!(lp_to_mint > 0, ErrorCode::ZeroLpMint);
    //3. Mint lp tokens to user
    let lp_mint_key = ctx.accounts.lp_mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        SEED_POOL_ACCOUNT,
        lp_mint_key.as_ref(),
        &[ctx.accounts.pool.bump],
    ]];

    token_interface::mint_to(ctx.accounts.mint_to().with_signer(signer_seeds), lp_to_mint)?;

    //update pool total supply
    ctx.accounts.pool.total_lp = ctx
        .accounts
        .pool
        .total_lp
        .checked_add(lp_to_mint)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
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
        seeds =[SEED_LP_MINT_ACCOUNT, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump = pool.bump_lp_mint
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [SEED_VAULT_A_ACCOUNT, lp_mint.key().as_ref()],
        bump
    )]
    pub token_a_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [SEED_VAULT_B_ACCOUNT, lp_mint.key().as_ref()],
        bump
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

impl<'info> AddLiquidity<'info> {
    fn transfer_liquidity(
        &self,
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        mint: &InterfaceAccount<'info, Mint>,
    ) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            mint: mint.to_account_info(),
            from: from.to_account_info(),
            to: to.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }

    fn mint_to(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_mint.to_account_info(),
            to: self.user_lp_token_account.to_account_info(),
            authority: self.pool.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}
