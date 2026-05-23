"use client";
import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
import ReportStats from "@/components/report/ReportStats";
import ReportFilters from "@/components/report/ReportFilters";
import MessagingTrend from "@/components/report/MessagingTrend";
import DeliverySuccess from "@/components/report/DeliverySuccess";
import CampaignTable from "@/components/report/CampaignTable";
import GroupPerformance from "@/components/report/GroupPerformance";

import { reportsApi } from "@/lib/api/reports";
import { exportReportToPDF } from "@/lib/reportExport";

export default function ReportPage() {
  const [days, setDays] = useState(7);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const [stats, topCampaigns] = await Promise.all([
        reportsApi.getStats(days),
        reportsApi.getTopCampaigns(days)
      ]);

      await exportReportToPDF({
        days,
        stats,
        topCampaigns
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      
      <div className="flex-1 flex flex-col ml-64 pt-20">
        <Topbar title="Report" />

        <main className="p-6 w-full  mx-auto">
          <div className="mb-2 text-left">
            <h1 className="text-2xl font-bold text-black">
              Campaign Analytics
            </h1>
            <p className="text-gray-500 text-sm">
              In-depth performance data.
            </p>
          </div>

          <ReportStats days={days} />

          <ReportFilters
            days={days}
            onDaysChange={setDays}
            onExportPDF={handleExportPDF}
            isExporting={isExporting}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MessagingTrend days={days} />
            <DeliverySuccess days={days} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-4">
            <div className="lg:col-span-8">
              <CampaignTable days={days} />
            </div>
            <div className="lg:col-span-4 h-full">
              <GroupPerformance />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}