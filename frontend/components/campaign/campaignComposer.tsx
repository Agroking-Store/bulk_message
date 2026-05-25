"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FaPaperclip } from "react-icons/fa";
import { whatsappApi } from "@/lib/api/whatsapp";
import { apiFetch } from "@/lib/api";
import { Loader2, Users, ChevronLeft, ChevronRight, Eye, Trash2, FileText, Video, Image as ImageIcon } from "lucide-react";
import ContactSelectorModal from "../message/ContactSelectorModal";
import MediaPreviewModal from "../message/MediaPreviewModal";
import InsufficientBalanceModal from "../payments/InsufficientBalanceModal";

interface CampaignComposerProps {
  groups: any[];
}

export default function CampaignComposer({ groups }: CampaignComposerProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<{
    campaignName: string;
    group: string;
    message: string;
    media: { url: string; type: string; originalName?: string }[];
    contactIds: string[];
  }>({ campaignName: "", group: "", message: "", media: [], contactIds: [] });

  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<{ url: string; type: string; originalName?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [templateFooter, setTemplateFooter] = useState<string | null>(null);
  const [templateButtons, setTemplateButtons] = useState<any[]>([]);
  const [templateBodyVariables, setTemplateBodyVariables] = useState<string[]>([]);
  const [templateButtonVariables, setTemplateButtonVariables] = useState<{ index: number; url_suffix: string }[]>([]);

  const [templateType, setTemplateType] = useState<"utility" | "marketing">("utility");
  const [contactCount, setContactCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);

  const PRICING = {
    utility: 0.50,
    marketing: 0.82
  };

  const fetchWhatsappTemplates = async () => {
    try {
      const res = await whatsappApi.getTemplates();
      const approved = res.filter((t: any) => t.status === "APPROVED");
      setWhatsappTemplates(approved);
    } catch (err) {
      console.error("Failed to fetch WhatsApp templates:", err);
    }
  };

  const handleTemplateSelection = (selectedName: string, templatesList: any[] = whatsappTemplates) => {
    setSelectedTemplate(selectedName);
    if (!selectedName) {
      setTemplateFooter(null);
      setTemplateButtons([]);
      setTemplateBodyVariables([]);
      setTemplateButtonVariables([]);
      return;
    }
    const template = templatesList.find(t => t.name === selectedName);
    if (template) {
      if (template.category) {
        const category = template.category.toLowerCase();
        if (category === 'marketing' || category === 'utility') {
          setTemplateType(category as "marketing" | "utility");
        }
      }

      if (template.components) {
        const body = template.components.find((c: any) => c.type === "BODY");
        const footer = template.components.find((c: any) => c.type === "FOOTER");
        const buttons = template.components.find((c: any) => c.type === "BUTTONS");

        if (body) {
          setFormData(prev => ({ ...prev, message: body.text }));
          const bodyMatches = body.text.match(/\{\{\d+\}\}/g);
          if (bodyMatches) {
            const uniqueVars = Array.from(new Set(bodyMatches));
            setTemplateBodyVariables(new Array(uniqueVars.length).fill(""));
          } else {
            setTemplateBodyVariables([]);
          }
        } else if (template.bodyText) {
          setFormData(prev => ({ ...prev, message: template.bodyText }));
          setTemplateBodyVariables([]);
        }

        setTemplateFooter(footer ? footer.text : null);
        setTemplateButtons(buttons ? buttons.buttons : []);

        const btnVars: { index: number; url_suffix: string }[] = [];
        if (buttons && buttons.buttons) {
          buttons.buttons.forEach((btn: any, idx: number) => {
            if (btn.type === "URL" && btn.url && btn.url.includes("{{1}}")) {
              btnVars.push({ index: idx, url_suffix: "" });
            }
          });
        }
        setTemplateButtonVariables(btnVars);

      } else if (template.bodyText) {
        setFormData(prev => ({ ...prev, message: template.bodyText }));
        setTemplateFooter(null);
        setTemplateButtons([]);
        setTemplateBodyVariables([]);
        setTemplateButtonVariables([]);
      }

      if (searchParams.get("templateName") === selectedName) {
        setFormData(prev => ({
          ...prev,
          campaignName: prev.campaignName || `Campaign - ${selectedName}`
        }));
      }
    }
  };

  useEffect(() => {
    fetchWhatsappTemplates();
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const templateName = searchParams.get("templateName");
    if (templateName && whatsappTemplates.length > 0) {
      handleTemplateSelection(templateName, whatsappTemplates);
    }
  }, [searchParams, whatsappTemplates]);

  useEffect(() => {
    let count = 0;
    if (formData.contactIds.length > 0) {
      count = formData.contactIds.length;
    } else if (formData.group === "All contacts" || formData.group === "ALL") {
      const allGroup = Array.isArray(groups) ? groups.find(g => g.name === "All contacts" || g.name === "ALL") : null;
      count = allGroup ? allGroup.contacts : 0;
    } else if (formData.group) {
      const group = Array.isArray(groups) ? groups.find(g => g.name === formData.group) : null;
      count = group ? group.contacts : 0;
    }
    setContactCount(count);
    setEstimatedCost(count * PRICING[templateType]);
  }, [formData.group, formData.contactIds, templateType, groups]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getFileIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || type === 'document') return <FileText className="w-8 h-8 text-red-500" />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type === 'video') return <Video className="w-8 h-8 text-blue-500" />;
    return <ImageIcon className="w-8 h-8 text-green-500" />;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
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

      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...newMedia]
      }));
    } catch (err: any) {
      setError("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.campaignName || !formData.group || !formData.message) {
      setError("Please fill in all fields (Campaign Name, Group, Message).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const templateParams = {
        body: templateBodyVariables,
        buttons: templateButtonVariables
      };
      await whatsappApi.createCampaign({
        ...formData,
        templateType,
        templateName: selectedTemplate || undefined,
        templateParams: (templateBodyVariables.length > 0 || templateButtonVariables.length > 0) ? templateParams : undefined
      });
      setSuccess("Campaign triggered successfully!");
      window.dispatchEvent(new Event('walletUpdated'));
      setFormData({
        campaignName: "",
        group: formData.group,
        message: "",
        media: [],
        contactIds: []
      });
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);

      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
        setError(null);
        try {
          const balanceRes = await apiFetch("/wallet/balance");
          if (balanceRes && typeof balanceRes.data?.balance === 'number') {
            setCurrentBalance(balanceRes.data.balance);
          }
        } catch (bErr) {
          console.error("Failed to fetch balance for modal:", bErr);
        }
        setIsBalanceModalOpen(true);
      } else {
        setError(errMsg || "Something went wrong while sending campaign");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#065A4C] rounded-lg p-5 bg-white shadow-sm">
      <h2 className="font-semibold text-xl mb-4 border-b-2 border-[#065A4C] pb-2 text-[#065A4C]">Create Campaign</h2>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-medium mb-4">{success}</div>}

      <div className="space-y-4">
        {/* Campaign Name Section */}
        <div>
          <h2 className="text-lg font-bold text-black mb-1">Campaign Name</h2>
          <input
            placeholder="e.g , Summer Sale 2024"
            className="border border-[#065A4C] rounded w-full p-2 outline-none"
            value={formData.campaignName}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
          />
        </div>

        {/* --- Send To Section --- */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-black mb-1">Send To</h2>

          <div className="flex gap-4 items-stretch">
            {/* Left Side: Uniform Input Group */}
            <div className="flex flex-col gap-3 flex-[1.2]">
              <div className="relative">
                <select
                  className="border border-[#065A4C] rounded-md w-full h-[45px] px-3 appearance-none bg-white focus:border-[#065A4C] focus:ring-1 focus:ring-[#065A4C] outline-none transition-all text-sm text-gray-700"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value, contactIds: [] })}
                >
                  <option value="">Select Target Group</option>
                  {groups.map((g, index) => (
                    <option key={index} value={g.name}>{g.name} ({g.contacts} contacts)</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!formData.group) return alert("Please select a group first.");
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full h-[45px] border border-[#065A4C] bg-white text-[#065A4C] rounded-md font-semibold text-sm hover:bg-gray-50 hover:border-[#065A4C] transition-all"
              >
                <Users className="w-4 h-4 text-[#065A4C]" />
                {formData.contactIds.length > 0 ? `Selected: ${formData.contactIds.length}` : " Select Contacts"}
              </button>
            </div>

            {/* Right Side: Professional Summary & Pricing */}
            <div className="flex flex-col flex-1 border border-gray-300 rounded-md overflow-hidden">

              {/* Cost & Recipients Header */}
              <div className="flex flex-1 items-center justify-around bg-[#065A4C]/10 px-4">
                <div className="text-center">
                  <p className="text-[12px] font-bold text-gray-900 ">Estimated Cost</p>
                  <p className="text-xl font-bold text-[#065A4C]">₹{estimatedCost.toFixed(2)}</p>
                </div>
                <div className="h-8 w-[1px] bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-[12px] font-bold text-gray-900 ">Recipients</p>
                  <p className="text-xl font-bold text-gray-800">{contactCount}</p>
                </div>
              </div>

              {/* Utility/Marketing Toggle (Bottom Segment) */}
              <div className="flex border-t border-gray-600 h-[45px]">
                <button
                  onClick={() => !selectedTemplate && setTemplateType("utility")}
                  disabled={!!selectedTemplate}
                  className={`flex-1 text-[12px] font-bold  transition-all ${templateType === "utility"
                    ? "bg-[#065A4C] text-white"
                    : "bg-gray-50 text-gray-400 hover:text-gray-600"
                    } ${selectedTemplate ? "cursor-not-allowed" : ""}`}
                >
                  Utility (₹0.50)
                </button>
                <button
                  onClick={() => !selectedTemplate && setTemplateType("marketing")}
                  disabled={!!selectedTemplate}
                  className={`flex-1 text-[12px] font-bold  transition-all border-l border-gray-600 ${templateType === "marketing"
                    ? "bg-[#065A4C] text-white"
                    : "bg-gray-50 text-gray-400 hover:text-gray-600"
                    } ${selectedTemplate ? "cursor-not-allowed" : ""}`}
                >
                  Marketing (₹0.82)
                </button>
              </div>

            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold text-black">Message</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">USE TEMPLATE:</span>
              <select
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none"
                value={selectedTemplate}

                onChange={(e) => handleTemplateSelection(e.target.value)}
                defaultValue=""
              >
                <option value="">Select template...</option>
                {whatsappTemplates.map((t, idx) => (
                  <option key={idx} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-3">
            <textarea
              placeholder="Write your WhatsApp message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full h-32 outline-none resize-none text-gray-800 text-sm"
            />

            {templateFooter && <div className="mt-1 text-xs text-gray-400 italic">{templateFooter}</div>}

            {/* Template Variables (Only shows if template has variables) */}
            {templateBodyVariables.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-[10px] font-black text-[#065A4C] uppercase tracking-widest mb-1">Template Variables</p>
                {templateBodyVariables.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-[#065A4C]/5 text-[#065A4C] px-2 py-1.5 rounded-lg border border-[#065A4C]/10 min-w-[40px] text-center">
                      {"{{" + (idx + 1) + "}}"}
                    </span>
                    <input
                      type="text"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#065A4C] focus:ring-1 focus:ring-[#065A4C] transition-all"
                      placeholder={`Enter value for variable ${idx + 1}...`}
                      value={val}
                      onChange={(e) => {
                        const newVars = [...templateBodyVariables];
                        newVars[idx] = e.target.value;
                        setTemplateBodyVariables(newVars);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}


            
            <div className="mt-2 border-t border-gray-200"></div>

            {/* Media Preview Carousel */}
            {formData.media.length > 0 && (
              <div className="relative group/carousel mt-2">
                <div className="flex items-center">
                  <button onClick={() => scroll('left')} className="absolute left-0 z-10 p-1 bg-white/80 rounded-full shadow-md border opacity-0 group-hover/carousel:opacity-100 transition-opacity"><ChevronLeft className="w-4 h-4 text-[#065A4C]" /></button>
                  <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto no-scrollbar py-2 w-full">
                    {formData.media.map((item, index) => (
                      <div key={index} className="flex-shrink-0 relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group/item">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.type === 'image' ? <img src={item.url} alt="media" className="w-full h-full object-cover" /> : getFileIcon(item.type, item.originalName)}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedPreviewMedia(item); setIsPreviewModalOpen(true); }} className="p-1 bg-white rounded-full text-[#065A4C]"><Eye className="w-3 h-3" /></button>
                          <button onClick={() => removeMedia(index)} className="p-1 bg-white rounded-full text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => scroll('right')} className="absolute right-0 z-10 p-1 bg-white/80 rounded-full shadow-md border opacity-0 group-hover/carousel:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4 text-[#065A4C]" /></button>
                </div>
              </div>
            )}

            <div className="mt-2 border-t border-gray-200"></div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="bg-gray-50 p-2 rounded-lg transition-colors group-hover:bg-[#065A4C]/10">
                    <FaPaperclip className="text-gray-400 group-hover:text-[#065A4C]" />
                  </div>
                  <span className="text-xs font-normal text-gray-400 group-hover:text-[#065A4C]">Attach Media</span>
                  <input type="file" className="hidden" onChange={handleFileChange} multiple />
                </label>
                {uploading && <Loader2 className="animate-spin w-4 h-4 text-[#065A4C]" />}
              </div>
              <span className="text-[10px] text-gray-500">
                Text: {formData.message.length}/5000 | Files: {formData.media.length}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            className="bg-[#065A4C] text-white px-6 py-2.5 rounded-md hover:opacity-90 transition font-bold"
            onClick={handleSubmit}
            disabled={loading || uploading}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Message"}
          </button>
        </div>
      </div>

      <ContactSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedGroup={formData.group} selectedContacts={formData.contactIds} onSelectionChange={(ids) => setFormData({ ...formData, contactIds: ids })} />
      <MediaPreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} url={selectedPreviewMedia?.url || ''} type={selectedPreviewMedia?.type || ''} originalName={selectedPreviewMedia?.originalName} />
      <InsufficientBalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} requiredAmount={estimatedCost} availableBalance={currentBalance} />
    </div>
  );
}