"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "../../components/Dashboard/DashboardHeader";
import StatsCard from "../../components/Dashboard/StatsCard";
import CampaignPerformance from "../../components/Dashboard/CampaignPerformance";
import QuickActions from "../../components/Dashboard/QuickActions";
import ContactList from "../../components/Dashboard/ContactList";
import ScheduledMessages from "../../components/Dashboard/ScheduledMessages";
import { FaUsers, FaWhatsapp, FaEnvelope,FaClock,FaChartLine,FaPaperPlane} from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { socket } from "@/lib/socket";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("last30days");

  const fetchStats = async (selectedRange: string = range, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const stats = await apiFetch(`/api/dashboard/stats?range=${selectedRange}`);
      setData(stats);
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range, true);
    
   
    const handleUpdate = () => {
      fetchStats(range, false); 
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, [range]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#075E54]"></div>
      </div>
    );
  }

  return (
  <div className="pt-20">
      {/* Welcome Header */}
      <DashboardHeader userName={data?.user?.fullName} />

      {/* Stats Cards */}
     <div className="grid grid-cols-5 gap-4 mb-4 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#075E54]"></div>
          </div>
        )}
        <StatsCard
          icon={<FaUsers />}
          title="Total Contacts"
          value={data?.totalContacts?.toLocaleString() || "0"}
        />

<StatsCard
  icon={<FaPaperPlane  />}
  title={
    <div className="flex flex-col">
      <span className="leading-tight">WhatsApp Performance</span>
      
    </div>
  }

value={
  <div className="flex flex-col mt-1">
    
    
    <div className="text-2xl font-bold text-gray-800">
      {(data?.messagesSent || 0) + (data?.failedMessages || 0)}
    </div>

    
   <div className="flex justify-center gap-6 mt-2 text-sm font-medium">
      
      <span className="text-green-600">
        Sent: {data?.messagesSent || 0}
      </span>

      <span className="text-red-500">
        Failed: {data?.failedMessages || 0}
      </span>

    </div>

  </div>
}
/>

       
        <StatsCard
          icon={<FaEnvelope />}
            title={
    <div className="flex flex-col">
      <span className="leading-tight">Email Performance</span>
      
    </div>
  }
 value={
  <div className="flex flex-col mt-1">
    
   
    <div className="text-2xl font-bold text-gray-800 ">
      {(data?.emailsSent || 0) + (data?.failedEmails || 0)}
    </div>

   
    <div className="flex justify-center gap-6 mt-2 text-sm font-medium">
      
      <span className="text-green-600">
        Sent: {data?.emailsSent || 0}
      </span>

      <span className="text-red-500">
        Failed: {data?.failedEmails || 0}
      </span>

    </div>

  </div>
}
        />

         <StatsCard
          icon={<FaClock />}
          title="Scheduled Activity"
          value={data?.scheduledMessages?.toLocaleString() || "0"}
        />


        <StatsCard
  icon={<FaChartLine size={20} />}
  title={
    <div className="flex flex-col">
      <span className="leading-tight">Open Rate</span>
    </div>
  }
  value={
    <div className="flex flex-col mt-1">

      {/* 🔹 Open Rate */}
      <div className="text-2xl font-bold text-gray-800">
        {data?.openRate || 0}%
      </div>

      
      <div className="flex justify-center mt-2 text-sm font-medium">
        <span className="text-red-500">
          Spam Detected: {data?.spamCount || 0}
        </span>
      </div>

    </div>
  }
/>
      </div>

     
      <div className="grid grid-cols-2 gap-6">
       
        <CampaignPerformance 
          data={data?.campaignStats} 
          range={range}
          onRangeChange={(newRange) => setRange(newRange)}
        />

       
        <QuickActions onRefresh={() => fetchStats()} />

       
        <ContactList contacts={data?.recentContacts} onRefresh={() => fetchStats()} />

        
        <ScheduledMessages messages={data?.recentScheduledMessages} />
      </div>
    </div>
  );
}
