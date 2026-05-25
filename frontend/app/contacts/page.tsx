"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";
import ContactsHeader from "@/components/contacts/ContactsHeader";
import ContactsTable from "@/components/contacts/ContactsTable";

export default function ContactsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-white overflow-y-scroll">
      {/* Sidebar */}
      <Sidebar />

      
      <div className="flex-1 flex flex-col ml-64 pt-20">
       
        <Topbar title="Contacts" />

       
        <main className="p-6">
          <ContactsHeader
            onRefresh={handleRefresh}
            onSearch={setSearchTerm}
          />

          <div className="bg-white border border-[#075E54] rounded-lg p-6 mt-6 shadow-sm">
            <ContactsTable
              refreshTrigger={refreshTrigger}
              searchTerm={searchTerm}
            />
          </div>
        </main>
      </div>
    </div>
  );
}