"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
import CampaignForm from "@/components/email/campaign/CampaignForm";
import CampaignProgressCard from "@/components/email/campaign/CampaignProgressCard";
import CampaignHistory from "@/components/email/campaign/CampaignHistory";
import { FaClock, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { emailApi } from "@/lib/api/email";
import { whatsappApi } from "@/lib/api/whatsapp";
import { socket } from "@/lib/socket";
import { apiFetch } from "@/lib/api";
import InsufficientBalanceModal from "@/components/payments/InsufficientBalanceModal";

export default function EmailCampaignPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: "",
    recipient: "", // This stores the group name
    subject: "",
    message: "",
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>({
    totalSent: 0,
    opened: 0,
    spam: 0,
    bounced: 0,
    sentCount: 0,
    failedCount: 0,
    timeSeriesData: []
  });
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);
  const [requiredBalance, setRequiredBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchInitialBalance = async () => {
      try {
        const res = await apiFetch("/wallet/balance");
        if (res && typeof res.data?.balance === 'number') {
          setCurrentBalance(res.data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch initial balance:", err);
      }
    };
    fetchInitialBalance();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    if (type !== 'info') {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  const updateField = (field: string, value: string) => {
    setCampaignData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/email/analytics/latest`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.data) {
          setAnalyticsData({
            totalSent: res.data.totalRecipients || 0,
            sentCount: res.data.sentCount || 0,
            failedCount: res.data.bouncedCount || 0,
            opened: res.data.openedCount || res.data.opened || 0,
            spam: res.data.spamCount || res.data.spam || 0,
            bounced: res.data.bouncedCount || res.data.bounced || 0,
            timeSeriesData: res.data.timeSeriesData || []
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await apiFetch("/email/templates");
      if (data.status === "success") {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await whatsappApi.getGroups();
      if (res.status === 'success' && res.data) {
        setGroups(res.data.groups || []);
        setTotalContacts(res.data.totalContacts || 0);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchTemplates();
    fetchAnalytics(); // initial fetch

    const handleUpdate = () => {
      fetchAnalytics();
    };

    socket.on("campaign-progress", handleUpdate);

    // Fallback pooling every 10 seconds (increased from 3s since we have sockets)
    const interval = setInterval(fetchAnalytics, 10000);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleSendCampaign = async () => {
    // Strip HTML to check if message is truly empty (ReactQuill returns <p><br></p> for empty)
    const plainText = campaignData.message.replace(/<[^>]*>/g, '').trim();

    // Validation
    if (!campaignData.recipient || !campaignData.subject || !plainText) {
      showToast("Please fill in Subject, Recipient and Message.", "error");
      return;
    }

    // Auto-fill name if missing
    let finalName = campaignData.name;
    if (!finalName) {
      const now = new Date();
      finalName = `Campaign - ${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes()}`;
    }

    // Proactive balance check
    if (currentBalance !== undefined && currentBalance < parseFloat(totalCost)) {
      setRequiredBalance(parseFloat(totalCost));
      setIsBalanceModalOpen(true);
      return;
    }

    setIsSending(true);
    showToast("Triggering email campaign...", "info");

    try {
      console.log("Sending Campaign Data:", { ...campaignData, name: finalName, contactIds, media });

      const result = await emailApi.sendCampaign({
        campaignName: finalName,
        subject: campaignData.subject,
        body: campaignData.message,
        group: campaignData.recipient,
        contactIds: contactIds,
        media: media
      });

      console.log("Campaign Result:", result);
      showToast("✅ Email campaign triggered successfully!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error("Campaign Send Error:", error);
      const errMsg = error.message || JSON.stringify(error);

      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
        try {
          const balanceRes = await apiFetch("/wallet/balance");
          if (balanceRes && typeof balanceRes.data?.balance === 'number') {
            setCurrentBalance(balanceRes.data.balance);
          }
        } catch (bErr) {
          console.error("Failed to fetch balance for modal:", bErr);
        }
        setRequiredBalance(parseFloat(totalCost));
        setIsBalanceModalOpen(true);
        setIsSending(false);
        return;
      }

      showToast(error.message || "Failed to trigger campaign. Please try again.", "error");
      setIsSending(false);
    }
  };

  const handleScheduleCampaign = async () => {
    // Validation
    const plainText = campaignData.message.replace(/<[^>]*>/g, '').trim();
    if (!campaignData.recipient || !campaignData.subject || !plainText || !scheduledDate || !scheduledTime) {
      showToast("Please fill in Subject, Recipient, Message, and Schedule Date/Time.", "error");
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledAt <= new Date()) {
      showToast("Schedule time must be in the future.", "error");
      return;
    }

    // Auto-fill name if missing
    let finalName = campaignData.name;
    if (!finalName) {
      finalName = `Scheduled - ${scheduledAt.toLocaleString()}`;
    }

    setIsSending(true);
    showToast("Scheduling email campaign...", "info");

    // Proactive balance check
    if (currentBalance !== undefined && currentBalance < parseFloat(totalCost)) {
      setRequiredBalance(parseFloat(totalCost));
      setIsBalanceModalOpen(true);
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/email/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          campaignName: finalName,
          subject: campaignData.subject,
          body: campaignData.message,
          group: campaignData.recipient,
          contactIds: contactIds,
          media: media,
          scheduledAt: scheduledAt.toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        showToast("✅ Email campaign scheduled successfully!", "success");
        setIsModalOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showToast(result.message || "Failed to schedule campaign", "error");
        setIsSending(false);
      }
    } catch (error: any) {
      console.error("Schedule Error:", error);
      const errMsg = error.message || JSON.stringify(error);

      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
        try {
          const balanceRes = await apiFetch("/wallet/balance");
          if (balanceRes && typeof balanceRes.data?.balance === 'number') {
            setCurrentBalance(balanceRes.data.balance);
          }
        } catch (bErr) {
          console.error("Failed to fetch balance for modal:", bErr);
        }
        setRequiredBalance(parseFloat(totalCost));
        setIsBalanceModalOpen(true);
        setIsSending(false);
        return;
      }

      showToast("Server error. Please try again.", "error");
      setIsSending(false);
    }
  };

  const selectedGroup = groups.find(g => g.name === campaignData.recipient);
  const baseRecipientCount = campaignData.recipient === 'ALL' ? totalContacts : (selectedGroup ? selectedGroup.count : 0);
  const recipientCount = contactIds.length > 0 ? contactIds.length : baseRecipientCount;
  const totalCost = (recipientCount * 0.10).toFixed(2);
  return (
    <div className="flex min-h-screen bg-[#f8faff]">
      <Sidebar />

      <div className="flex-1 ml-[260px] flex flex-col">
        <Topbar title="Campaign" />

        <main className="p-6 mt-14 space-y-3">
          {/* Header Section */}
          <div className="mb-2 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mt-6">Send Bulk Email</h1>
              <p className="text-sm text-gray-500">Manage and Run Bulk Email Campaign</p>
            </div>

            <div className="relative">
              {/* Trigger Button */}
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="flex items-center gap-2 bg-[#065A4C] text-white mt-6 px-5 py-2 rounded-md hover:opacity-90 transition shadow font-medium"
              >
                <FaClock /> Schedule Campaign
              </button>
              {isModalOpen && (
                <div className="absolute right-0 mt-3 w-[380px] bg-white border-2 border-[#065A4C] rounded-2xl shadow-2xl z-[110] p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-5">
                    <h3 className="font-bold text-xl text-[#1e293b] border-b pb-3">Schedule Details</h3>

                    {/* Date input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Schedule Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-[#065A4C]"
                      />
                    </div>

                    {/* Time input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Schedule Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-[#065A4C]"
                      />
                    </div>

                    {/* Stats Box */}
                    <div className="flex bg-[#F1F8F7] border border-[#D1E7E4] rounded-xl p-4 justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Recipients</p>
                        <p className="text-2xl font-bold text-[#065A4C]">{recipientCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Est. Cost</p>
                        <p className="text-2xl font-bold text-[#065A4C]">₹{totalCost}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        className="w-full py-4 bg-[#065A4C] text-white rounded-xl font-bold text-lg hover:bg-[#044439] transition-all shadow-md disabled:opacity-50"
                        onClick={handleScheduleCampaign}
                        disabled={isSending}
                      >
                        {isSending ? "Scheduling..." : "Schedule Message"}
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-2 text-gray-500 font-bold hover:text-red-500 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-[1.6] border border-[#065A4C] rounded-lg bg-white overflow-hidden">
              <div className="p-4">
                <CampaignForm
                  {...({
                    campaignData,
                    updateField,
                    groups,
                    templates,
                    loadingGroups,
                    handleSendCampaign,
                    isSending,
                    contactIds,
                    setContactIds,
                    media,
                    setMedia,
                    totalCost
                  } as any)}
                />
              </div>
            </div>

            <div className="flex-[1] border border-[#065A4C] rounded-lg bg-white overflow-hidden">
              <CampaignProgressCard analytics={analyticsData} />
            </div>
          </div>

          <div className="border border-[#065A4C] rounded-lg bg-white overflow-hidden">
            <CampaignHistory />
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 duration-300 z-[9999] border-l-4 ${toast.type === 'success' ? 'bg-[#E3F9F1] text-[#065A4C] border-[#065A4C]' :
          toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-500' :
            'bg-blue-50 text-blue-600 border-blue-500'
          }`}>
          {toast.type === 'success' && <FaCheckCircle className="text-xl" />}
          {toast.type === 'error' && <FaExclamationCircle className="text-xl" />}
          {toast.type === 'info' && <FaInfoCircle className="animate-pulse text-xl" />}

          <div className="flex flex-col">
            <span className="font-black text-sm uppercase tracking-wider">{toast.type}</span>
            <p className="text-xs font-medium opacity-90">{toast.message}</p>
          </div>

          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-4 hover:opacity-50"
          >
            ✕
          </button>
        </div>
      )}

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredAmount={requiredBalance}
        availableBalance={currentBalance}
      />
    </div>
  );
}