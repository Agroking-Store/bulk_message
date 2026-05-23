"use client";
import React, { useEffect, useState } from "react";
import { FaPaperPlane, FaCheckDouble, FaTimesCircle, FaChartLine , FaMousePointer} from "react-icons/fa";
import { reportsApi } from "@/lib/api/reports";
import { Loader2 } from "lucide-react";

import { socket } from "@/lib/socket";

interface ReportStatsProps {
  days: number;
}

export default function ReportStats({ days }: ReportStatsProps) {
  const [data, setData] = useState({
    totalSent: 0,
    totalAttempted: 0,
    totalFailed: 0,
    engagementRate: "0.0%",
    clickRate: "0.0%"
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    reportsApi.getStats(days)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [days]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchStats();
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [days]);

  const stats = [
    { label: "Total Campaigns", value: data.totalAttempted?.toLocaleString() || "0", icon: <FaPaperPlane />, color: "text-[#087063]", bg: "bg-[#087063]/10", border: "border-[#087063]/20", hoverBorder: "group-hover:border-[#087063]" },
    { label: "Sent messages", value: data.totalSent?.toLocaleString() || "0", icon: <FaCheckDouble />, color: "text-[#087063]", bg: "bg-[#087063]/10", border: "border-[#087063]/20", hoverBorder: "group-hover:border-[#087063]" },
    { label: "Failed campaign", value: data.totalFailed?.toLocaleString() || "0", icon: <FaTimesCircle />, color: "text-[#087063]", bg: "bg-[#087063]/10", border: "border-[#087063]/20", hoverBorder: "group-hover:border-[#087063]" },
    { label: "Success rate", value: data.engagementRate, icon: <FaChartLine />, color: "text-[#087063]", bg: "bg-[#087063]/10", border: "border-[#087063]/20", hoverBorder: "group-hover:border-[#087063]" },
    { label: "Click rate", value: data.clickRate || "0.0%",icon: <FaMousePointer />,color: "text-[#087063]",bg: "bg-[#087063]/10",border: "border-[#087063]/20",hoverBorder: "group-hover:border-[#087063]"
}
  ];

  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-[#087063]" size={32} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`group bg-white border ${s.border} ${s.hoverBorder} p-5 rounded-2xl shadow-sm 
                     hover:shadow-lg hover:-translate-y-1 transition-all duration-300 
                     flex items-center gap-5 cursor-default`}
        >
          <div className={`${s.bg} ${s.color} p-5 rounded-xl text-2xl 
                          group-hover:bg-[#087063] group-hover:text-white transition-all duration-300 
                          group-hover:scale-105`}>
            {s.icon}
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-500 mb-0.5 ">
              {s.label}
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {s.value}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}
