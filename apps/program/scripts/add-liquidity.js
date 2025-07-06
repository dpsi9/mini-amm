#!/usr/bin/env node

/**
 * Add Liquidity Script
 * 
 * This script adds liquidity to the initialized pool.
 * Make sure the pool has been initialized first.
 * 
 * Usage: node add-liquidity.js
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, mintTo, getAccount } = require("@solana/spl-token");

// Program ID and addresses
const PROGRAM_ID = new PublicKey("3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW");
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");
const LP_MINT = new PublicKey("J5311AevFKg9bhkjsVsRSo3SiaFrri8W4LT4iBcgGTfJ");
const POOL_PDA = new PublicKey("GHJVtqychC34xJi6Nn93SXxRoQNdmfysRgjr6NTub3N3");
const TOKEN_A_VAULT = new PublicKey("Fw2Rd3My2HnowxdEg2Ey9hNTggHRPpyuTfr4UGnuSiyz");
const TOKEN_B_VAULT = new PublicKey("7PQ4XKEXdnvRMhsPXNFjSv5QjWqDwuoHJQmbUTVwpNC7");

async function main() {
  console.log("💧 Adding liquidity to pool...");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Load the program
  const program = anchor.workspace.miniAmm;
  
  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", provider.wallet.publicKey.toString());
  
  try {
    // 1. Get or create user token accounts
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
    
    const userLpTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      LP_MINT,
      provider.wallet.publicKey
    );
    
    console.log("User Token Account A:", userTokenAccountA.address.toString());
    console.log("User Token Account B:", userTokenAccountB.address.toString());
    console.log("User LP Token Account:", userLpTokenAccount.address.toString());
    
    // 2. Define liquidity amount
    const liquidityAmount = 100 * 10**6; // 100 tokens
    
    // 3. Check current balances
    const balanceA = await getAccount(provider.connection, userTokenAccountA.address);
    const balanceB = await getAccount(provider.connection, userTokenAccountB.address);
    const balanceLP = await getAccount(provider.connection, userLpTokenAccount.address);
    
    console.log("Token A balance:", balanceA.amount.toString());
    console.log("Token B balance:", balanceB.amount.toString());
    console.log("LP token balance:", balanceLP.amount.toString());
    
    // 3. Check if we have enough tokens
    console.log("Checking token balances...");
    
    if (balanceA.amount < BigInt(liquidityAmount) || balanceB.amount < BigInt(liquidityAmount)) {
      console.log("❌ Insufficient token balance!");
      console.log(`Need at least ${liquidityAmount / 10**6} tokens A and B`);
      console.log(`Current: ${balanceA.amount.toString() / 10**6} A, ${balanceB.amount.toString() / 10**6} B`);
      return;
    }
    
    // 4. Add liquidity
    console.log("💧 Adding liquidity...");
    
    const addLiquidityTx = await program.methods
      .addLiquidity(
        new anchor.BN(liquidityAmount), // amount A
        new anchor.BN(liquidityAmount), // amount B
      )
      .accounts({
        user: provider.wallet.publicKey,
        pool: POOL_PDA,
        lpMint: LP_MINT,
        tokenAVault: TOKEN_A_VAULT,
        tokenBVault: TOKEN_B_VAULT,
        tokenAMint: MINT_A,
        tokenBMint: MINT_B,
        userTokenA: userTokenAccountA.address,
        userTokenB: userTokenAccountB.address,
        userLpTokenAccount: userLpTokenAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log("✅ Liquidity added successfully!");
    console.log("Transaction signature:", addLiquidityTx);
    
    // 5. Check new balances
    const newBalanceA = await getAccount(provider.connection, userTokenAccountA.address);
    const newBalanceB = await getAccount(provider.connection, userTokenAccountB.address);
    const newBalanceLP = await getAccount(provider.connection, userLpTokenAccount.address);
    
    console.log("New Token A balance:", newBalanceA.amount.toString());
    console.log("New Token B balance:", newBalanceB.amount.toString());
    console.log("New LP token balance:", newBalanceLP.amount.toString());
    
    // 6. Check pool state
    const poolAccount = await program.account.pool.fetch(POOL_PDA);
    console.log("Pool total LP tokens:", poolAccount.totalLp.toString());
    
    console.log("🎉 Liquidity added successfully!");
    console.log("📝 Pool is now ready for swaps!");
    
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
