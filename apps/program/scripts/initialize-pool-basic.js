#!/usr/bin/env node

/**
 * Pool Initialization Script
 * 
 * This script initializes the mini-AMM pool and adds initial liquidity.
 * Run this script after deploying the program.
 * 
 * Usage: node initialize-pool-basic.js
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

// Program ID
const PROGRAM_ID = new PublicKey("3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW");

// Token mint addresses
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");

async function main() {
  console.log("🚀 Starting pool initialization...");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Load the program
  const program = anchor.workspace.miniAmm;
  
  console.log("Program ID:", program.programId.toString());
  console.log("Wallet:", provider.wallet.publicKey.toString());
  
  try {
    // 1. Derive LP mint PDA
    const [lpMintPda, lpMintBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lp_mint"),
        MINT_A.toBuffer(),
        MINT_B.toBuffer()
      ],
      program.programId
    );
    
    console.log("LP Mint PDA:", lpMintPda.toString());
    
    // 2. Derive pool PDA
    const [poolPda, poolBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        lpMintPda.toBuffer()
      ],
      program.programId
    );
    
    console.log("Pool PDA:", poolPda.toString());
    
    // 3. Check if pool exists
    try {
      const poolAccount = await program.account.pool.fetch(poolPda);
      console.log("✅ Pool already exists!");
      console.log("Pool details:", {
        tokenAVault: poolAccount.tokenAVault.toString(),
        tokenBVault: poolAccount.tokenBVault.toString(),
        lpMint: poolAccount.lpMint.toString(),
        totalLp: poolAccount.totalLp.toString()
      });
      
      // Pool exists, but we can still add liquidity
      console.log("Pool is ready for liquidity and swaps!");
      return;
    } catch (error) {
      console.log("Pool doesn't exist yet, creating...");
    }
    
    // 4. Derive vault PDAs
    const [tokenAVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_a"),
        lpMintPda.toBuffer()
      ],
      program.programId
    );
    
    const [tokenBVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_b"),
        lpMintPda.toBuffer()
      ],
      program.programId
    );
    
    console.log("Token A Vault PDA:", tokenAVaultPda.toString());
    console.log("Token B Vault PDA:", tokenBVaultPda.toString());
    
    // 5. Initialize pool
    console.log("🏊 Initializing pool...");
    
    const initializeTx = await program.methods
      .initializePool()
      .accounts({
        payer: provider.wallet.publicKey,
        pool: poolPda,
        tokenAVault: tokenAVaultPda,
        tokenBVault: tokenBVaultPda,
        tokenAMint: MINT_A,
        tokenBMint: MINT_B,
        lpMint: lpMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log("✅ Pool initialized successfully!");
    console.log("Transaction signature:", initializeTx);
    
    // 6. Fetch and display pool details
    const poolAccount = await program.account.pool.fetch(poolPda);
    console.log("Pool details:", {
      tokenAVault: poolAccount.tokenAVault.toString(),
      tokenBVault: poolAccount.tokenBVault.toString(),
      lpMint: poolAccount.lpMint.toString(),
      totalLp: poolAccount.totalLp.toString()
    });
    
    console.log("🎉 Pool initialization completed!");
    console.log("📝 Next steps:");
    console.log("1. Use the frontend to add liquidity");
    console.log("2. Use the frontend to perform swaps");
    console.log("3. Or use the CLI commands for testing");
    
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
