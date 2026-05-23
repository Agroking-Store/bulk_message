"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function EmailEditor({ content, setBody }: { content?: string, setBody: (val: string) => void }) {
  
  useEffect(() => {
    const addTooltips = () => {
      const buttons = document.querySelectorAll('.ql-toolbar button, .ql-toolbar .ql-picker');
      const tooltips: { [key: string]: string } = {
        'ql-bold': 'Bold', 'ql-italic': 'Italic', 'ql-underline': 'Underline',
        'ql-strike': 'Strike', 'ql-link': 'Link', 'ql-image': 'Image',
        'ql-clean': 'Clear', 'ql-list': 'List', 'ql-header': 'Heading'
      };

      buttons.forEach((btn) => {
        const className = Array.from(btn.classList).find(c => tooltips[c]);
        if (className) btn.setAttribute('title', tooltips[className]);
      });
    };

    const timer = setTimeout(addTooltips, 500);
    return () => clearTimeout(timer);
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="bg-[#065A4C]/5 min-h-[300px] border border-[#065A4C]/20 rounded-2xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#065A4C]/10 focus-within:bg-white">
      <ReactQuill 
        theme="snow"
        value={content || ""}
        onChange={setBody}
        placeholder=" Start writing your email..."
        modules={modules}
        className="flex flex-col"
      />
      
      <style jsx global>{`
        .ql-container {
          min-h: 250px;
          display: flex;
          flex-direction: column;
        }
        .ql-editor {
          min-h: 250px;
          padding: 24px !important;
          font-size: 16px !important;
          color: #374151;
          line-height: 1.6;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af !important;
          font-style: normal !important;
        }
        .ql-toolbar.ql-snow { 
          border: none !important; 
          border-bottom: 1px solid #065A4C/20 !important; 
          padding: 12px 20px !important; 
          display: flex;
          gap: 8px;
        }

        /* Grouped options container styling */
        .ql-formats {
          border: 1px solid #065A4C !important;
          background-color: rgba(6, 90, 76, 0.08) !important;
          border-radius: 10px !important;
          padding: 2px 3px !important;
          margin-right: 2px !important;
          display: flex !important;
          align-items: center;
        }

        /* Balanced button sizing */
        .ql-snow.ql-toolbar button, 
        .ql-snow.ql-toolbar .ql-picker {
          width: 26px !important;
          height: 24px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease;
        }

        .ql-snow.ql-toolbar .ql-picker.ql-header {
          width: 90px !important;
        }

        .ql-snow.ql-toolbar button:hover,
        .ql-snow.ql-toolbar button.ql-active {
          background-color: #065A4C !important;
        }

        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: white !important;
        }

        .ql-container.ql-snow { border: none !important; }
        .ql-editor { padding: 20px !important; font-size: 15px !important; }
      `}</style>
    </div>
  );
}