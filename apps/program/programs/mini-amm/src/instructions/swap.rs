use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::{constants::*, errors::ErrorCode, state::Pool};

pub fn process_swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    // check the vault_in and vault_out(which vault will recieve tokens and which will give tokens)
    let (vault_in, vault_out, mint_in, mint_out) = if ctx.accounts.user_token_in.mint == ctx.accounts.token_a_vault.mint {
        (&ctx.accounts.token_a_vault, &ctx.accounts.token_b_vault, &ctx.accounts.token_a_mint, &ctx.accounts.token_b_mint)
    } else {
        (&ctx.accounts.token_b_vault, &ctx.accounts.token_a_vault, &ctx.accounts.token_b_mint, &ctx.accounts.token_a_mint)
    };

    let x = vault_in.amount as u128;
    let y = vault_out.amount as u128;
    let x_in = amount_in as u128;

    let x_in_after_fee = (x_in * 997)/ 1000;
    
    let x_new = x + x_in_after_fee;
    let k = x * y;
    let y_new = k / x_new;

    let amount_out = (y - y_new) as u64;

    require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);

    // transfer input from user to vault_in
    token_interface::transfer_checked(
        ctx.accounts.transfer_tokens(
            &ctx.accounts.user_token_in,
             &vault_in,
                ctx.accounts.user.to_account_info(),
                &mint_in
            )
        , amount_in, mint_in.decimals
    )?;

    // transfer output from vault_out to user
    let lp_mint_key = ctx.accounts.lp_mint.key();
    let signer_seeds: &[&[&[u8]]] = &[
        &[
            SEED_POOL_ACCOUNT,
            lp_mint_key.as_ref(),
            &[ctx.accounts.pool.bump],
        ]
    ];

    token_interface::transfer_checked(
        ctx.accounts.transfer_tokens(
            &vault_out,
            &ctx.accounts.user_token_out,
            ctx.accounts.pool.to_account_info(),
            &mint_out
        ).with_signer(signer_seeds),amount_out, mint_out.decimals
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
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
        bump
    )]
    pub token_a_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [SEED_VAULT_B_ACCOUNT, lp_mint.key().as_ref()],
        bump
    )]
    pub token_b_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token_in.owner == user.key() @ ErrorCode::InvalidTokenOwner,
        constraint = user_token_in.mint == token_a_mint.key() || user_token_in.mint == token_b_mint.key() @ ErrorCode::InvalidTokenMint,
    )]
    pub user_token_in: InterfaceAccount<'info, TokenAccount>,
    #[account(
    mut,
    constraint = user_token_out.owner == user.key() @ ErrorCode::InvalidTokenOwner,
    constraint = (user_token_out.mint == token_a_mint.key() ||   
                  user_token_out.mint == token_b_mint.key()) @ ErrorCode::InvalidTokenMint,
    constraint = user_token_in.mint != user_token_out.mint @ ErrorCode::InvalidSwapDirection
    )]
    pub user_token_out: InterfaceAccount<'info, TokenAccount>,
    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>
}

impl<'info> Swap<'info> {
    fn transfer_tokens(
        &self,
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        authority: AccountInfo<'info>,
        mint: &InterfaceAccount<'info, Mint>
    ) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        
        let cpi_accounts = TransferChecked {
            from: from.to_account_info(),
            to: to.to_account_info(),
            mint: mint.to_account_info(),
            authority
        };
        let cpi_program = self.token_program.to_account_info();

        CpiContext::new(cpi_program, cpi_accounts)
    }
}