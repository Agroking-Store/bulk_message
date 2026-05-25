import { TemplateFormType } from "@/types/template";
import { ExternalLink, Phone, Copy } from "lucide-react";

type Props = {
  form: TemplateFormType;
};

// WhatsApp Markdown parser
const formatWhatsAppText = (text: string) => {
  if (!text) return text;
  let formatted = text
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // Bold
    .replace(/_(.*?)_/g, "<em>$1</em>") // Italic
    .replace(/~(.*?)~/g, "<del>$1</del>") // Strikethrough
    .replace(/```(.*?)```/gs, "<code class='bg-gray-100 px-1 py-0.5 rounded text-sm'>$1</code>"); // Monospace

  // Convert newlines to breaks
  formatted = formatted.replace(/\n/g, "<br />");
  return formatted;
};

export default function PreviewPanel({ form }: Props) {
  const hasButtons = form.buttons && form.buttons.length > 0;

  return (
    <div className="p-5 rounded-xl border border-[#075E54] shadow-sm bg-white sticky top-4">
      <h3 className="font-semibold mb-4 text-gray-800">Live Preview</h3>

      {/* WhatsApp Chat Background */}
      <div
        className="rounded-xl h-[520px] flex flex-col p-4 overflow-y-auto bg-[#e5ddd5] shadow-inner"
        style={{
          backgroundImage:
            "url('https://w0.peakpx.com/wallpaper/744/548/HD-wallpaper-whatsapp-ma-doodle-pattern-thumbnail.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex justify-end mt-auto">
          {/* Main Container Wrapper for Bubble + Buttons */}
          <div className="flex flex-col max-w-[85%] w-fit min-w-[250px] shadow-sm rounded-xl overflow-hidden mb-2">
            
            {/* Message Bubble */}
            <div className={`bg-[#dcf8c6] p-2 relative ${hasButtons ? 'rounded-b-none' : ''}`}>
              
              {/* Header Rendering */}
              {form.headerType === "IMAGE" && form.media && (
                <div className="mb-2 w-full rounded overflow-hidden">
                  <img
                    src={URL.createObjectURL(form.media)}
                    className="w-full h-40 object-cover"
                    alt="header-preview"
                  />
                </div>
              )}
              {form.headerType === "VIDEO" && form.media && (
                <div className="mb-2 w-full rounded overflow-hidden bg-black/10">
                  <video
                    src={URL.createObjectURL(form.media)}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
              {form.headerType === "DOCUMENT" && form.media && (
                <div className="mb-2 bg-black/5 p-3 rounded flex items-center gap-2 border border-black/10">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-blue-600">
                      {form.media.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">
                      {form.media.name.split('.').pop()} • PDF Docs
                    </p>
                  </div>
                </div>
              )}
              
              {form.headerType === "TEXT" && form.headerText && (
                <p className="font-bold text-[15px] mb-1 text-black break-words">
                  {form.headerText}
                </p>
              )}

              {/* Body */}
              {form.body ? (
                 <div 
                   className="text-[14px] leading-relaxed text-[#111b21] break-words"
                   dangerouslySetInnerHTML={{ __html: formatWhatsAppText(form.body) }}
                 />
              ) : (
                 <span className="text-gray-400 italic text-[14px]">Message body preview...</span>
              )}

              {/* Footer */}
              {form.footer && (
                <p className="text-[12px] text-gray-500 mt-2 break-words">
                  {form.footer}
                </p>
              )}

              {/* Timestamp mock */}
              <div className="text-[10px] text-gray-500 text-right mt-1">
                {new Date().toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "numeric" })}
              </div>
            </div>

            {/* Attached Buttons inside the same unified wrapper */}
            {hasButtons && (
              <div className="flex flex-col bg-white">
                 {form.buttons.map((btn, index) => {
                    let icon = null;
                    if (btn.type === "URL") icon = <ExternalLink size={16} />;
                    if (btn.type === "PHONE_NUMBER") icon = <Phone size={16} />;
                    if (btn.type === "COPY_CODE") icon = <Copy size={16} />;

                    return (
                      <div 
                        key={index} 
                        className="border-t border-gray-200 text-[#00a884] font-medium text-[15px] py-3 px-4 text-center flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer"
                      >
                        {icon}
                        <span className="truncate">{btn.text || "Button"}</span>
                      </div>
                    );
                 })}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}