"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaFilePdf } from "react-icons/fa";
import { Loader2 } from "lucide-react";

interface ReportFiltersProps {
  days: number;
  onDaysChange: (days: number) => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}

export default function ReportFilters({
  days,
  onDaysChange,
  onExportPDF,
  isExporting,
}: ReportFiltersProps) {

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null); 
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: "Today", value: 1 },
    { label: "Last 7 Days", value: 7 },
    { label: "Last 30 Days", value: 30 },
  ];


  useEffect(() => {
    function handleClickOutside(e: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((opt) => opt.value === days);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">

      {/* Dropdown */}
      <div ref={dropdownRef} className="relative w-full md:w-auto">

        {/* Button */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 bg-[#075E54] rounded-lg px-4 py-3 shadow-md cursor-pointer w-[220px] justify-between"
        >
          <FaCalendarAlt className="text-white text-lg" />

          <span className="text-white font-bold whitespace-nowrap">
            {selected?.label}
          </span>

          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 9l5 7 5-7H7z" />
          </svg>
        </div>

        {/* Dropdown List */}
        {open && (
          <div className="absolute left-0 mt-2 w-full bg-[#075E54] rounded-md shadow-lg overflow-hidden z-50">

            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onDaysChange(opt.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHovered(opt.value)}
                onMouseLeave={() => setHovered(null)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200
                  ${
                    hovered === opt.value
                      ? "bg-[#0a7668] text-white"
                      : hovered === null && days === opt.value
                      ? "bg-[#0a7668] text-white font-semibold"
                      : "text-white"
                  }
                `}
              >
                {opt.label}
              </div>
            ))}

          </div>
        )}

      </div>

      {/* PDF Button */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          onClick={onExportPDF}
          disabled={isExporting}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#075E54] text-white border-2 border-[#075E54] px-6 py-2.5 rounded-lg font-bold transition-all text-m shadow-md active:scale-95 ${
            isExporting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isExporting ? (
            <Loader2 className="animate-spin text-lg" />
          ) : (
            <FaFilePdf className="text-lg" />
          )}
          <span>{isExporting ? "Exporting..." : "Export PDF"}</span>
        </button>
      </div>

    </div>
  );
}
