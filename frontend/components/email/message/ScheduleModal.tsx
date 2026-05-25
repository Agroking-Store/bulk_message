"use client";

import React, { useState } from 'react';
import { X, Calendar, Clock as ClockIcon } from "lucide-react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
}

export default function ScheduleModal({ isOpen, onClose, onSchedule }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-[#065A4C]/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-end p-2">
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
           </button>
        </div>
        <div className="px-8 pb-10 flex flex-wrap items-end justify-between gap-6">
          
          {/* Date  */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xl font-bold text-gray-700 mb-2">Schedule Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#065A4C] outline-none transition-all font-medium text-gray-600"
              />
            </div>
          </div>

          {/* Time  */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xl font-bold text-gray-700 mb-2">Schedule Time</label>
            <div className="relative">
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#065A4C] outline-none transition-all font-medium text-gray-600"
              />
            </div>
          </div>

          {/* Recipients & Cost*/}
          <div className="flex items-center border border-green-100 bg-[#F0FDF4] rounded-l px-4 py-2 gap-3">
             <div className="border-r border-green-200 pr-4">
                <p className="text-[10px] text-[#065A4C] font-bold uppercase">Recipients</p>
                <p className="text-xl font-black text-[#065A4C]">0</p>
             </div>
             <div>
                <p className="text-[10px] text-[#065A4C] font-bold uppercase">Est. Cost (Utility)</p>
                <p className="text-xl font-black text-[#065A4C]">₹0.00</p>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSchedule(date, time)}
              disabled={!date || !time}
              className="px-5 py-2 bg-[#065A4C] text-white rounded-l font-bold hover:bg-[#044439] transition-all disabled:opacity-50 shadow-lg shadow-[#065A4C]/20"
            >
              Schedule Message
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}