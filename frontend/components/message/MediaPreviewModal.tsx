import React from 'react';
import { X } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  type: string;
  originalName?: string;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ isOpen, onClose, url, type, originalName }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    const extension = originalName?.split('.').pop()?.toLowerCase();

    // Priority 1: Check extension for specific formats
    if (extension === 'pdf') {
      return (
        <iframe 
          src={`${url}#view=FitH`} 
          className="w-full h-[80vh] rounded-lg border-none"
          title="PDF Preview"
        />
      );
    }

    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension || '') || type === 'video') {
      return (
        <video 
          src={url} 
          controls 
          autoPlay 
          className="max-w-full max-h-[80vh] rounded-lg"
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '') || type === 'image') {
      return (
        <img 
          src={url} 
          alt="Preview" 
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm"
        />
      );
    }

    // Default for other documents
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <svg className="w-8 h-8 text-[#075E54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium mb-4 text-center">
          Preview not available for this file type.
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#075E54] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#05463e] transition-colors"
        >
          Download / View in New Tab
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-bold text-gray-800 truncate mr-8">
              {originalName || 'Media Preview'}
            </h3>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mt-1">
              Preview Mode
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 bg-gray-50 flex items-center justify-center overflow-auto max-h-[85vh]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end bg-white">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewModal;
