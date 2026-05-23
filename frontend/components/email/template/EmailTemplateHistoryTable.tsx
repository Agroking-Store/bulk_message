"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PreviewModal from "./PreviewModal";

export default function EmailTemplateHistoryTable() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/email/templates/history");
      if (res.status === "success" && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch template history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    const handleRefresh = () => fetchHistory();
    window.addEventListener('refreshTemplateHistory', handleRefresh);
    return () => window.removeEventListener('refreshTemplateHistory', handleRefresh);
  }, []);

  const handleOpenPreview = (item: any) => {
    setSelectedTemplate(item);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#075E54] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="w-full mt-8 border border-[#075E54] rounded-xl p-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Email Template History
      </h3>

      <div className="w-full overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-[#e6f4ef]">
            <tr className="text-left border-b border-[#075E54]/20">
              <th className="px-4 py-3 font-bold text-sm text-[#075E54]">Action</th>
              <th className="px-4 py-3 font-bold text-sm text-[#075E54]">Template Name</th>
              <th className="px-4 py-3 font-bold text-sm text-[#075E54]">Changed At</th>
              <th className="px-4 py-3 font-bold text-sm text-[#075E54] text-center">View</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500 italic text-sm">
                  No template history found.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-[#f0f9f6] transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      item.action === "CREATED" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                    {item.templateName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(item.changedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => handleOpenPreview(item)}
                      className="text-gray-400 hover:text-[#075E54] p-2 hover:bg-white rounded-full transition-all shadow-sm"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}