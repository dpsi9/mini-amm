use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The token account does not match the required minnt")]
    InvalidTokenMint,
    #[msg("The token account is not owned by the user")]
    InvalidTokenOwner,
    #[msg("Cannot add liquidity with zero amount for one of the tokens")]
    ZeroLiquidityInput,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Resulting LP amount is zero")]
    ZeroLpMint,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Input and output tokens must differ")]
    InvalidSwapDirection,
    #[msg("Output below slippage tolerance")]
    SlippageExceeded,
}
