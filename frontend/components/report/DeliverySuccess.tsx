"use client";
import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { reportsApi } from "@/lib/api/reports";
import { Loader2 } from "lucide-react";

import { socket } from "@/lib/socket";

interface MessagingTrendProps {
  days: number;
}

export default function MessagingTrend({ days }: MessagingTrendProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = () => {
    reportsApi.getEmailTrends(days)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchTrends();
  }, [days]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchTrends();
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [days]);

  return (
    <div id="email-performance-chart" className="border border-gray-100 rounded-2xl bg-white p-5 shadow-sm h-[300px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-bold text-xl text-gray-800">Email Campaign Performance</h2>
          <p className="text-[16px] text-gray-600 font-medium">Last {days} days performance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-[14px] font-bold text-gray-600">Sent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-[14px] font-bold text-gray-600">Failed</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full -ml-6 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#087063]" size={32} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSentEmail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFailedEmail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: '600', fill: '#4b5563' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: '600', fill: '#4b5563' }}
              />

              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <Area type="monotone" name="Sent" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSentEmail)" />
              <Area type="monotone" name="Failed" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailedEmail)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
