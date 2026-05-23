"use client";

import React from 'react';
import { BarChart3, MailCheck, MousePointer2 } from "lucide-react";

export default function CampaignStats() {
  return (
    <div className="bg-white rounded-3xl border border-[#065A4C] shadow-sm p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#065A4C]">Live Progress</h3>
        <BarChart3 className="text-[#065A4C] w-6 h-6" />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">Total Sent</span>
            <span className="text-sm font-black text-[#065A4C]">0/0</span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div className="bg-[#065A4C] h-full w-[0%] transition-all duration-500"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <MailCheck className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-xs font-bold text-gray-500 uppercase">Open Rate</p>
            <p className="text-xl font-black text-green-700">0%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <MousePointer2 className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-xs font-bold text-gray-500 uppercase">Click Rate</p>
            <p className="text-xl font-black text-blue-700">0%</p>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-[#065A4C]">
         <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">Real-time Campaign Analytics</p>
      </div>
    </div>
  );
}