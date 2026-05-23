"use client";

import React from 'react';
import CreateMessageHeader from '@/components/saved/CreateMessageHeader';
import CreateMessageBox from '@/components/message/CreateMessageBox';
import MessageHistory from '@/components/message/MessageHistory';

export default function MessagesPage() {
  return (
    <div className="p-6 w-full bg-[#f8faff] min-h-screen">
      {/* WhatsApp Section */}
      <div className="w-full space-y-6">
        <CreateMessageHeader />
        <CreateMessageBox />
        <MessageHistory />
      </div>
    </div>
  );
}