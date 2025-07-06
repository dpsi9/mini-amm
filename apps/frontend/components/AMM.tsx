/* apps/frontend/components/AMM.tsx */
"use client";

import { useState } from "react";
import Navigation from "./Navigation";
import Swap from "./Swap";
import AddLiquidity from "./AddLiquidity";
import RemoveLiquidity from "./RemoveLiquidity";
import PoolInfo from "./PoolInfo";

export default function AMM() {
  const [activeTab, setActiveTab] = useState("swap");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "swap":
        return <Swap />;
      case "add":
        return <AddLiquidity />;
      case "remove":
        return <RemoveLiquidity />;
      default:
        return <Swap />;
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 drop-shadow-sm">Mini AMM</h1>
          <p className="text-gray-600 drop-shadow-sm">
            Automated Market Maker on Solana
          </p>
        </div>
        
        <PoolInfo />
        
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex justify-center">
          {renderActiveComponent()}
        </div>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with Solana & Anchor</p>
          <p className="mt-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Connected to Devnet
          </p>
        </footer>
      </div>
    </div>
  );
}
