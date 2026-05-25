"use client";

import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      
      
      <aside className="w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </aside>

      
      <main className="flex-1 ml-64 min-h-screen flex flex-col min-w-0 overflow-x-hidden">
        
        
        <Topbar title="Message" />

       
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-20">
          {children}
        </div>
      </main>
    </div>
  );
}