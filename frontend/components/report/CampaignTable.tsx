"use client";
import React, { useEffect, useState } from "react";
import { reportsApi } from "@/lib/api/reports";
import { Loader2 } from "lucide-react";

import { socket } from "@/lib/socket";

interface CampaignTableProps {
  days: number;
}

export default function CampaignTable({ days }: CampaignTableProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const handleDownload = async (id: string) => {
    console.log("Downloading campaign:", id);
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${API_URL}/reports/download/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_report_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      console.error("Download error:", error);
      alert(error.message || "Failed to download report. Please try again.");
    }
  };

  const fetchCampaigns = () => {
    reportsApi.getTopCampaigns(days)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchCampaigns();
  }, [days]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchCampaigns();
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [days]);

  return (
    <div id="top-campaigns-table" className="flex flex-col gap-6">
      <div className="border-2 border-[#075E54] rounded-lg bg-white overflow-hidden shadow-md">
        <div className="p-4 border-b-2 border-[#075E54] bg-gray-50">
          <h2 className="font-bold text-xl text-black text-left">Top performing campaigns</h2>
        </div>

        <div className="overflow-x-auto relative">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-[#075E54]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-[#075E54]">
                  <th className="p-4 text-lg font-bold text-gray-600 text-left">Campaign name</th>
                  <th className="p-4 text-lg font-bold text-gray-600 text-center">Group</th>
                  <th className="p-4 text-lg font-bold text-gray-600 text-center">Total sent</th>
                  <th className="p-4 text-lg font-bold text-gray-600 text-center">Success rate</th>
                  <th className="p-4 text-lg font-bold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-green-50/30 transition-colors">
                    <td className="p-5 font-bold text-gray-800 text-left">{c.name}</td>
                    <td className="p-5 text-center">
                      <span className=" text-[#087063] px-3 py-1 rounded font-bold text-[16px]">
                        {c.group}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-600">{c.totalSent}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-[#087063] border border-green-200 px-3 py-1 rounded font-bold">
                        {c.successRate}
                      </span>
                    </td>
                    <td className="p-4 text-center">
  <button
    onClick={() => handleDownload(c.id)}
    className="bg-[#075E54] text-white px-3 py-1 rounded hover:bg-[#064e45]"
  >
    Download
  </button>
</td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">No campaigns found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div><div>
       </div>
        </div>  
  );
}
