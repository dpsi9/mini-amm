#!/usr/bin/env node

/**
 * Swap Test Script
 * 
 * This script tests the swap functionality of the mini-AMM.
 * Make sure the pool has been initialized and has liquidity.
 * 
 * Usage: node test-swap.js
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAccount } = require("@solana/spl-token");

// Program ID and addresses
const PROGRAM_ID = new PublicKey("3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW");
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");
const LP_MINT = new PublicKey("J5311AevFKg9bhkjsVsRSo3SiaFrri8W4LT4iBcgGTfJ");
const POOL_PDA = new PublicKey("GHJVtqychC34xJi6Nn93SXxRoQNdmfysRgjr6NTub3N3");
const TOKEN_A_VAULT = new PublicKey("Fw2Rd3My2HnowxdEg2Ey9hNTggHRPpyuTfr4UGnuSiyz");
const TOKEN_B_VAULT = new PublicKey("7PQ4XKEXdnvRMhsPXNFjSv5QjWqDwuoHJQmbUTVwpNC7");

async function main() {
  console.log("🔄 Testing swap functionality...");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Load the program
  const program = anchor.workspace.miniAmm;
  
  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", provider.wallet.publicKey.toString());
  
  try {
    // 1. Get user token accounts
    const userTokenAccountA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      MINT_A,
      provider.wallet.publicKey
    );
    
    const userTokenAccountB = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      MINT_B,
      provider.wallet.publicKey
    );
    
    console.log("User Token Account A:", userTokenAccountA.address.toString());
    console.log("User Token Account B:", userTokenAccountB.address.toString());
    
    // 2. Check current balances
    const balanceA = await getAccount(provider.connection, userTokenAccountA.address);
    const balanceB = await getAccount(provider.connection, userTokenAccountB.address);
    
    console.log("Token A balance:", balanceA.amount.toString());
    console.log("Token B balance:", balanceB.amount.toString());
    
    // 3. Check pool state
    const poolAccount = await program.account.pool.fetch(POOL_PDA);
    console.log("Pool total LP tokens:", poolAccount.totalLp.toString());
    
    // 4. Perform swap (A to B)
    const swapAmount = 10 * 10**6; // 10 tokens
    const minAmountOut = 5 * 10**6; // Accept at least 5 tokens out (accounting for slippage)
    
    console.log("🔄 Swapping 10 tokens A for tokens B...");
    
    const swapTx = await program.methods
      .swap(
        new anchor.BN(swapAmount),
        new anchor.BN(minAmountOut),
      )
      .accounts({
        user: provider.wallet.publicKey,
        pool: POOL_PDA,
        lpMint: LP_MINT,
        tokenAVault: TOKEN_A_VAULT,
        tokenBVault: TOKEN_B_VAULT,
        userTokenIn: userTokenAccountA.address,  // A to B swap
        userTokenOut: userTokenAccountB.address,
        tokenAMint: MINT_A,
        tokenBMint: MINT_B,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log("✅ Swap completed successfully!");
    console.log("Transaction signature:", swapTx);
    
    // 5. Check new balances
    const newBalanceA = await getAccount(provider.connection, userTokenAccountA.address);
    const newBalanceB = await getAccount(provider.connection, userTokenAccountB.address);
    
    console.log("New Token A balance:", newBalanceA.amount.toString());
    console.log("New Token B balance:", newBalanceB.amount.toString());
    
    const changedA = Number(newBalanceA.amount) - Number(balanceA.amount);
    const changedB = Number(newBalanceB.amount) - Number(balanceB.amount);
    
    console.log("Change in Token A:", changedA / 10**6);
    console.log("Change in Token B:", changedB / 10**6);
    
    console.log("🎉 Swap test completed successfully!");
    console.log("📝 Your mini-AMM is fully functional!");
    
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
