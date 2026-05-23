"use client";

import { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";

import CampaignHeader from "@/components/campaign/campaignHeader";
import CampaignComposer from "@/components/campaign/campaignComposer";
import CampaignAnalytics from "@/components/campaign/campaignAnalytics";
import CampaignHistoryTable from "@/components/campaign/campaignHistoryTable";
import MessageHistory from "@/components/message/MessageHistory";
import InsufficientBalanceModal from "@/components/payments/InsufficientBalanceModal";
import { whatsappApi } from "@/lib/api/whatsapp";
import { apiFetch } from "@/lib/api";

interface Group {
  name: string;
  contacts: number;
}

export default function CampaignPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [message, setMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);
  const [requiredAmount, setRequiredAmount] = useState<number | undefined>(undefined);

  const fetchGroups = async () => {
    try {
      const res = await whatsappApi.getGroups();
      if (res.status === "success" && res.data) {
        const groupsWithCounts = res.data.groups.map((g: any) => ({ name: g.name, contacts: g.count }));
        setGroups([{ name: "All contacts", contacts: res.data.totalContacts || 0 }, ...groupsWithCounts]);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    setMessage("Discount will start from this Friday!");
  }, []);

  const handleSchedule = async (
    title: string,
    group: string,
    dateTime: string,
    message: string,
    contactIds?: string[],
    cost?: number,
    templateName?: string,
    templateParams?: any,
    media?: any[]
  ): Promise<boolean> => {
    try {
      const scheduledAt = new Date(dateTime).toISOString();

      const res = await whatsappApi.scheduleCampaign({
        campaignName: title,
        group,
        message,
        scheduledAt,
        contactIds,
        sourceType: 'campaign',
        templateName,
        templateParams,
        media
      });

      console.log("Scheduled successfully:", res);
      setRefreshTrigger(prev => prev + 1);
      return true;
    } catch (err: any) {
      console.log("Campaign Schedule Error:", err);
      const errMsg = err.message || JSON.stringify(err);
      
      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
        try {
          const balanceRes = await apiFetch("/wallet/balance");
          if (balanceRes && typeof balanceRes.data?.balance === 'number') {
            setCurrentBalance(balanceRes.data.balance);
          }
        } catch (bErr) {
          console.error("Failed to fetch balance for modal:", bErr);
        }
        setRequiredAmount(cost);
        setIsBalanceModalOpen(true);
        return false;
      }
      
      alert("Failed to schedule campaign: " + errMsg);
      return false;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      {/* FIX HERE */}
      <div className="flex-1 flex flex-col ml-64 pt-20">
        <Topbar title="Campaign" />

        <main className="p-6 w-full  mx-auto">
          <CampaignHeader
            composerGroups={groups}
            composerMessage={message}
            onSchedule={handleSchedule}
          />

          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <Suspense fallback={<div>Loading composer...</div>}>
                <CampaignComposer groups={groups} />
              </Suspense>
            </div>
            <div className="col-span-2">
              <CampaignAnalytics />
            </div>
          </div>

          <CampaignHistoryTable refreshTrigger={refreshTrigger} />
        </main>
      </div>
      
      <InsufficientBalanceModal 
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredAmount={requiredAmount}
        availableBalance={currentBalance}
      />
    </div>
  );
}