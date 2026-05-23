"use client";

import { useState, useEffect, useRef } from "react";
import { Users, ChevronLeft, ChevronRight, Eye, Trash2, FileText, Video, Image as ImageIcon } from "lucide-react";
import { whatsappApi } from "@/lib/api/whatsapp";
import ContactSelectorModal from "../message/ContactSelectorModal";
import MediaPreviewModal from "../message/MediaPreviewModal";

interface Props {
  group: string;
  message: string;
  media: any[];
  onGroupChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onMediaChange: (media: any[]) => void;
  contactIds: string[];
  onContactIdsChange: (ids: string[]) => void;
  onSelectionInfoChange?: (info: { totalRecipients: number }) => void;
  templateType: "utility" | "marketing";
  onTemplateTypeChange: (type: "utility" | "marketing") => void;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  templateParams: any;
  onTemplateParamsChange: (params: any) => void;
}

export default function SendToBox({
  group,
  message,
  media,
  onGroupChange,
  onMessageChange,
  onMediaChange,
  contactIds,
  onContactIdsChange,
  onSelectionInfoChange,
  templateType,
  onTemplateTypeChange,
  templateName,
  onTemplateNameChange,
  templateParams,
  onTemplateParamsChange
}: Props) {
  const [tab, setTab] = useState("preview");
  const [groupData, setGroupData] = useState<{ name: string; count: number }[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [groups, setGroups] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);

  const [templateBodyVariables, setTemplateBodyVariables] = useState<string[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxLength = 5000;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
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

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await whatsappApi.getGroups();
        if (res.status === 'success' && res.data) {
          setGroupData(res.data.groups || []);
          setTotalContacts(res.data.totalContacts || 0);
          const names = res.data.groups?.map((g: any) => g.name) || [];
          setGroups(names);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/composer/templates`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
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

    fetchGroups();
    fetchTemplates();
    fetchWhatsappTemplates();
  }, []);

  useEffect(() => {
    let count = 0;
    if (contactIds.length > 0) {
      count = contactIds.length;
    } else if (group === "ALL") {
      count = totalContacts;
    } else if (group) {
      const g = groupData.find(gd => gd.name === group);
      count = g ? g.count : 0;
    }

    if (onSelectionInfoChange) {
      onSelectionInfoChange({ totalRecipients: count });
    }
  }, [group, contactIds, totalContacts, groupData, onSelectionInfoChange]);

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

      onMediaChange([...media, ...newMedia]);
    } catch (err: any) {
      alert("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    onMediaChange(media.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="border border-[#075E54] rounded-lg p-6">
        <p className="font-medium mb-2">Send to :</p>

        <div className="flex gap-4 items-center">

          <div className="relative w-72">
            <select
              className="border rounded-md px-4 pr-10 py-2 w-full appearance-none"
              value={group}
              onChange={(e) => {
                onGroupChange(e.target.value);
                onContactIdsChange([]);
              }}
            >
              <option value="">Select Contacts / Group</option>
              <option value="ALL">All Contacts</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            onClick={() => {
              if (!group) {
                alert("Please select a group first.");
                return;
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2 border border-[#075E54] text-[#075E54] rounded-md font-normal text-sm hover:bg-[#075E54]/5 transition-colors whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            {contactIds.length > 0 ? `Selected ${contactIds.length}` : "Select Contacts"}
          </button>
        </div>

        <div className="flex gap-6 mb-4 mt-6">
          <button
            onClick={() => setTab("preview")}
            className={`pb-1 border-b-2 ${tab === "preview"
              ? "border-[#075E54] text-[#075E54] font-medium"
              : "border-transparent text-gray-500"
              }`}
          >
            Message Preview
          </button>
          <button
            onClick={() => setTab("template")}
            className={`pb-1 border-b-2 ${tab === "template"
              ? "border-[#075E54] text-[#075E54] font-medium"
              : "border-transparent text-gray-500"
              }`}
          >
            Saved Templates
          </button>
        </div>

        {tab === "preview" && (
          <div className="border border-[#075E54] rounded-md overflow-hidden bg-white">
            <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">WhatsApp Template:</span>
              <select
                className="text-xs border border-[#075E54] rounded px-2 py-1 bg-white outline-none max-w-[200px]"
                onChange={(e) => {
                  const selectedName = e.target.value;
                  onTemplateNameChange(selectedName);
                  if (!selectedName) {
                    setTemplateBodyVariables([]);
                    onTemplateParamsChange(undefined);
                    return;
                  }
                  const template = whatsappTemplates.find(t => t.name === selectedName);
                  if (template) {
                    if (template.category) {
                      const category = template.category.toLowerCase();
                      if (category === 'marketing' || category === 'utility') {
                        onTemplateTypeChange(category as "marketing" | "utility");
                      }
                    }
                    if (template.components) {
                      const body = template.components.find((c: any) => c.type === "BODY");
                      if (body) {
                        onMessageChange(body.text);
                        // Var parsing logic
                        const bodyMatches = body.text.match(/\{\{\d+\}\}/g);
                        if (bodyMatches) {
                          const uniqueVars = Array.from(new Set(bodyMatches));
                          const newVars = new Array(uniqueVars.length).fill("");
                          setTemplateBodyVariables(newVars);
                          onTemplateParamsChange({ body: newVars, buttons: [] });
                        } else {
                          setTemplateBodyVariables([]);
                          onTemplateParamsChange(undefined);
                        }
                      } else if (template.bodyText) {
                        onMessageChange(template.bodyText);
                        setTemplateBodyVariables([]);
                        onTemplateParamsChange(undefined);
                      }
                    } else if (template.bodyText) {
                      onMessageChange(template.bodyText);
                      setTemplateBodyVariables([]);
                      onTemplateParamsChange(undefined);
                    }
                  }
                }}
                value={templateName}
              >
                <option value="">Select template...</option>
                {whatsappTemplates.map((t, idx) => (
                  <option key={idx} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                placeholder={`Hello {Name},
Thank you for being a valued customer.
We truly appreciate your support and look forward to serving you again!`}
                value={message}
                maxLength={maxLength}
                onChange={(e) => onMessageChange(e.target.value)}
                className="w-full h-28 outline-none text-sm resize-none"
              />

              {/* Template Variables */}
              {templateBodyVariables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-[10px] font-black text-[#075E54] uppercase tracking-widest mb-1">Template Variables</p>
                  {templateBodyVariables.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-[#075E54]/5 text-[#075E54] px-2 py-1.5 rounded-lg border border-[#075E54]/10 min-w-[40px] text-center">
                        {"{{" + (idx + 1) + "}}"}
                      </span>
                      <input
                        type="text"
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] transition-all"
                        placeholder={`Enter value for variable ${idx + 1}...`}
                        value={val}
                        onChange={(e) => {
                          const newVars = [...templateBodyVariables];
                          newVars[idx] = e.target.value;
                          setTemplateBodyVariables(newVars);
                          onTemplateParamsChange({ ...templateParams, body: newVars });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {media.length > 0 && (
                <div className="mt-4 relative group/carousel pt-3 border-t">
                  {/* Left Arrow */}
                  <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 rounded-full shadow-md border border-gray-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#075E54]" />
                  </button>

                  {/* Scrollable Container */}
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-6 w-full no-scrollbar max-w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {media.map((item, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 relative w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 group/item overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt="media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getMediaIcon(item.type, item.originalName)
                          )}
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedPreviewMedia(item);
                                setIsPreviewModalOpen(true);
                              }}
                              className="p-1 bg-white rounded-full text-[#075E54] hover:bg-[#075E54] hover:text-white transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeMedia(index)}
                              className="p-1 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* File Extension Badge */}
                        <div className="absolute bottom-1 right-1 px-1 bg-black/50 text-white text-[8px] rounded font-bold uppercase">
                          {item.originalName?.split('.').pop() || item.type}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/80 rounded-full shadow-md border border-gray-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5 text-[#075E54]" />
                  </button>
                </div>
              )}
            </div>


            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">

              <label className="flex items-center gap-2 text-gray-400 hover:text-[#075E54] cursor-pointer transition-colors group">

                <div className="bg-gray-100 p-2 rounded-lg transition-colors group-hover:bg-[#075E54]/10">
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-[#075E54] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>

                <span className="text-sm font-bold">
                  Attach Media
                </span>

                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*,audio/*"
                  multiple
                />
              </label>

              <div className="flex items-center gap-3">
                {uploading && (
                  <span className="text-xs text-[#075E54] font-bold animate-pulse">Uploading...</span>
                )}
                <span className="text-xs text-gray-400 font-bold">
                  {message.length}/{maxLength}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "template" && (
          <div className="border border-[#075E54] rounded-md p-4 min-h-[160px] bg-white">
            {loadingTemplates ? (
              <div className="flex items-center justify-center h-20 text-gray-400">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-gray-400 font-medium italic">No saved templates found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      onMessageChange(t.message);
                      if (t.media) onMediaChange(t.media);
                      setTab("preview");
                    }}
                    className="p-4 border border-gray-100 rounded-2xl cursor-pointer hover:border-[#075E54] hover:shadow-md transition-all duration-200 bg-gray-50/30 flex flex-col h-full min-w-[150px]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-[#075E54] text-[10px] uppercase tracking-wider bg-[#075E54]/5 px-2 py-0.5 rounded">
                        {t.name}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-1">
                      {t.message}
                    </p>

                    {t.media && t.media.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-gray-100">
                        {t.media.slice(0, 4).map((m: any, idx: number) => (
                          <div key={idx} className="w-8 h-8 rounded-md bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {m.type === 'image' ? (
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="scale-75">
                                {getMediaIcon(m.type, m.originalName)}
                              </div>
                            )}
                          </div>
                        ))}
                        {t.media.length > 4 && (
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200 shadow-sm">
                            +{t.media.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ContactSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedGroup={group === "ALL" ? "All contacts" : group}
        selectedContacts={contactIds}
        onSelectionChange={onContactIdsChange}
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