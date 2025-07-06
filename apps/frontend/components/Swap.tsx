/* apps/frontend/components/Swap.tsx */
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
/* TODO: replace with real LP‑mint PDA */

/* ------------------------------------ */

/* Wallet button rendered client‑side only to avoid hydration mismatch */
const WalletButton = dynamic(
  async () => {
    const mod = await import("@solana/wallet-adapter-react-ui");
    return mod.WalletMultiButton;
  },
  { ssr: false },
);

export default function Swap() {
  const { connection: walletConn } = useConnection();
  const { sendTransaction, publicKey } = useWallet();
  /* separate devnet connection so we can query without wallet loaded */
  const connection = useMemo(
    () => walletConn ?? new Connection(clusterApiUrl("devnet")),
    [walletConn],
  );
  const LP_MINT = useMemo(() => getLpMintPda(MINT_A, MINT_B), []);
  const { program } = useProgram();
  const [amountUi, setAmountUi] = useState("1"); // token units
  const [minOutUi, setMinOutUi] = useState("0.9");
  const [direction, setDirection] = useState<"AtoB" | "BtoA">("AtoB");
  const [loading, setLoading] = useState(false);

  const handleSwap = async () => {
    if (!program || !publicKey) return alert("Connect wallet first");
    setLoading(true);

    try {
      /* 1. derive PDAs */
      const { poolPda, vaultAPda, vaultBPda } = await getPoolAddresses(LP_MINT);

      /* 2. direction routing */
      const inMint = direction === "AtoB" ? MINT_A : MINT_B;
      const outMint = direction === "AtoB" ? MINT_B : MINT_A;
      const inVault = direction === "AtoB" ? vaultAPda : vaultBPda;
      const outVault = direction === "AtoB" ? vaultBPda : vaultAPda;

      /* 3. user ATAs */
      const userInAta = await getAssociatedTokenAddress(inMint, publicKey);
      const userOutAta = await getAssociatedTokenAddress(outMint, publicKey);

      /* 3a. create out ATA if it doesn't exist */
      const ataIxs = await buildCreateAtaIxIfNeeded(publicKey, outMint, userOutAta, connection);

      /* 4. scale UI amounts to raw (assume 6 decimals) */
      const amountInRaw = new BN(parseFloat(amountUi) * 1e6);
      const minOutRaw = new BN(parseFloat(minOutUi) * 1e6);

      /* 5. build swap ix */
      const sig = await program.methods
        .swap(amountInRaw, minOutRaw)
        .preInstructions(ataIxs)
        .accounts({
          user: publicKey,
          userTokenIn: userInAta,
          userTokenOut: userOutAta,
          tokenAMint: MINT_A,
          tokenBMint: MINT_B,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Transaction sent:", sig);
      alert(`Swap success!\nhttps://explorer.solana.com/tx/${sig}?cluster=devnet`);
    } catch (err: unknown) {
      console.error(err);
      alert(`Swap failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Swap Tokens</h2>
        <WalletButton />
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Swap Direction
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AtoB">Token A → Token B</option>
            <option value="BtoA">Token B → Token A</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Swap
          </label>
          <input
            type="number"
            value={amountUi}
            onChange={(e) => setAmountUi(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Output Amount
          </label>
          <input
            type="number"
            value={minOutUi}
            onChange={(e) => setMinOutUi(e.target.value)}
            placeholder="Minimum output"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Swaps are subject to slippage and fees. 
            Set appropriate minimum output to protect against excessive slippage.
          </p>
        </div>

        <button
          disabled={loading || !publicKey}
          onClick={handleSwap}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            loading || !publicKey
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white transition-colors`}
        >
          {loading ? "Swapping..." : "Swap"}
        </button>
        
        {!publicKey && (
          <p className="text-center text-gray-500 text-sm">
            Connect your wallet to swap tokens
          </p>
        )}
      </div>
    </div>
  );
}

/* helper: create ATA instruction only if it doesn't exist */
async function buildCreateAtaIxIfNeeded(
  owner: PublicKey,
  mint: PublicKey,
  ata: PublicKey,
  conn: Connection,
) {
  const ixArr: any[] = [];
  const info = await conn.getAccountInfo(ata);
  if (!info) {
    ixArr.push(createAssociatedTokenAccountInstruction(owner, ata, owner, mint));
  }
  return ixArr;
}
