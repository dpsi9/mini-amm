/* apps/frontend/components/PoolInfo.tsx */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { useProgram } from "@/hooks/useProgram";
import { getLpMintPda } from "@/utility/getLpMintPda";
import { getPoolAddresses } from "@/utility/getPoolAddresses";

/* ---------- YOUR ADDRESSES ---------- */
const MINT_A = new PublicKey("M546sKo2CSLUgadVRayVcZAKX27bQTGUWpB9Y1vSgh7");
const MINT_B = new PublicKey("BxjrNSGbZbkuJuuHBhjPze5YDiKEtmwHDRKajsPZiCL5");

export default function PoolInfo() {
  const { connection: walletConn } = useConnection();
  const connection = useMemo(
    () => walletConn ?? new Connection(clusterApiUrl("devnet")),
    [walletConn],
  );
  const LP_MINT = useMemo(() => getLpMintPda(MINT_A, MINT_B), []);
  const program = useProgram();
  
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!program.program) return;
      
      try {
        const { poolPda, vaultAPda, vaultBPda } = await getPoolAddresses(LP_MINT);
        
        // Fetch pool account
        const poolAccount = await program.program.account.pool.fetch(poolPda);
        
        // Fetch vault balances
        const vaultAInfo = await getAccount(connection, vaultAPda);
        const vaultBInfo = await getAccount(connection, vaultBPda);
        
        setPoolData({
          totalLp: poolAccount.totalLp.toString(),
          tokenABalance: vaultAInfo.amount.toString(),
          tokenBBalance: vaultBInfo.amount.toString(),
        });
      } catch (error) {
        console.error("Error fetching pool info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolInfo();
  }, [program.program, connection, LP_MINT]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="text-center text-gray-500">
          <p>Pool not found or not initialized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Pool Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Token A Balance</p>
          <p className="text-2xl font-bold text-blue-800">
            {(Number(poolData.tokenABalance) / 10**6).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Token B Balance</p>
          <p className="text-2xl font-bold text-green-800">
            {(Number(poolData.tokenBBalance) / 10**6).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Total LP Tokens</p>
          <p className="text-2xl font-bold text-purple-800">
            {(Number(poolData.totalLp) / 10**6).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Exchange Rate</span>
          <span className="text-sm font-medium text-gray-800">
            1 Token A = {(
              Number(poolData.tokenBBalance) / Number(poolData.tokenABalance)
            ).toFixed(4)} Token B
          </span>
        </div>
      </div>
    </div>
  );
}
