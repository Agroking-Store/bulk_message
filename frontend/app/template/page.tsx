"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import ActionButtons from "@/components/template/ActionButtons";
import StatusTabs from "@/components/template/StatusTabs";
import TemplateTable from "@/components/template/TemplateTable";
import Pagination from "@/components/template/Pagination";


export default function WhatsAppTemplatesPage() {

  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 10;

  const fetchTemplates = async () => {
    try {
      const res = await fetch("http://localhost:4000/template/all");
      const data = await res.json();

      console.log(" Templates:", data);
      setTemplates(data || []);

    } catch (err) {
      console.error(" Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTemplates(); 

    const interval = setInterval(() => {
      fetchTemplates();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const counts = {
    all: templates.length,
    approved: templates.filter(t => t.status === "APPROVED").length,
    pending: templates.filter(t => t.status === "PENDING").length,
    rejected: templates.filter(t => (t.status !== "APPROVED" && t.status !== "PENDING")).length,
  };

  const filteredTemplates = templates
  .filter(t => 
    activeTab === "all" 
      ? true 
      : t.status === activeTab || (activeTab === "REJECTED" && t.status !== "APPROVED" && t.status !== "PENDING")
  )
  .filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.language.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredTemplates.length / PAGE_SIZE);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight mt-4">
        WhatsApp Templates
      </h2>

      <ActionButtons />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">

  {/* LEFT - TABS */}
  <StatusTabs 
    counts={counts} 
    activeTab={activeTab} 
    onTabChange={setActiveTab} 
  />

  {/* RIGHT - SEARCH */}
  <div className="relative">
    <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
    <input
      type="text"
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-8 pr-3 py-2 border rounded w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>

</div>
       
        <TemplateTable templates={paginatedTemplates} onRefresh={fetchTemplates} />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredTemplates.length}
          itemsPerPage={PAGE_SIZE}
        />
      </div>
    </div>
  );
}