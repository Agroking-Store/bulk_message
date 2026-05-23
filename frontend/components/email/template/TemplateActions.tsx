"use client";

interface TemplateActionsProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function TemplateActions({ onSave, onCancel }: TemplateActionsProps) {
  return (
    <div className="flex justify-end gap-4">

      <button 
        onClick={onCancel}
        className="px-6 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        Cancel
      </button>

      <button 
        onClick={onSave}
        className="px-6 py-2 bg-[#127C62] text-white rounded-lg hover:bg-[#0f6b54] transition-colors"
      >
        Save Template
      </button>

    </div>
  );
}