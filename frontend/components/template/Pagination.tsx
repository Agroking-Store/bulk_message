"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage = 10 
}: PaginationProps) {
  
  const displayTotal = Math.max(1, totalPages);
  const displayCurrent = Math.max(1, currentPage);

  // Calculate inclusive range for display (e.g., 1 to 10 of 37)
  const startItem = totalItems === 0 ? 0 : (displayCurrent - 1) * itemsPerPage + 1;
  const endItem = Math.min(displayCurrent * itemsPerPage, totalItems || 0);

  return (
    <div className="flex flex-col items-center justify-center mt-8 gap-4">
      <div className="flex items-center gap-3 bg-white border border-[#128C7E] px-4 py-2 rounded-md shadow-sm">
        <button 
          onClick={() => onPageChange(displayCurrent - 1)}
          disabled={displayCurrent <= 1}
          className="text-gray-400 hover:text-[#128C7E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-sm text-gray-700 font-medium whitespace-nowrap min-w-[100px] text-center">
          Page {displayCurrent} of {displayTotal}
        </span>

        <button 
          onClick={() => onPageChange(displayCurrent + 1)}
          disabled={displayCurrent >= displayTotal}
          className="text-gray-600 hover:text-[#128C7E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {totalItems !== undefined && (
        <p className="text-xs text-gray-400 font-medium">
          Showing {startItem} to {endItem} of {totalItems} templates
        </p>
      )}
    </div>
  );
}