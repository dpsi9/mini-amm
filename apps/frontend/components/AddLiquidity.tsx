/* apps/frontend/components/AddLiquidity.tsx */
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

export default function AddLiquidity() {
  const { connection: walletConn } = useConnection();
  const { sendTransaction, publicKey } = useWallet();
  const connection = useMemo(
    () => walletConn ?? new Connection(clusterApiUrl("devnet")),
    [walletConn],
  );
  const LP_MINT = useMemo(() => getLpMintPda(MINT_A, MINT_B), []);
  const program = useProgram();
  
  const [amountA, setAmountA] = useState("100");
  const [amountB, setAmountB] = useState("100");
  const [loading, setLoading] = useState(false);

  const handleAddLiquidity = async () => {
    if (!program.program || !publicKey) return alert("Connect wallet first");
    if (!amountA || !amountB) return alert("Enter both amounts");
    
    setLoading(true);
    
    try {
      const amountALamports = new BN(parseFloat(amountA) * 10**6);
      const amountBLamports = new BN(parseFloat(amountB) * 10**6);
      
      const { poolPda, vaultAPda, vaultBPda } = await getPoolAddresses(LP_MINT);
      
      // Get user token accounts
      const userTokenAccountA = await getAssociatedTokenAddress(MINT_A, publicKey);
      const userTokenAccountB = await getAssociatedTokenAddress(MINT_B, publicKey);
      const userLpTokenAccount = await getAssociatedTokenAddress(LP_MINT, publicKey);
      
      // Check if accounts exist and create instructions if needed
      const transaction = new Transaction();
      
      // Check if LP token account exists
      const lpAccountInfo = await connection.getAccountInfo(userLpTokenAccount);
      if (!lpAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userLpTokenAccount,
            publicKey,
            LP_MINT
          )
        );
      }
      
      // Add liquidity instruction
      const addLiquidityIx = await program.program.methods
        .addLiquidity(amountALamports, amountBLamports)
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
      
      transaction.add(addLiquidityIx);
      
      const signature = await sendTransaction(transaction, connection);
      console.log("Add liquidity transaction:", signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      alert(`Liquidity added successfully! Transaction: ${signature}`);
      
    } catch (error: any) {
      console.error("Add liquidity error:", error);
      alert(`Error adding liquidity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add Liquidity</h2>
        <WalletButton />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount A (Token A)
          </label>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount"
            min="0"
            step="0.1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount B (Token B)
          </label>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount"
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> You need to provide both tokens in the correct ratio. 
            The pool will determine the exact amounts based on current liquidity.
          </p>
        </div>
        
        <button
          onClick={handleAddLiquidity}
          disabled={loading || !publicKey || !amountA || !amountB}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            loading || !publicKey || !amountA || !amountB
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white transition-colors`}
        >
          {loading ? "Adding Liquidity..." : "Add Liquidity"}
        </button>
        
        {!publicKey && (
          <p className="text-center text-gray-500 text-sm">
            Connect your wallet to add liquidity
          </p>
        )}
      </div>
    </div>
  );
}
