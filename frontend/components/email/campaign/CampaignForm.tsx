import React, { useState, useEffect, useRef } from "react";
import EmailEditor from "@/components/email/message/EmailEditor";
import { Users, Loader2, Paperclip, ChevronRight, Trash2, Eye, ChevronLeft, ImageIcon, FileText, Video } from "lucide-react";
import MediaPreviewModal from "@/components/message/MediaPreviewModal";
import ContactSelectorModal from "@/components/message/ContactSelectorModal";

interface CampaignFormProps {
  campaignData: any;
  updateField: (field: string, value: string) => void;
  groups: any[];
  templates: any[];
  handleSendCampaign: () => void;
  isSending: boolean;
  totalCost: string;
  contactIds: string[];
  setContactIds: (ids: string[]) => void;
  media: any[];
  setMedia: (media: any[]) => void;
}

export default function CampaignForm({
  campaignData,
  updateField,
  groups,
  templates,
  handleSendCampaign,
  isSending,
  totalCost,
  contactIds,
  setContactIds,
  media,
  setMedia
}: CampaignFormProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMediaPreviewModalOpen, setIsMediaPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recipientsCount, setRecipientsCount] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    calculateRecipients();
  }, [campaignData.recipient, contactIds]);

  const calculateRecipients = async () => {
    if (contactIds.length > 0) {
      setRecipientsCount(contactIds.length);
    } else if (campaignData.recipient) {
      try {
        const { apiFetch } = await import('@/lib/api');
        const res = await apiFetch(`/contacts?group=${encodeURIComponent(campaignData.recipient)}&limit=1`);
        setRecipientsCount(res.total || 0);
      } catch (error) {
        setRecipientsCount(0);
      }
    } else {
      setRecipientsCount(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { whatsappApi } = await import('@/lib/api/whatsapp');
      const uploadPromises = Array.from(files).map(file => whatsappApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);

      const newMedia = results
        .filter(res => res.status === 'success')
        .map(res => ({
          url: res.data.url,
          type: res.data.mediaType,
          originalName: res.data.originalName
        }));

      setMedia([...media, ...newMedia]);
    } catch (err: any) {
      alert("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getMediaIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || type === 'document') return <FileText className="w-8 h-8 text-red-500" />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type === 'video') return <Video className="w-8 h-8 text-blue-500" />;
    return <ImageIcon className="w-8 h-8 text-green-500" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="px-2 py-1 border-b border-[#065A4C]">
        <h2 className="text-xl font-bold text-[#065A4C]">Create Campaign</h2>
      </div>

      {/* BODY */}
      <div className="p-4 pl-2 space-y-3 flex-1 overflow-y-auto no-scrollbar">
        {/* Campaign Name */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block uppercase tracking-wider">
            Campaign Name
          </label>
          <input
            type="text"
            placeholder="e.g. Summer Sale 2024"
            className="w-full px-3 py-2 border border-[#065A4C] rounded-md text-sm focus:outline-none focus:border-[#065A4C]"
            value={campaignData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-lg font-semibold text-gray-700 mb-1 block">
            Subject
          </label>
          <input
            type="text"
            placeholder="Email Subject"
            className="w-full px-3 py-2 border border-[#065A4C] rounded-md text-sm focus:outline-none focus:border-[#065A4C]"
            value={campaignData.subject}
            onChange={(e) => updateField("subject", e.target.value)}
          />
        </div>

        {/* Send To */}
        <div>
          <label className="text-lg font-semibold text-gray-700 mb-1 block">
            Send To
          </label>

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
            {/* LEFT */}
            <div className="space-y-2">
              <select
                className="w-full px-3 py-2 border border-[#065A4C] rounded-md text-m bg-white outline-none"
                value={campaignData.recipient}
                onChange={(e) => updateField("recipient", e.target.value)}
              >
                <option value="">Select Target Group</option>
                <option value="ALL">All Contacts</option>
                {groups.map((g, idx) => (
                  <option key={idx} value={g.name}>{g.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                disabled={!campaignData.recipient}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#065A4C] text-[#065A4C] rounded-xl text-sm font-bold hover:bg-[#065A4C] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                {contactIds.length > 0 ? `Selected (${contactIds.length})` : "Select Individual Contacts"}
              </button>
            </div>

            {/* RIGHT CARD */}
            <div className="bg-[#f0f4f4] rounded-md border border-[#065A4C] flex overflow-hidden h-[80px]">

              <div className="flex-1 flex flex-col items-center justify-center border-r border-[#065A4C]">
                <span className="text-s text-gray-400">
                  Cost/Email
                </span>
                <span className="text-lg font-semibold text-[#065A4C]">
                  ₹0.10
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-s text-gray-400">
                  Total Cost
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{totalCost}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
            <label className="text-sm font-black text-[#065A4C] uppercase tracking-wider">
              Email Body
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Template:
              </span>
              <select
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const template = templates.find(t => t._id === selectedId);
                  if (template) {
                    updateField("subject", template.subject || "");
                    updateField("message", template.body || "");
                    if (template.attachments && template.attachments.length > 0) {
                      setMedia(template.attachments);
                    }
                  }
                }}
                className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-[#065A4C]"
              >
                <option value="">None</option>
                {templates?.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-[#065A4C]/20 rounded-2xl overflow-hidden bg-white min-h-[300px] shadow-sm focus-within:ring-2 focus-within:ring-[#065A4C]/10 transition-all">
            <EmailEditor
              content={campaignData.message}
              setBody={(val: string) => updateField("message", val)}
            />
          </div>

          {/* Media Carousel */}
          {media.length > 0 && (
            <div className="p-3 bg-[#065A4C]/5 border-t border-b border-[#065A4C]/10 animate-in slide-in-from-bottom-2 duration-300 relative group/carousel min-w-0 rounded-2xl">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[10px] font-black text-[#065A4C] uppercase tracking-widest">Added Attachments ({media.length})</span>
              </div>

              <div className="relative flex items-center min-w-0">
                <button
                  onClick={() => scroll('left')}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-lg border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#065A4C] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth w-full max-w-full"
                >
                  {media?.map((item, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 relative w-24 h-24 rounded-xl border-2 border-white bg-white group/item overflow-hidden shadow-sm hover:border-[#065A4C] transition-all"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <img src={item.url} alt="media" className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                        ) : (
                          <div className="transition-transform duration-500 group-hover/item:scale-110">
                            {getMediaIcon(item.type, item.originalName)}
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedPreviewMedia(item); setIsMediaPreviewModalOpen(true); }} className="p-1.5 bg-white rounded-lg text-[#065A4C] hover:bg-[#065A4C] hover:text-white transition-all transform hover:scale-110">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeMedia(index)} className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scroll('right')}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-lg border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#065A4C] hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            className="bg-[#065A4C] hover:bg-[#044439] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-50"
            onClick={handleSendCampaign}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="animate-spin w-4 h-4" /> : "Send Email"}
          </button>

          <label className="cursor-pointer flex items-center gap-2 text-[#065A4C] hover:text-[#044439] px-4 py-2 border-2 border-[#065A4C] rounded-xl font-bold text-sm transition-all group">
            <Paperclip className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            {uploading ? "Uploading..." : "Attach Media"}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
              accept="image/*,application/pdf,video/*"
            />
          </label>
        </div>
      </div>

      <ContactSelectorModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedGroup={campaignData.recipient}
        selectedContacts={contactIds}
        onSelectionChange={setContactIds}
      />

      <MediaPreviewModal
        isOpen={isMediaPreviewModalOpen}
        onClose={() => setIsMediaPreviewModalOpen(false)}
        url={selectedPreviewMedia?.url || ""}
        type={selectedPreviewMedia?.type || ""}
        originalName={selectedPreviewMedia?.originalName}
      />
    </div>
  );
}
