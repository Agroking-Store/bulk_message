"use client";

import { X, Smartphone, Check, Image as ImageIcon, Video, FileText, ExternalLink, MessageCircle } from "lucide-react";
import { useEffect } from "react";

interface TemplatePreviewModalProps {
  template: any;
  onClose: () => void;
}

export default function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!template) return null;

  const header = template.components?.find((c: any) => c.type === "HEADER");
  const body = template.components?.find((c: any) => c.type === "BODY");
  const footer = template.components?.find((c: any) => c.type === "FOOTER");
  const buttonsGroup = template.components?.find((c: any) => c.type === "BUTTONS");

  const renderHeader = () => {
    if (!header) return null;

    if (header.format === "TEXT") {
      return (
        <div className="font-bold text-[15px] mb-1 text-gray-800">
          {header.text}
        </div>
      );
    }

    if (header.format === "IMAGE") {
      const imageUrl = header.example?.header_handle?.[0] || "https://placehold.co/600x400?text=Image+Preview";
      return (
        <div className="mb-2 -mx-1 -mt-1">
          <img src={imageUrl} alt="Header" className="w-full h-40 object-cover rounded-t-lg" />
        </div>
      );
    }

    if (header.format === "VIDEO") {
      return (
        <div className="mb-2 -mx-1 -mt-1 bg-black rounded-t-lg aspect-video flex items-center justify-center">
          <Video className="text-white opacity-50" size={40} />
          <span className="absolute text-white text-[10px] bottom-2 right-2 bg-black/50 px-1 rounded">VIDEO PREVIEW</span>
        </div>
      );
    }

    if (header.format === "DOCUMENT") {
      return (
        <div className="mb-2 bg-gray-100 p-3 rounded-lg flex items-center gap-3 border border-gray-200">
          <div className="bg-blue-500 p-2 rounded">
            <FileText className="text-white" size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold truncate text-gray-700">Document_Preview.pdf</div>
            <div className="text-[10px] text-gray-500 uppercase">PDF • 1.2 MB</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderButtons = () => {
    if (!buttonsGroup?.buttons) return null;

    return (
      <div className="mt-2 space-y-1">
        {buttonsGroup.buttons.map((btn: any, idx: number) => {
          const isUrl = btn.type === "URL";
          const isPhone = btn.type === "PHONE_NUMBER";
          
          return (
            <div 
              key={idx} 
              className="bg-white/90 hover:bg-white text-[#00a884] py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-default"
            >
              {isUrl && <ExternalLink size={14} />}
              {isPhone && <Smartphone size={14} />}
              {!isUrl && !isPhone && <MessageCircle size={14} />}
              {btn.text}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="relative bg-[#f0f2f5] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Phone Header */}
        <div className="bg-[#008069] text-white p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Template Preview</h3>
              <p className="text-[10px] opacity-80 uppercase tracking-widest">{template.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: '400px',
            backgroundColor: '#e5ddd5'
          }}
        >
          {/* Message Bubble */}
          <div className="flex flex-col max-w-[90%]">
            <div className="bg-white rounded-tr-xl rounded-b-xl p-2 shadow-sm relative group">
              {/* Triangle pointer */}
              <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent" />
              
              <div className="px-1">
                {renderHeader()}

                <div className="text-[14.2px] leading-[1.4] text-gray-800 whitespace-pre-wrap break-words">
                  {body?.text || "No body text available"}
                </div>

                {footer && (
                  <div className="text-[11px] text-gray-400 mt-1 mb-0.5">
                    {footer.text}
                  </div>
                )}

                <div className="flex justify-end items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex -space-x-1">
                    <Check size={12} className="text-[#53bdeb]" />
                    <Check size={12} className="text-[#53bdeb]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons Render outside bubble to mimic WA UI */}
            {renderButtons()}
          </div>
        </div>

        {/* Footer/Input Area (Visual only) */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 shrink-0 border-t border-gray-200">
          <div className="bg-white rounded-full flex-1 px-4 py-2 text-sm text-gray-400">
            Type a message
          </div>
          <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-sm">
            <MessageCircle size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
