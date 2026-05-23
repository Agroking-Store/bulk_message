"use client";

interface StatusTabsProps {
  counts: {
    all: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function StatusTabs({ counts, activeTab, onTabChange }: StatusTabsProps) {
  const tabs = [
    { label: "All", count: counts.all, key: "all" },
    { label: "Approved", count: counts.approved, key: "APPROVED" },
    { label: "Pending", count: counts.pending, key: "PENDING" },
    { label: "Rejected", count: counts.rejected, key: "REJECTED" },
  ];

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg w-fit">

      {tabs.map((tab) => (

        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeTab === tab.key 
              ? "bg-[#087063] text-white shadow-md" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label} ({tab.count})
        </button>

      ))}

    </div>
  );
}