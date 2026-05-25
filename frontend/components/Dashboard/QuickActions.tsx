"use client";

import { useState } from "react";
import { FaWhatsapp, FaEnvelope, FaUpload, FaCalendar, FaPlusCircle, FaClone } from "react-icons/fa";
import { useRouter } from "next/navigation";
import UploadCSVModal from "@/components/contacts/UploadCSVModal";

interface QuickActionsProps {
  onRefresh?: () => void;
}

export default function QuickActions({ onRefresh }: QuickActionsProps) {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    setIsUploadModalOpen(false);
  };

  const actions = [
    { icon: <FaWhatsapp size={24} />, text: "Send Whatsapp", color: "bg-[#087063]", path: "/message" },
    { icon: <FaEnvelope size={24} />, text: "Send Email", color: "bg-[#075E54]", path: "/email/message" },
    { icon: <FaUpload size={24} />, text: "Upload CSV", color: "bg-[#6B46C1]" },
    { icon: <FaClone size={24} />, text: "Create Template", color: "bg-[#854D0E]", path: "/template/create" },
  ];

  const handleActionClick = (text: string, path?: string) => {
    if (path) {
      router.push(path);
    } else if (text === "Upload CSV") {
      setIsUploadModalOpen(true);
    }
  };

  return (
    <div className="border border-[#075E54] rounded-lg p-6 bg-white">
      <h2 className="font-semibold mb-4 text-xl">
        Quick Action
      </h2>

      <div className="grid grid-cols-2 gap-4">
        
        {/* 🔹 Existing 4 buttons */}
        {actions.map((item, i) => (
          <button
            key={i}
            onClick={() => handleActionClick(item.text, item.path)}
            className="shadow p-6 rounded-md hover:shadow-md flex items-center justify-between cursor-pointer border border-[#075E54] w-full text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className={`${item.color} text-white p-4 rounded`}>
                {item.icon}
              </div>
              <span className="font-medium text-gray-700 text-lg">{item.text}</span>
            </div>
            <span className="text-gray-400">{'->'}</span>
          </button>
        ))}

        
        <button
          onClick={() => router.push("/campaign")}
          className="shadow p-6 rounded-md hover:shadow-md flex items-center justify-between cursor-pointer border border-[#075E54] w-full text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-[#087063] text-white p-4 rounded">
              <FaWhatsapp size={24} />
            </div>
            <span className="font-medium text-gray-700 text-lg">
              Send Whatsapp Campaign
            </span>
          </div>
          <span className="text-gray-400">{'->'}</span>
        </button>

        
        <button
          onClick={() => router.push("/email-campaign")}
          className="shadow p-6 rounded-md hover:shadow-md flex items-center justify-between cursor-pointer border border-[#075E54] w-full text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-[#075E54] text-white p-4 rounded">
              <FaEnvelope size={24} />
            </div>
            <span className="font-medium text-gray-700 text-lg">
              Send Email Campaign
            </span>
          </div>
          <span className="text-gray-400">{'->'}</span>
        </button>

      </div>

      {isUploadModalOpen && (
        <UploadCSVModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}