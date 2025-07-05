#![allow(deprecated)]
#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

use instructions::*;
mod constants;
mod errors;
mod instructions;
mod state;
mod utils;
declare_id!("7wDDaaWhgmFcA2RgY8m9DGECAHF2RWNAU8bDwfwz79xd");

#[program]
pub mod mini_amm {
    use super::*;
    use crate::instructions::{process_initialize_pool, process_add_liquidity, process_remove_liquidity, process_swap};

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        process_initialize_pool(ctx)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_a: u64, amount_b: u64) -> Result<()> {
        process_add_liquidity(ctx, amount_a, amount_b)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, lp_burn: u64) -> Result<()> {
        process_remove_liquidity(ctx, lp_burn)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
        process_swap(ctx, amount_in, min_amount_out)
    }
}
