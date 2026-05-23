"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { whatsappApi } from "@/lib/api/whatsapp";
import { Loader2 } from "lucide-react";
import { socket } from "@/lib/socket";

export default function CampaignAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignName, setCampaignName] = useState("No Active Campaign");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await whatsappApi.getCampaigns();
      if (res.status === "success" && res.data.records && res.data.records.length > 0) {
        const latest = res.data.records[0]; 
        updateUI(latest);
        setActiveCampaignId(latest._id);
        setCampaignName(latest.campaignName);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUI = (campaign: any) => {
    const sent = campaign.sentCount || 0;
    const failed = campaign.failedCount || 0;
    const total = campaign.totalContacts || 0;
    const remaining = Math.max(0, total - sent - failed);

    setData([
      { name: "Sent", value: sent, color: "#1ca64f" },
      { name: "Failed", value: failed, color: "#EF4444" },
      { name: "Remaining", value: remaining, color: "#cbd5e1" },
    ]);
  };

  useEffect(() => {
    const handleUpdate = () => {
      fetchData(); // Refresh data from API when socket events occur
    };

    fetchData();

    // Listen for real-time progress
    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [activeCampaignId]);

  const totalContacts = data.reduce((acc, item) => acc + item.value, 0);

  if (loading && data.length === 0) {
    return (
      <div className="border border-[#065A4C] rounded-lg p-6 bg-white h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#065A4C]" size={32} />
      </div>
    );
  }

  return (
    <div className="border border-[#065A4C] rounded-lg p-6 bg-white shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-xl text-black">Sending Progress</h2>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 truncate max-w-[150px]">
          {campaignName}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Pie Chart */}
        <div className="relative w-full aspect-square max-w-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={5}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Contacts</span>
            <span className="text-3xl font-black text-black leading-tight">{totalContacts}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full px-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-sm font-semibold text-gray-600">{item.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                <span className="text-[10px] text-gray-400">
                  {totalContacts > 0 ? ((item.value / totalContacts) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
