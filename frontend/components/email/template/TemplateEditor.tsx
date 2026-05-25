"use client";

import { useState, useRef } from "react";
import EmailEditor from "@/components/email/message/EmailEditor";
import { whatsappApi } from "@/lib/api/whatsapp";
import { Loader2, Trash2, FileText, Video, Image as ImageIcon } from "lucide-react";
interface AttachmentFile {
  url: string;
  type: string;
  originalName: string;
}
interface TemplateEditorProps {
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  footer: string;
  setFooter: (v: string) => void;
  attachments: AttachmentFile[];
  setAttachments: (v: AttachmentFile[]) => void;
}

export default function TemplateEditor({ 
  subject, 
  setSubject, 
  body, 
  setBody, 
  footer, 
  setFooter,
  attachments,
  setAttachments
}: TemplateEditorProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => whatsappApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);

     const newMedia: AttachmentFile[] = results // Yahan : AttachmentFile[] add karein
  .filter(res => res.status === 'success')
  .map(res => ({
    url: res.data.url,
    type: res.data.mediaType,
    originalName: res.data.originalName
  }));

      setAttachments([...attachments, ...newMedia]);
    } catch (err: any) {
      alert("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type === 'video') return <Video className="w-5 h-5 text-blue-500" />;
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-5">
      <div className="border border-[#075E54] rounded-xl p-4">
        <label className="font-semibold text-sm">Subject</label>
        <input
          type="text"
          placeholder="Enter subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border border-[#075E54]/30 mt-2 rounded-lg px-4 py-2 w-full focus:border-[#075E54] outline-none transition-all"
        />
      </div>

      <div className="border border-[#075E54] rounded-xl p-4 pb-6">
        <label className="font-semibold text-sm">Email Body</label>
        <div className="mt-3">
          <EmailEditor content={body} setBody={setBody} />
        </div>

        <div className="mt-6">
          <label className="font-semibold block mb-2 text-sm">Attachments</label>
          
          <div className="border border-dashed border-[#075E54]/40 p-4 text-center rounded-lg bg-gray-50/50">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              multiple 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-[#075E54] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#064e46] transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : null}
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <p className="text-[11px] mt-2 text-gray-500">Supported: PDF, Image, Document</p>
          </div>

          {attachments?.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {attachments.map((AttachmentFile, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded-lg bg-white group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(AttachmentFile.type)}
                    <span className="text-xs text-gray-600 truncate">{AttachmentFile.originalName}</span>
                  </div>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <label className="font-semibold block mb-2 text-sm">Footer</label>
          <input
            type="text"
            placeholder="Company Name | Privacy Policy"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            className="border border-[#075E54]/30 rounded-lg px-4 py-2 w-full focus:border-[#075E54] outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}