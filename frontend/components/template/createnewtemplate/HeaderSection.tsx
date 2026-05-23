"use client";

import { TemplateFormType } from "@/types/template";
import { FaPaperclip } from "react-icons/fa";
import { useRef, useState } from "react";
import { FileText, Video, Image as ImageIcon, Trash2 } from "lucide-react";

type Props = {
  form: TemplateFormType;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormType>>;
};

export default function HeaderSection({ form, setForm }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const headerTypes = ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"];

  const getMediaIcon = (type: string, name?: string) => {
    const ext = name?.split(".").pop()?.toLowerCase();

    if (ext === "pdf" || type === "DOCUMENT")
      return <FileText className="w-8 h-8 text-red-500" />;

    if (type === "VIDEO")
      return <Video className="w-8 h-8 text-blue-500" />;

    return <ImageIcon className="w-8 h-8 text-green-500" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.headerType === "IMAGE" && file.size > 5 * 1024 * 1024) {
      setError("Image size must be ≤ 5MB");
      return;
    }

    if (form.headerType === "VIDEO" && file.size > 16 * 1024 * 1024) {
      setError("Video size must be ≤ 16MB");
      return;
    }

    if (form.headerType === "DOCUMENT" && file.size > 100 * 1024 * 1024) {
      setError("Document size must be ≤ 100MB");
      return;
    }

    setForm((prev) => ({
      ...prev,
      media: file,
    }));
  };

  return (
    <div className="border border-[#075E54] rounded-xl p-5 bg-white shadow-sm">
      <h3 className="font-semibold mb-3 text-black">Header (Optional)</h3>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          {headerTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setError("");
                setForm((prev) => ({
                  ...prev,
                  headerType: type as any,
                  media: null,
                  headerText: "",
                }));
              }}
              className={`px-3 py-1 text-xs rounded-md border transition ${
                form.headerType === type
                  ? "bg-[#075E54] text-white border-[#075E54]"
                  : "border-gray-300 text-gray-600 hover:border-[#075E54]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {form.headerType === "TEXT" && (
          <div>
            <input
              className="w-full p-2 border border-[#075E54] rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-[#075E54]"
              placeholder="Enter header text (Max 60)"
              maxLength={60}
              value={form.headerText}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({ ...prev, headerText: val }));
              }}
            />
            <p className="text-xs text-gray-500">{form.headerText.length} / 60</p>
          </div>
        )}

        {["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) && (
          <div className="mt-2 border-t pt-4">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            {form.media ? (
              <div className="w-24 h-24 rounded-lg border bg-gray-50 relative overflow-hidden mb-3">
                <div className="absolute inset-0 flex items-center justify-center">
                  {form.headerType === "IMAGE" && form.media.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(form.media)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getMediaIcon(form.headerType, form.media.name)
                  )}
                </div>

                <button
                  onClick={() =>
                    setForm((prev) => ({ ...prev, media: null }))
                  }
                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1 rounded truncate max-w-full">
                  {form.media.name.split(".").pop()}
                </div>
              </div>
            ) : null}

            <label className="cursor-pointer flex items-center gap-2 text-[#075E54] font-medium p-2 border border-dashed border-[#075E54] hover:bg-green-50 rounded text-center justify-center transition">
              <FaPaperclip />
              {form.media ? "Replace Media" : `Upload ${form.headerType === "DOCUMENT" ? "PDF" : form.headerType}`}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={
                  form.headerType === "IMAGE"
                    ? "image/jpeg, image/png"
                    : form.headerType === "VIDEO"
                    ? "video/mp4"
                    : "application/pdf"
                }
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              {form.headerType === "IMAGE" && "Max: 5MB. Formats: JPG, PNG."}
              {form.headerType === "VIDEO" && "Max: 16MB. Formats: MP4."}
              {form.headerType === "DOCUMENT" && "Max: 100MB. Formats: PDF."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}