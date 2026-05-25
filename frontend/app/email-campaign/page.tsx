"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
import { FaBullhorn, FaCheckCircle, FaExclamationCircle, FaUserFriends, FaRegClock } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

interface EmailCampaign {
  _id: string;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
}

export default function EmailCampaignPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/email/campaigns');
      if (res && Array.isArray(res.data)) {
        setCampaigns(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch email campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700 animate-pulse';
      case 'failed': return 'bg-rose-100 text-rose-700';
      case 'scheduled': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activesection="Email Automation" />

      <div className="flex-1 ml-[260px] flex flex-col">
        <Topbar title="Email Campaigns" />

        <main className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Email Campaigns</h1>
              <p className="text-slate-500 font-medium">Track and manage your broadcast performance.</p>
            </div>
            <button
              onClick={fetchCampaigns}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <FaBullhorn className="text-6xl text-slate-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-800">No campaigns found</h3>
                <p className="text-slate-500 mb-8 text-center max-w-sm">You haven't launched any email campaigns yet. Start your first broadcast from the Messaging page.</p>
                <a href="/email-message" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                  Launch First Campaign
                </a>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800">{campaign.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><FaRegClock /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 font-bold text-slate-400">ID: {campaign._id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 bg-slate-50 px-8 py-4 rounded-xl border border-slate-100">
                    <div className="text-center">
                      <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total</div>
                      <div className="text-xl font-black text-slate-700 flex items-center justify-center gap-2">
                        <FaUserFriends className="text-slate-300" /> {campaign.totalCount}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-center">
                      <div className="text-emerald-400 text-xs font-bold uppercase mb-1">Sent</div>
                      <div className="text-xl font-black text-emerald-600 flex items-center justify-center gap-2">
                        <FaCheckCircle className="text-emerald-300" /> {campaign.successCount}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-center">
                      <div className="text-rose-400 text-xs font-bold uppercase mb-1">Failed</div>
                      <div className="text-xl font-black text-rose-600 flex items-center justify-center gap-2">
                        <FaExclamationCircle className="text-rose-300" /> {campaign.failedCount}
                      </div>
                    </div>
                  </div>

                  <div className="md:w-48">
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(campaign.successCount / (campaign.totalCount || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 text-right uppercase tracking-wider">
                      Progress: {Math.round((campaign.successCount / (campaign.totalCount || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
