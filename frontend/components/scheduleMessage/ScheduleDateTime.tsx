"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import InsufficientBalanceModal from "../payments/InsufficientBalanceModal";
import { apiFetch } from "@/lib/api";

interface Props {
  group: string;
  message: string;
  media?: any[];
  contactIds: string[];
  totalRecipients?: number;
  templateType: "utility" | "marketing";
  templateName?: string;
  templateParams?: any;
  onScheduled?: () => void;
}

export default function ScheduleDateTime({ 
  group, 
  message, 
  media, 
  contactIds, 
  totalRecipients = 0,
  templateType,
  templateName,
  templateParams,
  onScheduled 
}: Props) {

  const [date, setDate] = useState("");

  
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("AM");

  const [showTime, setShowTime] = useState(false);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const handleSchedule = async () => {
    if (!date) { setErrorMsg("Please select a date."); setStatus("error"); return; }
    if (!message.trim()) { setErrorMsg("Please type a message."); setStatus("error"); return; }
    if (!group) { setErrorMsg("Please select a group."); setStatus("error"); return; }

    let h = parseInt(hour || "0", 10);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    const scheduledAt = new Date(`${date}T${String(h).padStart(2, "0")}:${minute || "00"}:00`).toISOString();

    const PRICING = {
      utility: 0.50,
      marketing: 0.82
    };

    const cost = totalRecipients * PRICING[templateType];
    setEstimatedCost(cost);

    setStatus("loading");
    setErrorMsg("");

    try {
      const token = localStorage.getItem("access_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const res = await fetch(`${apiBase}/schedule-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          message, 
          group, 
          scheduledAt, 
          contactIds,
          media: media || [],
          sourceType: 'message',
          templateType,
          templateName,
          templateParams
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errMsg = errorData.message || JSON.stringify(errorData);
        
        if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
          try {
            const balanceRes = await apiFetch("/wallet/balance");
            if (balanceRes && typeof balanceRes.data?.balance === 'number') {
              setCurrentBalance(balanceRes.data.balance);
            }
          } catch (err) {
            console.error("Failed to fetch balance for modal:", err);
          }
          setIsBalanceModalOpen(true);
          setStatus("idle");
          return;
        }
        throw new Error(errMsg || "Failed to schedule message");
      }

      setStatus("success");
      if (onScheduled) onScheduled();

    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="border border-[#075E54] rounded-lg p-6 flex flex-col gap-4">

      <div className="flex justify-between flex-wrap gap-4">

        {/* LEFT SIDE */}
        <div className="flex gap-10 flex-wrap">

          {/* DATE */}
          <div>
            <p className="font-medium mb-2">Schedule Date</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border px-3 py-2 rounded-md"
            />
          </div>

          {/* TIME */}
          <div className="relative">
            <p className="font-medium mb-2"> Schedule Time</p>

            {/* INPUT BOX */}
            <div
              onClick={() => setShowTime(!showTime)}
              className="border px-3 py-2 rounded-md flex items-center justify-between cursor-pointer w-48"
            >
              <span>
                {hour && minute ? `${hour}:${minute} ${period}` : "--:--"}
              </span>
              <Clock size={18} />
            </div>

            {/* DROPDOWN */}
            {showTime && (
              <div className="absolute mt-2 left-0 bg-white border rounded shadow-md flex z-40">

                {/* HOURS */}
                <div className="h-40 overflow-y-auto border-r">
                  {Array.from({ length: 12 }, (_, i) => {
                    const val = String(i + 1).padStart(2, "0");
                    return (
                      <div
                        key={val}
                        onClick={() => setHour(val)}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-200 ${
                          hour === val ? "bg-gray-300 font-bold" : ""
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>

                {/* MINUTES */}
                <div className="h-40 overflow-y-auto border-r">
                  {Array.from({ length: 60 }, (_, i) => {
                    const val = String(i).padStart(2, "0");
                    return (
                      <div
                        key={val}
                        onClick={() => setMinute(val)}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-200 ${
                          minute === val ? "bg-gray-300 font-bold" : ""
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>

                {/* AM PM */}
                <div>
                  {["AM", "PM"].map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        if (hour && minute) setShowTime(false);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-200 ${
                        period === p ? "bg-gray-300 font-bold" : ""
                      }`}
                    >
                      {p}
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

        </div> 

        {/* RIGHT SIDE BUTTONS */}
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#25D366]/5 px-4 py-2 rounded-lg border border-[#25D366]/10 mr-4">
            <div className="flex flex-col pr-4 border-r border-[#075E54]/10">
              <span className="text-[9px] text-[#075E54] font-bold uppercase tracking-tight">Recipients</span>
              <span className="text-sm font-bold text-[#075E54]">{totalRecipients}</span>
            </div>
            <div className="flex flex-col pl-4 text-right">
              <span className="text-[9px] text-[#075E54] font-bold uppercase tracking-tight">Est. Cost ({templateType})</span>
              <span className="text-sm font-black text-[#075E54]">₹{(totalRecipients * (templateType === 'marketing' ? 0.82 : 0.50)).toFixed(2)}</span>
            </div>
          </div>

          <button
            className="border px-5 py-2 rounded-md hover:bg-gray-100"
            onClick={() => { setDate(""); setHour(""); setMinute(""); setStatus("idle"); }}
          >
            Cancel
          </button>

          <button
            className="bg-[#065A4C] text-white px-6 py-2 rounded-md font-semibold"
            onClick={handleSchedule}
          >
            Schedule Message
          </button>

        </div>

      </div>

      {status === "success" && (
        <p className="text-green-600">Message scheduled successfully!</p>
      )}

      {status === "error" && (
        <p className="text-red-500">{errorMsg}</p>
      )}

      <InsufficientBalanceModal 
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredAmount={estimatedCost}
        availableBalance={currentBalance}
      />

    </div>
  );
}