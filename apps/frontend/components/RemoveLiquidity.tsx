/* apps/frontend/components/RemoveLiquidity.tsx */
"use client";

import { useState, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { getPoolAddresses } from "@/utility/getPoolAddresses";
import { useProgram } from "@/hooks/useProgram";
import { getLpMintPda } from "@/utility/getLpMintPda";

/* ---------- YOUR ADDRESSES ---------- */
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");

/* Wallet button rendered client‑side only to avoid hydration mismatch */
const WalletButton = dynamic(
  async () => {
    const mod = await import("@solana/wallet-adapter-react-ui");
    return mod.WalletMultiButton;
  },
  { ssr: false },
);

export default function RemoveLiquidity() {
  const { connection: walletConn } = useConnection();
  const { sendTransaction, publicKey } = useWallet();
  const connection = useMemo(
    () => walletConn ?? new Connection(clusterApiUrl("devnet")),
    [walletConn],
  );
  const LP_MINT = useMemo(() => getLpMintPda(MINT_A, MINT_B), []);
  const program = useProgram();
  
  const [lpAmount, setLpAmount] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleRemoveLiquidity = async () => {
    if (!program.program || !publicKey) return alert("Connect wallet first");
    if (!lpAmount) return alert("Enter LP amount to remove");
    
    setLoading(true);
    
    try {
      const lpAmountLamports = new BN(parseFloat(lpAmount) * 10**6);
      
      const { poolPda, vaultAPda, vaultBPda } = await getPoolAddresses(LP_MINT);
      
      // Get user token accounts
      const userTokenAccountA = await getAssociatedTokenAddress(MINT_A, publicKey);
      const userTokenAccountB = await getAssociatedTokenAddress(MINT_B, publicKey);
      const userLpTokenAccount = await getAssociatedTokenAddress(LP_MINT, publicKey);
      
      // Check if accounts exist and create instructions if needed
      const transaction = new Transaction();
      
      // Check if token accounts exist
      const accountAInfo = await connection.getAccountInfo(userTokenAccountA);
      if (!accountAInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userTokenAccountA,
            publicKey,
            MINT_A
          )
        );
      }
      
      const accountBInfo = await connection.getAccountInfo(userTokenAccountB);
      if (!accountBInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userTokenAccountB,
            publicKey,
            MINT_B
          )
        );
      }
      
      // Remove liquidity instruction
      const removeLiquidityIx = await program.program.methods
        .removeLiquidity(lpAmountLamports)
        .accounts({
          user: publicKey,
          pool: poolPda,
          lpMint: LP_MINT,
          tokenAVault: vaultAPda,
          tokenBVault: vaultBPda,
          tokenAMint: MINT_A,
          tokenBMint: MINT_B,
          userTokenA: userTokenAccountA,
          userTokenB: userTokenAccountB,
          userLpTokenAccount: userLpTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .instruction();
      
      transaction.add(removeLiquidityIx);
      
      const signature = await sendTransaction(transaction, connection);
      console.log("Remove liquidity transaction:", signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      alert(`Liquidity removed successfully! Transaction: ${signature}`);
      
    } catch (error: any) {
      console.error("Remove liquidity error:", error);
      alert(`Error removing liquidity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Remove Liquidity</h2>
        <WalletButton />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LP Token Amount
          </label>
          <input
            type="number"
            value={lpAmount}
            onChange={(e) => setLpAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter LP amount"
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-600">
            <strong>Warning:</strong> Removing liquidity will burn your LP tokens and 
            return the underlying tokens (A and B) to your wallet.
          </p>
        </div>
        
        <button
          onClick={handleRemoveLiquidity}
          disabled={loading || !publicKey || !lpAmount}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            loading || !publicKey || !lpAmount
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          } text-white transition-colors`}
        >
          {loading ? "Removing Liquidity..." : "Remove Liquidity"}
        </button>
        
        {!publicKey && (
          <p className="text-center text-gray-500 text-sm">
            Connect your wallet to remove liquidity
          </p>
        )}
      </div>
    </div>
  );
}
