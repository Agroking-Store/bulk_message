"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

import TemplateHeader from "@/components/email/template/TemplateHeader";
import TemplateEditor from "@/components/email/template/TemplateEditor";
import TemplatePreview from "@/components/email/template/TemplatePreview";
import TemplateActions from "@/components/email/template/TemplateActions";
import EmailTemplateHistoryTable from "@/components/email/template/EmailTemplateHistoryTable";
import PreviewModal from "@/components/email/template/PreviewModal";

export default function EmailTemplatePage() {
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);

  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ show: true, message, type });
    if (type !== "info") {
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 5000);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await apiFetch("/email/templates/history");
      if (data.status === "success") {
        // We don't need to setHistoryData here if EmailTemplateHistoryTable fetches its own data
        // as per my previous change. But we can trigger a refresh if needed.
        window.dispatchEvent(new CustomEvent('refreshTemplateHistory'));
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleSave = async () => {
    if (!templateName || !subject || !body) {
      showToast("Please fill in Name, Subject, and Body", "error");
      return;
    }

    try {
      const data = await apiFetch("/email/templates", {
        method: "POST",
        body: JSON.stringify({
          name: templateName,
          subject,
          body,
          footer,
          attachments,
        }),
      });

      if (data.status === "success") {
        showToast("Template saved successfully!", "success");
        // Reset form
        setTemplateName("");
        setSubject("");
        setBody("");
        setFooter("");
        setAttachments([]);
        // Refresh history
        window.dispatchEvent(new CustomEvent('refreshTemplateHistory'));
      } else {
        showToast(data.message || "Failed to save template.", "error");
      }
    } catch (error: any) {
      console.error("Failed to save template", error);
      showToast(error.message || "Error saving template.", "error");
    }
  };

  const handleCancel = () => {
    setTemplateName("");
    setSubject("");
    setBody("");
    setFooter("");
    setAttachments([]);
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-[260px]">
        <Topbar title="Templates" />

        <div className="pt-[80px] px-6">
          <h2 className="text-2xl font-semibold mb-4 mt-4 text-[#075E54]">
            Create Email Template
          </h2>

          <TemplateHeader name={templateName} setName={setTemplateName} />

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="col-span-2">
              <TemplateEditor 
                subject={subject} 
                setSubject={setSubject} 
                body={body} 
                setBody={setBody} 
                footer={footer} 
                setFooter={setFooter}
                attachments={attachments}
                setAttachments={setAttachments}
              />
            </div>
            <div className="flex flex-col gap-4">
              <TemplatePreview 
                subject={subject} 
                body={body} 
                footer={footer} 
                attachments={attachments} 
              />
              <TemplateActions onSave={handleSave} onCancel={handleCancel} />
            </div>
          </div>

          <div className="w-full mt-10 pb-10">
            <EmailTemplateHistoryTable />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 duration-300 z-[9999] border-l-4 ${
            toast.type === "success"
              ? "bg-[#E3F9F1] text-[#065A4C] border-[#065A4C]"
              : toast.type === "error"
                ? "bg-red-50 text-red-600 border-red-500"
                : "bg-blue-50 text-blue-600 border-blue-500"
          }`}
        >
          {toast.type === "success" && <FaCheckCircle className="text-xl" />}
          {toast.type === "error" && (
            <FaExclamationCircle className="text-xl" />
          )}
          {toast.type === "info" && (
            <FaInfoCircle className="animate-pulse text-xl" />
          )}

          <div className="flex flex-col">
            <span className="font-black text-sm uppercase tracking-wider">
              {toast.type}
            </span>
            <p className="text-xs font-medium opacity-90">{toast.message}</p>
          </div>

          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-4 hover:opacity-50"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
