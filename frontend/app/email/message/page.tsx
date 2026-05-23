"use client";

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/Topbar';
import EmailHeader from '@/components/email/message/EmailHeader';
import EmailEditor from '@/components/email/message/EmailEditor';
import { Send, Paperclip, X, Clock, ChevronLeft, ChevronRight, Eye, Trash2, FileText, Video, Image as ImageIcon } from "lucide-react";
import { FaClock } from "react-icons/fa";
import Link from 'next/link';
import MediaPreviewModal from '@/components/message/MediaPreviewModal';
import { apiFetch } from '@/lib/api';
import InsufficientBalanceModal from '@/components/payments/InsufficientBalanceModal';
import MessageHistory from '@/components/email/message/MessageHistory';

export default function EmailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [isMediaPreviewModalOpen, setIsMediaPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | undefined>(undefined);
  const [requiredAmount, setRequiredAmount] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    const fetchInitialBalance = async () => {
      try {
        const res = await apiFetch("/wallet/balance");
        if (res && typeof res.data?.balance === 'number') {
          setCurrentBalance(res.data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch initial balance:", err);
      }
    };
    fetchInitialBalance();
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalCost = (totalRecipients * 0.10).toFixed(2);

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

      setMedia(prev => [...prev, ...newMedia]);
    } catch (err: any) {
      alert("Failed to upload some media files: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (!subject || !body || (!selectedGroup && contactIds.length === 0)) {
      alert("Please provide a subject, message, and at least one recipient.");
      return;
    }

    // Proactive balance check
    if (currentBalance !== undefined && currentBalance < parseFloat(totalCost)) {
      setRequiredAmount(parseFloat(totalCost));
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          subject,
          body,
          group: selectedGroup,
          contactIds,
          media
        })
      });

      if (response.ok) {
        alert("Email campaign triggered successfully!");
      } else {
        const err = await response.json();
        const errMsg = err.message || JSON.stringify(err);

        if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("balance")) {
          try {
            const balanceRes = await apiFetch("/wallet/balance");
            if (balanceRes && typeof balanceRes.data?.balance === 'number') {
              setCurrentBalance(balanceRes.data.balance);
            }
          } catch (bErr) {
            console.error("Failed to fetch balance for modal:", bErr);
          }
          setRequiredAmount(parseFloat(totalCost));
          setIsBalanceModalOpen(true);
          return;
        }

        alert("Failed to send email: " + (err.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("An error occurred while sending the email.");
    }
  };

  const handleScheduleEmail = async () => {
    if (!subject || !body || (!selectedGroup && contactIds.length === 0)) {
      alert("Please provide a subject, message, and at least one recipient.");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      alert("Please select both a date and a time to schedule the email.");
      return;
    }

    // Proactive balance check
    if (currentBalance !== undefined && currentBalance < parseFloat(totalCost)) {
      setRequiredAmount(parseFloat(totalCost));
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/email/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          subject,
          body,
          group: selectedGroup,
          contactIds,
          media,
          scheduledAt,
          sourceType: 'message'
        })
      });

      if (response.ok) {
        alert("Email scheduled successfully!");
        setIsModalOpen(false);
      } else {
        const err = await response.json();
        alert("Failed to schedule email: " + (err.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error scheduling email:", error);
      alert("An error occurred while scheduling the email.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8faff]">
      <Sidebar />

      <div className="flex-1 ml-[260px] flex flex-col min-w-0 overflow-x-hidden">
        <Topbar title='Message' />

        <main className="p-6 mt-20 space-y-4 animate-in fade-in duration-500 w-full max-w-full min-w-0">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Create Email</h1>
              <p className="text-sm text-gray-500">Write and send emails to your users.</p>
            </div>

            <div className="relative">
              {/* Trigger Button  */}
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="flex items-center gap-2 bg-[#065A4C] text-white px-5 py-2 rounded-md hover:opacity-90 transition shadow font-medium"
              >
                <FaClock /> Schedule Message
              </button>
              {isModalOpen && (
                <div className="absolute right-0 mt-3 w-[380px] bg-white border-2 border-[#065A4C] rounded-2xl shadow-2xl z-[110] p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-5">
                    <h3 className="font-bold text-xl text-[#1e293b] border-b pb-3 text-left">Schedule Details</h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2 text-left">Schedule Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-[#065A4C] text-gray-700"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2 text-left">Schedule Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-[#065A4C] text-gray-700"
                      />
                    </div>

                    <div className="flex bg-[#F1F8F7] border border-[#D1E7E4] rounded-xl p-4 justify-between items-center">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Recipients</p>
                        <p className="text-2xl font-bold text-[#065A4C]">{totalRecipients}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Est. Cost</p>
                        <p className="text-2xl font-bold text-[#065A4C]">₹{totalCost}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        className="w-full py-4 bg-[#065A4C] text-white rounded-xl font-bold text-lg hover:bg-[#044439] transition-all shadow-md"
                        onClick={handleScheduleEmail}
                      >
                        Schedule Message
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-2 text-gray-500 font-bold hover:text-red-500 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Container */}
          <div className="border border-[#065A4C]/30 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-4">
              <EmailHeader
                subject={subject}
                setSubject={setSubject}
                body={body}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                contactIds={contactIds}
                setContactIds={setContactIds}
                media={media}
                setMedia={setMedia}
                totalRecipients={totalRecipients}
                setTotalRecipients={setTotalRecipients}
              />
            </div>

            <div className="px-4">
              <div className="flex gap-6 border-b border-gray-100 mb-[-1]">
                <button className="pb-7 text-[#065A4C] font-bold text-lg mt-4 ">
                  Write email
                </button>
              </div>
              <div className="pb-4 space-y-4">
                <EmailEditor content={body} setBody={setBody} />

                {media.length > 0 && (
                  <div className="p-4 bg-[#065A4C]/5 border-t border-b border-[#065A4C]/10 animate-in slide-in-from-bottom-2 duration-300 relative group/carousel min-w-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="text-xs font-black text-[#065A4C] uppercase tracking-widest">Attached Media ({media.length})</span>
                    </div>

                    <div className="relative flex items-center min-w-0">
                      <button
                        onClick={() => scroll('left')}
                        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-xl border-2 border-[#065A4C]/20 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#065A4C] hover:text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 scroll-smooth w-full max-w-full"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {media.map((item, index) => (
                          <div
                            key={index}
                            className="flex-shrink-0 relative w-32 h-32 rounded-2xl border-2 border-white bg-white group/item overflow-hidden shadow-sm hover:border-[#065A4C] hover:shadow-lg transition-all duration-300"
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              {item.type === 'image' ? (
                                <img
                                  src={item.url}
                                  alt="media"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                                />
                              ) : (
                                <div className="transition-transform duration-500 group-hover/item:scale-110">
                                  {getMediaIcon(item.type, item.originalName)}
                                </div>
                              )}
                            </div>

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPreviewMedia(item);
                                    setIsMediaPreviewModalOpen(true);
                                  }}
                                  className="p-2 bg-white rounded-xl text-[#065A4C] hover:bg-[#065A4C] hover:text-white transition-all transform hover:scale-110"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeMedia(index)}
                                  className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[#065A4C] text-white text-[9px] rounded-lg font-black uppercase shadow-sm">
                              {item.originalName?.split('.').pop() || item.type}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => scroll('right')}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-xl border-2 border-[#065A4C]/20 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-[#065A4C] hover:text-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border-t border-gray-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSendEmail}
                  className="bg-[#065A4C] hover:bg-[#044439] text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 text-sm transition-all active:scale-95 shadow-xl shadow-[#065A4C]/10"
                >
                  Send Email <Send className="w-4 h-4" />
                </button>


                <label className="cursor-pointer flex items-center gap-2 text-[#065A4C] hover:text-[#044439] px-3 py-2 font-black text-sm transition-all group">
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

              <Link
                href="/dashboard"
                className="text-red-500 hover:text-red-700 font-black text-xs flex items-center gap-1 transition-colors px-3 py-2"
              >
                <X className="w-4 h-4" /> Cancel Message
              </Link>
            </div>
          </div> 
           <div className="mt-1 border border-[#065A4C]/30 rounded-2xl bg-white shadow-sm p-2"> <MessageHistory /> </div>
        </main>
      </div>
      
      <MediaPreviewModal
        isOpen={isMediaPreviewModalOpen}
        onClose={() => setIsMediaPreviewModalOpen(false)}
        url={selectedPreviewMedia?.url || ""}
        type={selectedPreviewMedia?.type || ""}
        originalName={selectedPreviewMedia?.originalName}
      />

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredAmount={requiredAmount}
        availableBalance={currentBalance}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}