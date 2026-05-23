"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from "recharts";

interface AnalyticsData {
  totalSent?: number;
  sentCount?: number;
  opened?: number;
  clicked?: number;
  spam?: number;
  bounced?: number;
  timeSeriesData?: {
    time: string;
    opens: number;
    clicks: number;
  }[];
}

export default function CampaignProgressCard({ analytics }: { analytics?: AnalyticsData }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    totalSent = 0, // Total to be sent
    sentCount = 0, // Actually sent
    opened = 0, 
    clicked = 0, 
    spam = 0, 
    bounced = 0, 
    timeSeriesData = [] 
  } = analytics || {};

  // 'Sent' in the donut chart should strictly be the successful deliveries
  // pending = totalSent - (sentCount + failedCount)
  const donutData = [
    { name: "Opened", value: opened, color: "#16a34a", gradId: "gradOpened" },
    { name: "Sent", value: Math.max(0, sentCount - (opened + spam + bounced)), color: "#9ca3af", gradId: "gradSent" },
    { name: "Spam", value: spam, color: "#dc2626", gradId: "gradSpam" },
    { name: "Bounced", value: bounced, color: "#f97316", gradId: "gradBounced" },
  ];

  const hasAnyData = donutData.some(item => item.value > 0);
  const totalProcessed = sentCount + (analytics as any)?.failedCount || 0;
  const progressPercent = totalSent > 0 ? ((totalProcessed / totalSent) * 100).toFixed(0) : 0;
  const openRate = totalSent > 0 ? ((opened / totalSent) * 100).toFixed(1) : 0;


  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-8 py-7 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">
          Sending Progress & Analytics
        </h2>
      </div>

      <div className="p-8 flex flex-col flex-grow space-y-12">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">

          {/* Donut Chart t */}
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d1d5db" stopOpacity={1} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradBounced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={1} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradEmpty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e5e7eb" stopOpacity={1} />
                    <stop offset="95%" stopColor="#d1d5db" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Pie
                  data={donutData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={hasAnyData ? 5 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gradId === 'gradEmpty' ? '#e5e7eb' : `url(#${entry.gradId})`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-black">{openRate}%</span>
              <span className="text-base font-medium text-gray-400">Open Rate</span>
              <span className="text-sm font-bold text-gray-500 mt-1">Sent: {sentCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {donutData.map((item) => (
              <div key={item.name} className="bg-gray-100 p-5 rounded-2xl border border-gray-200 shadow-sm transition-transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold text-gray-600">{item.name}</span>
                </div>
                <span className="text-2xl font-black text-gray-900">{item.value.toLocaleString()}</span>
                {item.name === "Opened" && sentCount > 0 && (
                  <span className="block text-xs text-gray-400 mt-1">{((item.value / sentCount) * 100).toFixed(1)}% rate</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 flex-grow">
          <h3 className="text-lg font-bold text-gray-700">Real-time Click Activity</h3>

          {/* Line Chart */}
          <div className="w-full overflow-hidden" style={{ height: '176px', minHeight: '176px' }}>
            {isMounted && (
              <ResponsiveContainer width="99%" height={176}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Line
                    type="stepAfter"
                    dataKey="opens"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 border-t border-gray-100 text-center">
        <span className="inline-flex items-center gap-2 bg-white text-065A4C px-6 py-2.5 rounded-xl text-s font-bold shadow-sm border border-065A4C">
          <div className="w-3 h-3 bg-065A4C rounded-full animate-pulse" />
          Live Analytics Active
        </span>
      </div>
    </div>
  );
}