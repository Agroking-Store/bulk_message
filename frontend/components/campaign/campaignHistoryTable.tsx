"use client";

import { useEffect, useState } from "react";
import { whatsappApi } from "@/lib/api/whatsapp";
import { Loader2 } from "lucide-react";
import ContactsPagination from "../contacts/ContactsPagination";
import { socket } from "@/lib/socket";

type Campaign = {
  _id: string;
  campaignName: string;
  sentCount: number;
  failedCount: number;
  totalContacts: number;
  status: string;
  createdAt: string;
  group?: string;
  scheduledTime?: string;
};

export default function CampaignHistoryTable({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchCampaigns = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await whatsappApi.getCampaigns(currentPage, limit);
      if (res.status === 'success') {
        const campaignData = res.data;
        const records = campaignData?.records || (Array.isArray(campaignData) ? campaignData : []);
        const totalCount = campaignData?.total || (Array.isArray(campaignData) ? campaignData.length : 0);

        setCampaigns(records);
        setTotal(totalCount);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(true);
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchCampaigns(false); // Refresh in background
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [currentPage]);

  const groupColors: Record<string, string> = {
    "All Customers": "bg-green-100 text-green-800",
    Leads: "bg-yellow-100 text-yellow-800",
    "VIP Customers": "bg-purple-100 text-purple-800",
    default: "bg-blue-100 text-blue-800"
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'scheduled':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && campaigns.length === 0) {
    return (
      <div className="border border-[#065A4C] rounded-lg p-6 bg-white col-span-2 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-[#065A4C]" size={32} />
      </div>
    );
  }

  return (
    <div className="border border-[#065A4C] rounded-lg p-6 bg-white col-span-2 shadow-sm mt-6">
      <h2 className="font-semibold text-xl mb-4 border-b-2 border-[#065A4C] pb-2 text-[#065A4C]">
        Campaign History
      </h2>

      {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-[#94B6B1]">
            <tr className="border-b border-gray-300">
              <th className="py-3 px-2">Campaign</th>
              <th className="py-3 px-2">Progress</th>
              <th className="py-3 px-2">Sent To</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Date</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">No campaigns found</td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3 px-2 font-medium text-gray-800">
                    {campaign.campaignName}
                  </td>

                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-green-600 font-medium">{campaign.sentCount || 0} sent</span>
                      {(campaign.failedCount || 0) > 0 && (
                        <span className="text-red-500 font-medium">{campaign.failedCount} failed</span>
                      )}
                      <span className="text-gray-400">of {campaign.totalContacts} total</span>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${groupColors[campaign.group || ''] || groupColors.default}`}
                    >
                      {campaign.group || 'N/A'}
                    </span>
                  </td>

                  <td className="py-3 px-2">
                    <span className={`px-3 py-1 rounded text-sm capitalize ${getStatusStyle(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>

                  <td className="py-3 px-2 text-gray-500 text-sm">
                    {campaign.status === 'scheduled' && campaign.scheduledTime ? (
                      <div className="flex flex-col">
                        <span className="text-orange-600 font-bold">Planned for:</span>
                        <span>{new Date(campaign.scheduledTime).toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span>{new Date(campaign.createdAt).toLocaleDateString('en-IN')}</span>
                        <span className="text-[10px]">{new Date(campaign.createdAt).toLocaleTimeString('en-IN')}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <ContactsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
