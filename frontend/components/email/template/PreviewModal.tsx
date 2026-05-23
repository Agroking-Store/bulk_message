"use client";

import { X } from "lucide-react";
import TemplatePreview from "./TemplatePreview";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    templateName: string;
    subject: string;
    body: string;
    footer: string;
    attachments?: any[]; 
  } | null;
}

export default function PreviewModal({ isOpen, onClose, template }: PreviewModalProps) {
  if (!isOpen || !template) return null;

  console.log("Viewing Template in Modal:", template);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
            <p className="text-sm text-gray-500 mt-1">
              Viewing history record for:{" "}
              <span className="font-semibold text-[#075E54]">
                {template.templateName}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="max-w-2xl mx-auto h-full">
            <TemplatePreview 
              subject={template.subject}
              body={template.body}
              footer={template.footer}
              attachments={template.attachments || []}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#075E54] text-white rounded-lg font-medium hover:bg-[#064e46] transition-all shadow-md active:scale-95"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}