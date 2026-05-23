"use client";

import { useState, useEffect } from "react";
import { FaClock } from "react-icons/fa";
import { Users, ChevronLeft, ChevronRight, Eye, Trash2, FileText, Video, Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import ContactSelectorModal from "../message/ContactSelectorModal";
import MediaPreviewModal from "../message/MediaPreviewModal";
import { whatsappApi } from "@/lib/api/whatsapp";

type Group = {
  name: string;
  contacts: number;
};

type CampaignHeaderProps = {
  composerGroups: Group[];
  composerMessage: string;
  onSchedule: (
    title: string,
    group: string,
    dateTime: string,
    message: string,
    contactIds?: string[],
    cost?: number,
    templateName?: string,
    templateParams?: any,
    media?: any[]
  ) => Promise<boolean>;
};

export default function CampaignHeader({
  composerGroups = [],
  composerMessage,
  onSchedule,
}: CampaignHeaderProps) {

  const [showScheduler, setShowScheduler] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [campaignTitle, setCampaignTitle] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateParams, setTemplateParams] = useState<any>(undefined);
  const [templateBodyVariables, setTemplateBodyVariables] = useState<string[]>([]);
  const [templateType, setTemplateType] = useState<"utility" | "marketing">("marketing");
  
  const [media, setMedia] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);

  const scrollContainerRef = (null as any); 

  useEffect(() => {
    setScheduleMessage("");
  }, [composerMessage]);

  useEffect(() => {
    const fetchWhatsappTemplates = async () => {
      try {
        const { whatsappApi } = await import("@/lib/api/whatsapp");
        const res = await whatsappApi.getTemplates();
        const approved = res.filter((t: any) => t.status === "APPROVED");
        setWhatsappTemplates(approved);
      } catch (err) {
        console.error("Failed to fetch WhatsApp templates:", err);
      }
    };
    fetchWhatsappTemplates();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => whatsappApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);

      const newMedia = results
        .filter(res => res.status === 'success')
        .map(res => ({
          url: res.data.url,
          type: res.data.mediaType,
          originalName: res.data.originalName
        }));

      setMedia(prev => [...prev, ...newMedia]);
    } catch (err: any) {
      alert("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const getMediaIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || type === 'document') return <FileText className="w-8 h-8 text-red-500" />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type === 'video') return <Video className="w-8 h-8 text-blue-500" />;
    return <ImageIcon className="w-8 h-8 text-green-500" />;
  };

  const handleSchedule = async () => {
    if (!campaignTitle || !selectedGroup || !scheduleDate || !scheduleTime) return;

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

    if (scheduledDateTime.getTime() <= Date.now()) {
      alert("Please select a future time");
      return;
    }

    // Calculate cost for scheduling
    const count = selectedContacts.length > 0
      ? selectedContacts.length
      : (composerGroups.find(g => g.name === selectedGroup)?.contacts || 0);

    const PRICING = {
      utility: 0.50,
      marketing: 0.82
    };

    const cost = count * PRICING[templateType];

    const success = await onSchedule(
      campaignTitle,
      selectedGroup,
      scheduledDateTime.toISOString(),
      scheduleMessage,
      selectedContacts.length > 0 ? selectedContacts : undefined,
      cost,
      templateName,
      templateParams,
      media
    );

    if (success) {
      setShowScheduler(false);
      setShowSuccess(true);

      setCampaignTitle("");
      setScheduleDate("");
      setScheduleTime("");
      setScheduleMessage("");
      setSelectedContacts([]);
      setMedia([]);
      setTemplateName("");
      setTemplateParams(undefined);
      setTemplateBodyVariables([]);

      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (

    <div className="flex justify-between items-center mb-8 relative">

      <div>
        <h1 className="text-2xl font-bold text-black">
          Send Bulk Message
        </h1>

        <p className="text-gray-500 text-sm">
          Manage and Run Bulk Messaging Campaign
        </p>
      </div>

      <div className="relative">

        <button
          suppressHydrationWarning
          onClick={() => setShowScheduler(!showScheduler)}
          className="flex items-center gap-2 bg-[#065A4C] text-white px-5 py-2 rounded-md hover:opacity-90 transition shadow"
        >
          <FaClock />
          Schedule Campaign
        </button>

        {showScheduler && (

          <div className="absolute right-0 top-12 w-80 bg-white border border-[#065A4C] rounded-lg shadow-xl p-4 z-40">

            <label className="text-sm text-gray-600 font-medium">
              Campaign Title
            </label>

            <input
              suppressHydrationWarning
              type="text"
              placeholder="Example: Festival Sale"
              className="w-full border border-[#065A4C] rounded p-2 mt-1 mb-3"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
            />

            <label className="text-sm text-gray-600 font-medium">
              Select Contact Group
            </label>

            <div className="relative">
              <select
                suppressHydrationWarning
                className="w-full border border-[#065A4C] rounded p-2 pr-8 mt-1 mb-3 bg-white appearance-none"
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedContacts([]);
                }}
              >
                <option value="">Select group...</option>

                {composerGroups.map((g, i) => (
                  <option key={i} value={g.name}>
                    {g.name}
                  </option>
                ))}

              </select>

              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 border border-[#065A4C] text-[#065A4C] rounded p-2 mb-3 hover:bg-[#065A4C]/5 transition-colors font-semibold py-2.5"
            >
              <Users className="w-4 h-4" />
              {selectedContacts.length > 0 ? `Selected ${selectedContacts.length} Contacts` : "Select Contacts"}
            </button>

            <label className="text-sm text-gray-600 font-medium">
              Date
            </label>

            <input
              suppressHydrationWarning
              type="date"
              className="w-full border border-[#065A4C] rounded p-2 mt-1 mb-3"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />

            <label className="text-sm text-gray-600 font-medium">
              Time
            </label>

            <input
              suppressHydrationWarning
              type="time"
              className="w-full border border-[#065A4C] rounded p-2 mt-1 mb-4"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />

            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600 font-medium">
                Message
              </label>

              <select
                className="text-[10px] border border-[#065A4C] rounded px-1 py-0.5 bg-white outline-none w-32"
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setTemplateName(selectedName);
                  if (!selectedName) {
                    setTemplateBodyVariables([]);
                    setTemplateParams(undefined);
                    return;
                  }
                  const template = whatsappTemplates.find(t => t.name === selectedName);
                  if (template) {
                    if (template.category) {
                      const cat = template.category.toLowerCase();
                      if (cat === 'marketing' || cat === 'utility') {
                        setTemplateType(cat as "marketing" | "utility");
                      }
                    }
                    if (template.components) {
                      const body = template.components.find((c: any) => c.type === "BODY");
                      if (body) {
                        setScheduleMessage(body.text);
                        // Var parsing logic
                        const bodyMatches = body.text.match(/\{\{\d+\}\}/g);
                        if (bodyMatches) {
                          const uniqueVars = Array.from(new Set(bodyMatches));
                          const newVars = new Array(uniqueVars.length).fill("");
                          setTemplateBodyVariables(newVars);
                          setTemplateParams({ body: newVars, buttons: [] });
                        } else {
                          setTemplateBodyVariables([]);
                          setTemplateParams(undefined);
                        }
                      } else if (template.bodyText) {
                        setScheduleMessage(template.bodyText);
                        setTemplateBodyVariables([]);
                        setTemplateParams(undefined);
                      }
                    } else if (template.bodyText) {
                      setScheduleMessage(template.bodyText);
                      setTemplateBodyVariables([]);
                      setTemplateParams(undefined);
                    }
                  }
                }
                }
                defaultValue=""
              >
                <option value="">WhatsApp Template...</option>
                {whatsappTemplates.map((t, idx) => (
                  <option key={idx} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <textarea
              suppressHydrationWarning
              placeholder="Write your message here..."
              className="w-full border border-[#065A4C] rounded p-2 mt-1 mb-2 h-24 resize-none text-sm"
              value={scheduleMessage}
              onChange={(e) => setScheduleMessage(e.target.value)}
            />

            {/* Template Variables */}
            {templateBodyVariables.length > 0 && (
              <div className="mb-4 space-y-2 border-t pt-2 max-h-32 overflow-y-auto no-scrollbar">
                <p className="text-[9px] font-black text-[#065A4C] uppercase tracking-widest mb-1">Variables</p>
                {templateBodyVariables.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-[#065A4C]/5 text-[#065A4C] px-1.5 py-1 rounded-md border border-[#065A4C]/10 min-w-[30px] text-center">
                      {"{{" + (idx + 1) + "}}"}
                    </span>
                    <input
                      type="text"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-[#065A4C] transition-all"
                      placeholder={`Value ${idx + 1}`}
                      value={val}
                      onChange={(e) => {
                        const newVars = [...templateBodyVariables];
                        newVars[idx] = e.target.value;
                        setTemplateBodyVariables(newVars);
                        setTemplateParams({ ...templateParams, body: newVars });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Media Attachment section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-[#065A4C] uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity group">
                  <Paperclip className="w-3 h-3 group-hover:rotate-45 transition-transform" /> 
                  Attach Media
                  <input type="file" className="hidden" onChange={handleFileChange} multiple accept="image/*,application/pdf,video/*" />
                </label>
                {uploading && <Loader2 className="w-3 h-3 animate-spin text-[#065A4C]" />}
              </div>

              {media.length > 0 && (
                <div className="relative group/carousel pt-1 border-t">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 w-full max-w-full">
                    {media.map((item, index) => (
                      <div key={index} className="flex-shrink-0 relative w-16 h-16 rounded-xl border-2 border-white bg-white group/item overflow-hidden shadow-sm hover:border-[#065A4C] transition-all">
                        <div className="absolute inset-0 flex items-center justify-center scale-50">
                          {item.type === 'image' ? (
                            <img src={item.url} alt="media" className="w-full h-full object-cover scale-[2]" />
                          ) : (
                            getMediaIcon(item.type, item.originalName)
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedPreviewMedia(item); setIsPreviewModalOpen(true); }} className="p-1 bg-white rounded-lg text-[#065A4C] hover:scale-110 transition-transform"><Eye className="w-3 h-3" /></button>
                          <button onClick={() => removeMedia(index)} className="p-1 bg-white rounded-lg text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4 bg-[#25D366]/5 p-2 rounded border border-[#25D366]/10">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#065A4C] font-bold uppercase tracking-tight">Category</span>
                <span className="text-xs font-bold text-[#065A4C] capitalize">{templateType}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-[#065A4C] font-bold uppercase tracking-tight">Est. Cost</span>
                <span className="text-sm font-black text-[#065A4C]">
                  ₹{((selectedContacts.length > 0
                    ? selectedContacts.length
                    : (composerGroups.find(g => g.name === selectedGroup)?.contacts || 0)) * (templateType === 'marketing' ? 0.82 : 0.50)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              suppressHydrationWarning
              onClick={handleSchedule}
              className="w-full bg-[#065A4C] text-white py-2 rounded hover:opacity-90 transition font-bold"
            >
              Schedule
            </button>

          </div>

        )}

      </div>

      {showSuccess && (

        <div className="absolute right-0 top-24 w-64 bg-[#065A4C] text-white p-4 rounded-lg shadow-xl z-[9999]">

          <div className="flex flex-col items-center text-center gap-1">

            <span className="text-2xl">Done</span>

            <p className="font-semibold">
              Campaign Scheduled
            </p>

            <p className="text-sm opacity-90">
              Your campaign will be sent at the selected time.
            </p>

          </div>

        </div>

      )}

      <ContactSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedGroup={selectedGroup}
        selectedContacts={selectedContacts}
        onSelectionChange={setSelectedContacts}
      />
      <MediaPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        url={selectedPreviewMedia?.url || ""}
        type={selectedPreviewMedia?.type || ""}
        originalName={selectedPreviewMedia?.originalName}
      />
    </div>

  );

}