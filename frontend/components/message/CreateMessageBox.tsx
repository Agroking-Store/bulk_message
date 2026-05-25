"use client";

import React, { useState, useEffect, useRef } from "react";
import { whatsappApi } from "@/lib/api/whatsapp";
import { apiFetch } from "@/lib/api";
import { Users, ChevronLeft, ChevronRight, Eye, Trash2, FileText, Video, Image as ImageIcon } from "lucide-react";
import { FaPaperclip } from "react-icons/fa";
import ContactSelectorModal from "./ContactSelectorModal";
import MediaPreviewModal from "./MediaPreviewModal";
import InsufficientBalanceModal from "../payments/InsufficientBalanceModal";

const CreateMessageBox = () => {
  const [tab, setTab] = useState<"message">("message");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);
  const [templateFooter, setTemplateFooter] = useState<string | null>(null);
  const [templateButtons, setTemplateButtons] = useState<any[]>([]);
  const [templateBodyVariables, setTemplateBodyVariables] = useState<string[]>([]);
  const [templateButtonVariables, setTemplateButtonVariables] = useState<{ index: number; url_suffix: string }[]>([]);

  const [templateType, setTemplateType] = useState<"utility" | "marketing">("utility");
  const [contactCount, setContactCount] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);
  const [groupData, setGroupData] = useState<{ name: string; count: number }[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const PRICING = {
    utility: 0.50,
    marketing: 0.82
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const res = await whatsappApi.getGroups();
      if (res.status === "success" && res.data) {
        setGroupData(res.data.groups || []);
        setTotalContacts(res.data.totalContacts || 0);
        setGroups(res.data.groups?.map((g: any) => g.name) || []);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    let count = 0;
    if (selectedContacts.length > 0) {
      count = selectedContacts.length;
    } else if (selectedGroup === "ALL") {
      count = totalContacts;
    } else if (selectedGroup) {
      const group = groupData.find(g => g.name === selectedGroup);
      count = group ? group.count : 0;
    }
    setContactCount(count);
    setEstimatedCost(count * PRICING[templateType]);
  }, [selectedGroup, selectedContacts, templateType, groupData, totalContacts]);

  useEffect(() => {
    const fetchSavedTemplates = async () => {
      setLoadingTemplates(true);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/composer/templates`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "access_token"
              )}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setTemplates(data || []);
        }
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

    fetchSavedTemplates();
    fetchWhatsappTemplates();
  }, []);

  const nextTemplates = () => {
    if (startIndex + 3 >= templates.length) {
      setStartIndex(0);
    } else {
      setStartIndex(startIndex + 3);
    }
  };

  const handleTemplateSelection = (selectedName: string) => {
    setSelectedTemplate(selectedName);
    if (!selectedName) {
      setTemplateFooter(null);
      setTemplateButtons([]);
      setTemplateBodyVariables([]);
      setTemplateButtonVariables([]);
      return;
    }
    const template = whatsappTemplates.find(t => t.name === selectedName);
    if (template) {
      // Auto-set template type based on category for cost estimation
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
          setMessage(body.text);
          const bodyMatches = body.text.match(/\{\{\d+\}\}/g);
          if (bodyMatches) {
            const uniqueVars = Array.from(new Set(bodyMatches));
            setTemplateBodyVariables(new Array(uniqueVars.length).fill(""));
          } else {
            setTemplateBodyVariables([]);
          }
        } else if (template.bodyText) {
          setMessage(template.bodyText);
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
        setMessage(template.bodyText);
        setTemplateFooter(null);
        setTemplateButtons([]);
        setTemplateBodyVariables([]);
        setTemplateButtonVariables([]);
      }
    }
  };

  const prevTemplates = () => {
    if (startIndex - 3 < 0) {
      const lastIndex =
        Math.floor((templates.length - 1) / 3) * 3;
      setStartIndex(lastIndex);
    } else {
      setStartIndex(startIndex - 3);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map((file) =>
        whatsappApi.uploadMedia(file)
      );

      const results = await Promise.all(uploadPromises);

      const newMedia = results
        .filter((res) => res.status === "success")
        .map((res) => ({
          url: res.data.url,
          type: res.data.mediaType,
          originalName: res.data.originalName,
        }));

      setMediaList((prev) => [...prev, ...newMedia]);
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Removed old getFileIcon helper

  const handleSend = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    setLoading(true);

    const templateParams = {
      body: templateBodyVariables,
      buttons: templateButtonVariables
    };

    try {
      await apiFetch("/bulk/send", {
        method: "POST",
        body: JSON.stringify({
          message,
          templateType,
          group: selectedGroup || undefined,
          contactIds:
            selectedContacts.length > 0
              ? selectedContacts
              : undefined,
          media: mediaList,
          templateName: selectedTemplate || undefined,
          templateParams: (templateBodyVariables.length > 0 || templateButtonVariables.length > 0) ? templateParams : undefined
        }),
      });

      alert("Message sent successfully");
      window.dispatchEvent(new Event('walletUpdated'));
      window.dispatchEvent(new Event('messageSent'));

      setMessage("");
      setMediaList([]);
    } catch (err: any) {
      console.log("Send Error:", err);
      const errMsg = err.message || JSON.stringify(err);
      
      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
        // Fetch current balance to show in modal
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
        alert(errMsg || "Failed to send message");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    const name = prompt("Enter template name");
    if (!name) return;

    await apiFetch("/composer/template", {
      method: "POST",
      body: JSON.stringify({
        name,
        message,
        media: mediaList,
      }),
    });

    alert("Template saved successfully!");
  };

  return (
    <div className="mt-6 border border-[#075E54] rounded-xl p-6 md:p-8 bg-white shadow-sm space-y-6">

      <div>

        <div>
          {/* --- Send To Section --- */}
<div className="mb-2">
  <h2 className="text-lg font-bold text-black mb-1">
    Send To
  </h2>

  <div className="flex gap-4 items-stretch">

    {/* Left Side */}
    <div className="flex flex-col gap-3 flex-[1.2]">

      <div className="relative">
        <select
          className="border border-[#075E54] rounded-md w-full h-[45px] px-3 appearance-none bg-white focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none transition-all text-sm text-gray-700"
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setSelectedContacts([]);
          }}
        >
          <option value="">
            Select Target Group
          </option>

          <option value="ALL">
            All Contacts
          </option>

          {groups.map((group) => {
            const grp = groupData.find(
              (g) => g.name === group
            );

            return (
              <option
                key={group}
                value={group}
              >
                {group} ({grp?.count || 0} contacts)
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <button
        onClick={() => {
          if (!selectedGroup) {
            alert("Please select a group first.");
            return;
          }

          setIsModalOpen(true);
        }}
        className="flex items-center justify-center gap-2 w-full h-[45px] border border-[#075E54] bg-white text-[#075E54] rounded-md font-semibold text-sm hover:bg-gray-50 transition-all"
      >
        <Users className="w-4 h-4 text-[#075E54]" />

        {selectedContacts.length > 0
          ? `Selected: ${selectedContacts.length}`
          : "Select Contacts"}
      </button>

    </div>

    {/* Right Side */}
    <div className="flex flex-col flex-1 border border-gray-300 rounded-md overflow-hidden p-0">

      {/* Cost */}
      <div className="flex flex-1 items-center justify-around bg-[#075E54]/10 px-4">

        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-900">
            Estimated Cost
          </p>

          <p className="text-xl font-bold text-[#075E54]">
            ₹{estimatedCost.toFixed(2)}
          </p>
        </div>

        <div className="h-8 w-[1px] bg-gray-200" />

        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-900">
            Recipients
          </p>

          <p className="text-xl font-bold text-gray-800">
            {contactCount}
          </p>
        </div>

      </div>

      {/* Utility / Marketing */}
      <div className="flex border-t border-gray-600 h-[45px]  w-full">

        <button
          onClick={() =>
            !selectedTemplate &&
            setTemplateType("utility")
          }
          disabled={!!selectedTemplate}
          className={`flex-1 text-[12px] font-bold transition-all ${
            templateType === "utility"
              ? "bg-[#075E54] text-white"
              : "bg-gray-50 text-gray-400 hover:text-gray-600"
          }`}
        >
          Utility (₹0.50)
        </button>

        <button
          onClick={() =>
            !selectedTemplate &&
            setTemplateType("marketing")
          }
          disabled={!!selectedTemplate}
          className={`flex-1 text-[12px] font-bold transition-all border-l border-gray-600 ${
            templateType === "marketing"
              ? "bg-[#075E54] text-white"
              : "bg-gray-50 text-gray-400 hover:text-gray-600"
          }`}
        >
          Marketing (₹0.82)
        </button>

      </div>

    </div>

  </div>

            
          </div>
        </div>

      </div>

      {/* Tabs */}
<div className="flex gap-10 pt-2">
      

        <button
          onClick={() => setTab("message")}
          className={`pb-2 border-b-2 ${tab === "message"
            ? "border-[#075E54] text-[#075E54] font-bold"
            : "border-transparent text-gray-400"
            }`}
        >
          Write Message
        </button>

       

      </div>

      {/* MESSAGE BOX */}

      <div className="pt-2">

        {tab === "message" && (

          <div className="border border-[#075E54] rounded-xl p-5 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700">Message Content</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">WhatsApp Template:</span>
                <select
                  className="text-xs border border-[#075E54] rounded px-2 py-1 bg-white outline-none max-w-[150px]"
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

            <textarea
              placeholder="Type your message..."
              className="w-full h-32 outline-none resize-none"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
            />

            {templateFooter && (
              <div className="mt-1 text-xs text-gray-400">
                {templateFooter}
              </div>
            )}

            {templateBodyVariables.length > 0 && (
              <div className="mt-3 bg-[#075E54]/5 p-3 rounded-lg border border-[#075E54]/20">
                <h3 className="text-xs font-bold text-[#075E54] mb-2 uppercase tracking-wide">Body Variables</h3>
                {templateBodyVariables.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2 last:mb-0">
                    <span className="text-sm font-bold bg-[#075E54]/10 text-[#075E54] px-2 py-1 rounded">{"{{" + (idx + 1) + "}}"}</span>
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-[#075E54]"
                      placeholder={`Value for {{${idx + 1}}}`}
                      value={val}
                      onChange={(e) => {
                        const newVars = [...templateBodyVariables];
                        newVars[idx] = e.target.value;
                        setTemplateBodyVariables(newVars);
                      }}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-gray-500 mt-2 italic flex items-center gap-1.5">
                  <span className="bg-[#075E54] text-white text-[9px] font-black px-1 rounded-sm uppercase tracking-tighter">Tip</span>
                  Use <code className="bg-gray-200 px-1 rounded text-[#075E54] font-bold">{"{{name}}"}</code> or <code className="bg-gray-200 px-1 rounded text-[#075E54] font-bold">{"{{phone}}"}</code> to personalize.
                </p>
              </div>
            )}

            {templateButtons && templateButtons.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {templateButtons.map((btn: any, index: number) => {
                  let href = "#";
                  if (btn.type === "URL" && btn.url) {
                    href = btn.url;
                    if (href.includes("{{1}}")) {
                      const btnVar = templateButtonVariables.find(v => v.index === index);
                      href = href.replace("{{1}}", btnVar?.url_suffix || "");
                    }
                  } else if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
                    href = `tel:${btn.phone_number}`;
                  }

                  return (
                    <a
                      key={index}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-50 border border-gray-200 text-[#00a884] font-medium text-sm py-2 px-3 rounded-lg text-center flex items-center justify-center gap-2 max-w-sm hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                         if (btn.type === "COPY_CODE") {
                           e.preventDefault();
                           navigator.clipboard.writeText(btn.example?.[0] || "");
                           alert("Code copied!");
                         }
                      }}
                    >
                      {btn.type === "URL" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      )}
                      {btn.type === "PHONE_NUMBER" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      )}
                      {btn.type === "COPY_CODE" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      )}
                      {btn.text || "Button"}
                    </a>
                  );
                })}
              </div>
            )}

            {templateButtonVariables.length > 0 && (
              <div className="mt-3 bg-[#25D366]/5 p-3 rounded-lg border border-[#25D366]/20">
                <h3 className="text-xs font-bold text-[#25D366] mb-2 uppercase tracking-wide">Button Parameters</h3>
                {templateButtonVariables.map((btnVar, idx) => {
                  const btn = templateButtons[btnVar.index];
                  return (
                    <div key={idx} className="flex flex-col mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-[#25D366]/10 text-[#25D366] px-1.5 py-0.5 rounded uppercase tracking-wider">Button {idx + 1} Suffix</span>
                        <span className="text-xs text-gray-500 truncate italic">"{btn?.text}"</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{btn?.url?.replace("{{1}}", "")}</span>
                         <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-[#25D366]"
                          placeholder="Suffix (e.g. order-123)"
                          value={btnVar.url_suffix}
                          onChange={(e) => {
                            const newVars = [...templateButtonVariables];
                            newVars[idx].url_suffix = e.target.value;
                            setTemplateButtonVariables(newVars);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {mediaList.length > 0 && (
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
                  {mediaList.map((item, index) => (
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

            <div className="flex justify-between items-center mt-4 border-t pt-3">

              <label className="cursor-pointer flex items-center gap-2 text-[#075E54]">
                <FaPaperclip />
                Attach Media

                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*,audio/*"
                  multiple
                />
              </label>

              <span className="text-xs text-gray-400">
                {message.length}/5000
              </span>

            </div>

          </div>

        )}

        

      </div>
      


      <div className="flex gap-4 mt-8">

        <button
          onClick={handleSend}
          disabled={loading || uploading}
          className="bg-[#075E54] text-white px-6 py-2 rounded-lg font-semibold"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        

      </div>

      <ContactSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedGroup={selectedGroup === "ALL" ? "All contacts" : selectedGroup}
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

      <InsufficientBalanceModal 
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredAmount={estimatedCost}
        availableBalance={currentBalance}
      />

    </div>
  );
};

export default CreateMessageBox;