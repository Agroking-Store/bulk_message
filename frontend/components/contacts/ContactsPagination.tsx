"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ContactsPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const displayTotal = Math.max(1, totalPages);
  const displayCurrent = Math.max(1, currentPage);

  return (
    <div className="flex items-center justify-center mt-6">
      <div className="flex items-center gap-3 bg-white border border-[#075E54] px-4 py-2 rounded-md shadow-sm">
        <button 
          onClick={() => onPageChange(displayCurrent - 1)}
          disabled={displayCurrent <= 1}
          className={`text-gray-600 hover:text-[#075E54] disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
          Page {displayCurrent} of {displayTotal}
        </span>

        <button 
          onClick={() => onPageChange(displayCurrent + 1)}
          disabled={displayCurrent >= displayTotal}
          className={`text-gray-500 hover:text-[#075E54] disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}