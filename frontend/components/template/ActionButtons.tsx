"use client";

import { Plus, RotateCw, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ActionButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3">
      
      
      <button
        onClick={() => router.push("/template/create")}
        className="flex items-center gap-2 bg-[#128C7E] hover:bg-[#0b6e63] text-white px-4 py-2 rounded-md font-medium transition-all active:scale-95"
      >
        <Plus size={18} /> Create New Template
      </button>

      
      <button className="flex items-center gap-2 bg-[#1F2C33] hover:bg-black text-white px-4 py-2 rounded-md font-medium transition-all">
        <RotateCw size={18} /> Sync WhatsApp Templates
      </button>

     
      <button
        onClick={() =>
          window.open("https://business.facebook.com/wa/manage/message-templates", "_blank")
        }
        className="flex items-center gap-2 bg-[#1F2C33] hover:bg-black text-white px-4 py-2 rounded-md font-medium transition-all"
      >
        Manage Templates on Meta{" "}
        <ExternalLink size={16} className="ml-1" />
      </button>

    </div>
  );
}