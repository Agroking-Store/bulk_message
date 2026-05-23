"use client";

import React from "react";
import { ImageIcon, FileText, Video } from "lucide-react";
import "react-quill-new/dist/quill.snow.css";

export interface TemplatePreviewProps {
  subject: string;
  body: string;
  footer: string;
  attachments: any[];
}

export default function TemplatePreview({
  subject,
  body,
  footer,
  attachments,
}: TemplatePreviewProps) {
  
  const getMediaIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || type === 'document') return <FileText className="w-5 h-5 text-red-500" />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type === 'video') return <Video className="w-5 h-5 text-blue-500" />;
    return <ImageIcon className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="border border-[#075E54] rounded-xl p-4 h-full flex flex-col shadow-sm">
      <h3 className="font-semibold mb-4 text-[#075E54] uppercase text-xs tracking-widest">
        Live Preview
      </h3>

      <div className="border border-[#075E54] rounded-lg p-4 bg-white flex-1 min-h-[520px] shadow-inner flex flex-col">
        {/* SUBJECT */}
        <h4 className="font-bold mb-3 text-gray-800 text-lg">
          {subject || "No Subject"}
        </h4>

        <hr className="border-[#075E54]/20 mb-4" />

        {/* BODY (Quill Styled) */}
        <div
          className="
            border
            border-[#075E54]/10
            rounded-lg
            p-4
            mb-6
            min-h-[350px]
            bg-gray-50/50
            overflow-y-auto
            ql-snow
          "
          style={{
            backgroundImage: "url('/email-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="ql-editor !p-0 !min-h-0"
            dangerouslySetInnerHTML={{
              __html: body || "<p class='text-gray-400 italic'>No content provided</p>",
            }}
          />
        </div>

        {/* ATTACHMENTS SECTION */}
        {attachments && attachments.length > 0 && (
          <div className="mt-6 mb-6">
            <h5 className="text-[10px] font-black text-[#075E54] uppercase tracking-widest mb-3 border-b border-[#075E54]/10 pb-1">
              Attachments ({attachments.length})
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {attachments.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                  <div className="w-14 h-14 bg-white rounded-lg border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="scale-150">
                        {getMediaIcon(item.type, item.originalName)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {item.originalName || "Attachment"}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                      {item.type} • {item.originalName?.split('.').pop() || 'file'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center mt-auto pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 font-medium">
            {footer || "Company Name | Privacy Policy"}
          </p>
          <p className="text-[10px] text-green-600 font-bold cursor-pointer hover:underline mt-1">
            Unsubscribe
          </p>
        </div>
      </div>
    </div>
  );
}