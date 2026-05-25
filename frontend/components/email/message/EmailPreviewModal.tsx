"use client";

import React from "react";
import { X, Send, Paperclip, FileText, Video, Image as ImageIcon } from "lucide-react";

interface PreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    senderEmail: string;
    subject: string;
    body: string;
    selectedTarget: string;
    media?: { url: string; type: string; originalName?: string }[];
  };
}

export default function EmailPreviewModal({ isOpen, onClose, data }: PreviewProps) {
  if (!isOpen) return null;

  const firstLetter = data.senderEmail ? data.senderEmail.charAt(0).toUpperCase() : "U";

  const getMediaIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || type === 'document') return <FileText className="w-5 h-5 text-red-500" />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type === 'video') return <Video className="w-5 h-5 text-blue-500" />;
    return <ImageIcon className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Email Preview</span>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-8">
          {/* Email Subject */}
          <h1 className="text-2xl font-medium text-gray-900 mb-8 px-2">
            {data.subject || "(No Subject)"}
          </h1>

          {/* Sender & Recipient Info */}
          <div className="flex items-start justify-between mb-10 px-2">
            <div className="flex items-center gap-4">
              {/* Profile Icon r */}
              <div className="w-10 h-10 rounded-full bg-[#065A4C] text-white flex items-center justify-center font-semibold text-lg">
                {firstLetter}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-[15px]">{data.senderEmail.split('@')[0]}</span>
                  <span className="text-xs text-gray-400 font-normal">{"<"}{data.senderEmail}{">"}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  to <span className="text-[#065A4C] font-bold">{data.selectedTarget || "Recipients"}</span>
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-400 font-bold">
              Just now
            </div>
          </div>

          {/* Email Body */}
          <div className="px-2 min-h-[200px] text-[15px] text-gray-800 leading-[1.6]">
             {data.body ? (
               <div 
                 className="prose prose-sm max-w-none email-body-render"
                 dangerouslySetInnerHTML={{ __html: data.body }} 
               />
             ) : (
               <p className="text-gray-300 italic">No content provided.</p>
             )}
          </div>

          {/* Media/Attachments Section */}
          {data.media && data.media.length > 0 && (
            <div className="mt-12 pt-6 border-t border-gray-100 px-2">
              <div className="flex items-center gap-2 mb-6 text-[#065A4C]">
                <Paperclip className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">{data.media.length} Attachment(s)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {data.media.map((item, i) => (
                  <div key={i} className="group/file flex flex-col gap-2 p-3 border-2 border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:border-[#065A4C] hover:shadow-xl hover:shadow-[#065A4C]/5 transition-all cursor-default">
                    <div className="aspect-square bg-white border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover group-hover/file:scale-110 transition-transform duration-500" />
                      ) : (
                        getMediaIcon(item.type, item.originalName)
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-gray-900 truncate">{item.originalName || "Attachment"}</p>
                      <p className="text-[9px] text-[#065A4C] font-bold uppercase">{item.originalName?.split('.').pop() || item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center gap-6">
          <button 
            onClick={onClose} 
            className="text-sm font-black text-[#065A4C] hover:underline transition-all"
          >
            Edit Message
          </button>
          <button className="flex items-center gap-2 px-10 py-3 bg-[#065A4C] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#065A4C]/20 hover:bg-[#044439] hover:-translate-y-0.5 transition-all active:scale-95">
            <Send className="w-4 h-4" /> Send Email
          </button>
        </div>
      </div>

      <style jsx global>{`
        .email-body-render p { margin-bottom: 1rem; }
        .email-body-render ul, .email-body-render ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .email-body-render strong { color: #111; font-weight: 700; }
        .email-body-render a { 
          color: #065A4C; 
          text-decoration: underline; 
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .email-body-render a:hover {
          opacity: 0.8;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}