"use client";

import React, { useEffect, useState } from 'react';
import { MoreVertical, Loader2 } from "lucide-react";

export default function CampaignHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/email/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch email history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Listen for campaign success events to refresh history
    const handleRefresh = () => fetchHistory();
    window.addEventListener('refreshCampaignHistory', handleRefresh);
    return () => window.removeEventListener('refreshCampaignHistory', handleRefresh);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#065A4C] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="border border-[#065A4C] rounded-lg p-6 bg-white col-span-2 shadow-sm mt-6">
      <h2 className="font-semibold text-xl mb-4 border-b-2 border-[#065A4C] pb-2 text-[#065A4C]">
        Email Campaign History
      </h2>
      <div className="overflow-x-auto">
        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No email campaigns found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#94B6B1]">
<tr className="border-b border-[#065A4C]">
  <th className="px-6 py-4 font-black">Campaign Name</th>
  <th className="px-6 py-4 font-black">Recipient</th>
  <th className="px-6 py-4 font-black">Status</th>
  <th className="px-6 py-4 font-black">Success (%)</th>
  <th className="px-6 py-4 font-black">Date</th>
  <th className="px-6 py-4 font-black text-right">Actions</th>
</tr>
            </thead>
            <tbody className="divide-y-2 divide-[#065A4C]/5">
{history.map((item) => {
  const total = item.totalRecipients || 1;
  const sent = item.sentCount || 0;
  const percent = Math.round((sent / total) * 100);
                
                return (
                  <tr key={item._id} className="hover:bg-[#065A4C]/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{item.campaignName || item.subject}</td>
                    <td className="px-6 py-4 font-medium text-gray-500 text-sm">{item.group || 'Direct'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        item.status === 'failed' ? 'bg-red-100 text-red-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-[#065A4C]">{percent}%</span>
                         <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-[#065A4C] h-full" style={{ width: `${percent}%` }}></div>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-[#065A4C]/10 rounded-lg transition-all text-gray-400 hover:text-[#065A4C]">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
