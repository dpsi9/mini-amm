import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  Connection, 
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { MiniAmm } from "../target/types/mini_amm";

// Program ID
const PROGRAM_ID = new PublicKey("3i6Xy9tVvVLB5LdYeAe3irwTTdzrHRNw7MC4qijcNVBW");

// Existing mint addresses from mint-addresses.txt
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");

async function main() {
  // Setup
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = new Program(
    require("../target/idl/mini_amm.json"),
    provider
  ) as Program<MiniAmm>;
  
  const connection = provider.connection;
  const wallet = provider.wallet;
  
  console.log("🚀 Starting pool initialization...");
  console.log("Wallet:", wallet.publicKey.toString());
  console.log("Program ID:", PROGRAM_ID.toString());
  
  try {
    // 1. Derive LP mint PDA first (needed for pool PDA)
    const [lpMintPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lp_mint"),
        MINT_A.toBuffer(),
        MINT_B.toBuffer()
      ],
      PROGRAM_ID
    );
    
    console.log("LP Mint PDA:", lpMintPda.toString());
    
    // 2. Derive pool PDA (seeds with lp_mint)
    const [poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        lpMintPda.toBuffer()
      ],
      PROGRAM_ID
    );
    
    console.log("Pool PDA:", poolPda.toString());
    
    // 3. Check if pool already exists
    try {
      const poolAccount = await program.account.pool.fetch(poolPda);
      console.log("✅ Pool already exists!");
      console.log("Pool details:", {
        tokenAVault: poolAccount.tokenAVault.toString(),
        tokenBVault: poolAccount.tokenBVault.toString(),
        lpMint: poolAccount.lpMint.toString(),
        totalLp: poolAccount.totalLp.toString()
      });
      
      // If pool exists, let's add liquidity
      await addLiquidity(program, poolPda, lpMintPda);
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
      PROGRAM_ID
    );
    
    const [tokenBVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_b"),
        lpMintPda.toBuffer()
      ],
      PROGRAM_ID
    );
    
    console.log("Token A Vault PDA:", tokenAVaultPda.toString());
    console.log("Token B Vault PDA:", tokenBVaultPda.toString());
    
    // 5. Get or create user token accounts
    const userTokenAccountA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      MINT_A,
      wallet.publicKey
    );
    
    const userTokenAccountB = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      MINT_B,
      wallet.publicKey
    );
    
    console.log("User Token Account A:", userTokenAccountA.address.toString());
    console.log("User Token Account B:", userTokenAccountB.address.toString());
    
    // 6. Check token balances
    const balanceA = await getAccount(connection, userTokenAccountA.address);
    const balanceB = await getAccount(connection, userTokenAccountB.address);
    
    console.log("Token A balance:", balanceA.amount.toString());
    console.log("Token B balance:", balanceB.amount.toString());
    
    // 7. If no tokens, mint some for testing
    if (balanceA.amount === BigInt(0) || balanceB.amount === BigInt(0)) {
      console.log("🪙 Minting tokens for testing...");
      
      if (balanceA.amount === BigInt(0)) {
        await mintTo(
          connection,
          wallet.payer,
          MINT_A,
          userTokenAccountA.address,
          wallet.payer,
          1000 * 10**6 // 1000 tokens with 6 decimals
        );
        console.log("✅ Minted 1000 tokens A");
      }
      
      if (balanceB.amount === BigInt(0)) {
        await mintTo(
          connection,
          wallet.payer,
          MINT_B,
          userTokenAccountB.address,
          wallet.payer,
          1000 * 10**6 // 1000 tokens with 6 decimals
        );
        console.log("✅ Minted 1000 tokens B");
      }
    }
    
    // 8. Initialize pool
    console.log("🏊 Initializing pool...");
    
    const initializeTx = await program.methods
      .initializePool()
      .accounts({
        payer: wallet.publicKey,
        tokenAMint: MINT_A,
        tokenBMint: MINT_B,
      })
      .rpc();
    
    console.log("✅ Pool initialized! Transaction:", initializeTx);
    
    // 9. Add initial liquidity
    await addLiquidity(program, poolPda, lpMintPda);
    
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
  }
}

async function addLiquidity(program: Program<MiniAmm>, poolPda: PublicKey, lpMintPda: PublicKey) {
  console.log("💧 Adding liquidity...");
  
  const connection = program.provider.connection;
  const wallet = program.provider.wallet;
  
  try {
    // Get user token accounts
    const userTokenAccountA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      MINT_A,
      wallet.publicKey
    );
    
    const userTokenAccountB = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      MINT_B,
      wallet.publicKey
    );
    
    // Get user LP token account
    const userLpTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      lpMintPda,
      wallet.publicKey
    );
    
    // Derive vault PDAs
    const [tokenAVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_a"),
        lpMintPda.toBuffer()
      ],
      PROGRAM_ID
    );
    
    const [tokenBVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_b"),
        lpMintPda.toBuffer()
      ],
      PROGRAM_ID
    );
    
    // Add liquidity (100 tokens A, 100 tokens B)
    const liquidityTx = await program.methods
      .addLiquidity(
        new anchor.BN(100 * 10**6), // 100 tokens A
        new anchor.BN(100 * 10**6), // 100 tokens B
      )
      .accounts({
        user: wallet.publicKey,
        tokenAMint: MINT_A,
        tokenBMint: MINT_B,
        userTokenA: userTokenAccountA.address,
        userTokenB: userTokenAccountB.address,
        userLpTokenAccount: userLpTokenAccount.address,
      })
      .rpc();
    
    console.log("✅ Liquidity added! Transaction:", liquidityTx);
    
    // Check LP token balance
    const lpBalance = await getAccount(connection, userLpTokenAccount.address);
    console.log("LP tokens received:", lpBalance.amount.toString());
    
  } catch (error) {
    console.error("❌ Error adding liquidity:", error);
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
