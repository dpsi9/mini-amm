/* apps/frontend/components/Navigation.tsx */
"use client";

import { useState } from "react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: "swap", label: "Swap", icon: "🔄" },
    { id: "add", label: "Add Liquidity", icon: "➕" },
    { id: "remove", label: "Remove Liquidity", icon: "➖" },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex bg-white/70 backdrop-blur-sm rounded-lg p-1 border border-white/30 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-700 hover:text-purple-700 hover:bg-white/50"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
