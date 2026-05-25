"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  Check, 
  UserPlus, 
  Mail,
  ArrowRight,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Image as ImageIcon
} from "lucide-react";
import { useUser } from '@/lib/context/UserContext';
import EmailPreviewModal from "./EmailPreviewModal";
import { whatsappApi } from "@/lib/api/whatsapp";
import ContactSelectorModal from "../../message/ContactSelectorModal";
import MediaPreviewModal from "../../message/MediaPreviewModal";

interface EmailHeaderProps {
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  selectedGroup: string;
  setSelectedGroup: (val: string) => void;
  contactIds: string[];
  setContactIds: (val: string[] | ((prev: string[]) => string[])) => void;
  media: any[];
  setMedia: (val: any[] | ((prev: any[]) => any[])) => void;
  totalRecipients: number;
  setTotalRecipients: (val: number) => void;
}

export default function EmailHeader({ 
  setSubject, 
  subject, 
  body,
  selectedGroup,
  setSelectedGroup,
  contactIds,
  setContactIds,
  media,
  setMedia,
  totalRecipients,
  setTotalRecipients
}: EmailHeaderProps) {
  const { user } = useUser();
  const [senderEmail, setSenderEmail] = useState("Loading...");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMediaPreviewModalOpen, setIsMediaPreviewModalOpen] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<any>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) {
      setSenderEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await whatsappApi.getGroups();
        if (res.status === 'success' && res.data) {
          setGroups(res.data.groups || []);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    let count = 0;
    if (contactIds.length > 0) {
      count = contactIds.length;
    } else if (selectedGroup === "ALL") {
      // Find total contacts from groups
      count = groups.reduce((acc, g) => acc + (g.count || 0), 0);
    } else if (selectedGroup) {
      const g = groups.find(gd => gd.name === selectedGroup);
      count = g ? g.count : 0;
    }
    setTotalRecipients(count);
  }, [selectedGroup, contactIds, groups, setTotalRecipients]);

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

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#065A4C] shadow-lg shadow-[#065A4C]/5 relative">
      
      {/*Top Toolbar */}
      <div className="px-6 py-4 border-b-2 border-[#065A4C]/10 flex justify-between items-center bg-[#065A4C]/5 rounded-t-7xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#065A4C] rounded-xl flex items-center justify-center shadow-md">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[#065A4C]">New Email</h2>
        </div>

        <div className="flex items-center gap-3">
          {/*Preview Button */}
          <button 
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#065A4C] text-[#065A4C] bg-white rounded-xl text-xs font-bold hover:bg-[#065A4C]/10 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      </div>

      <div className="divide-y-2 divide-[#065A4C]/10">
        
        {/*  From */}
        <div className="px-6 py-4 flex items-center gap-4 group">
          <span className="w-20 text-sm font-bold text-[#065A4C]">From</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-medium text-black">{senderEmail}</span>
          </div>
        </div>

        {/* To (Recipients) */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 relative ">
          <span className="w-20 text-sm font-bold text-[#065A4C]">Recipient</span>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
            
            <div className="relative w-full md:w-[400px]">
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 border-[#065A4C] hover:border-[#065A4C] transition-all bg-white shadow-sm"
              >
                <span className={`text-sm ${selectedGroup ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {selectedGroup === "ALL" ? "All Contacts" : selectedGroup || "Select Group or Email Addresses"}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#065A4C] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-[110%] bg-white border-2 border-[#065A4C] shadow-2xl rounded-xl z-[9999] p-1 animate-in fade-in slide-in-from-top-2">
                  <div 
                    onClick={() => { setSelectedGroup("ALL"); setContactIds([]); setIsDropdownOpen(false); }}
                    className="flex items-center justify-between p-3 hover:bg-[#065A4C] hover:text-white rounded-lg cursor-pointer group transition-all text-black"
                  >
                    <span className="text-sm font-bold">All Contacts</span>
                    {selectedGroup === "ALL" && <Check className="w-4 h-4" />}
                  </div>
                  {groups.map((group) => (
                    <div 
                      key={group.name}
                      onClick={() => { setSelectedGroup(group.name); setContactIds([]); setIsDropdownOpen(false); }}
                      className="flex items-center justify-between p-3 hover:bg-[#065A4C] hover:text-white rounded-lg cursor-pointer group transition-all text-black"
                    >
                      <span className="text-sm font-bold">{group.name}</span>
                      {selectedGroup === group.name && <Check className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                if (!selectedGroup) {
                  alert("Please select a group first.");
                  return;
                }
                setIsContactModalOpen(true);
              }}
              className="flex items-center gap-2 text-[#065A4C] text-sm font-black hover:bg-[#065A4C]/5 px-3 py-2 rounded-lg transition-all"
            >
              <UserPlus className="w-4 h-4" /> {contactIds.length > 0 ? `Selected ${contactIds.length}` : "Add Contacts"}
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-[#065A4C] rounded-xl shadow-md">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Recipients:</span>
              <span className="text-sm font-black text-white">{totalRecipients}</span>
          </div>
        </div>

        {/* Subject */}
        <div className="px-6 py-4 flex items-center gap-4 focus-within:bg-[#065A4C]/5 transition-colors rounded-b-2xl">
          <span className="w-20 text-sm font-bold text-[#065A4C]">Subject</span>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this email about?" 
            className="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-300" 
          />
          <ArrowRight className="w-4 h-4 text-[#065A4C]/40" />
        </div>
      </div>

      <ContactSelectorModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        selectedGroup={selectedGroup === "ALL" ? "All contacts" : selectedGroup}
        selectedContacts={contactIds}
        onSelectionChange={setContactIds}
      />

      <EmailPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        data={{ senderEmail, subject, body, selectedTarget: selectedGroup === "ALL" ? "All Contacts" : selectedGroup, media }}
      />
    </div>
  );
}