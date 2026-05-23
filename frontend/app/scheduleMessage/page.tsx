"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Topbar";

import SendToBox from "@/components/scheduleMessage/SendToBox";
import ScheduleDateTime from "@/components/scheduleMessage/ScheduleDateTime";
import ScheduledHistory from "@/components/scheduleMessage/ScheduledHistory";

export default function ScheduleMessagePage() {
  const [group, setGroup] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<any[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [templateType, setTemplateType] = useState<"utility" | "marketing">("utility");
  const [templateName, setTemplateName] = useState("");
  const [templateParams, setTemplateParams] = useState<any>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleScheduled = () => {
    setGroup("");
    setMessage("");
    setMedia([]);
    setContactIds([]);
    setTotalRecipients(0);
    setTemplateType("utility");
    setTemplateName("");
    setTemplateParams(undefined);
    setRefreshTrigger((n) => n + 1);
    // Refresh balance in Topbar
    window.dispatchEvent(new Event('walletUpdated'));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-x-hidden">
        <Topbar title="Schedule Message" />

        <div className="pt-26 px-6 space-y-6">
          <SendToBox
            group={group}
            message={message}
            media={media}
            onGroupChange={setGroup}
            onMessageChange={setMessage}
            onMediaChange={setMedia}
            contactIds={contactIds}
            onContactIdsChange={setContactIds}
            onSelectionInfoChange={(info) => setTotalRecipients(info.totalRecipients)}
            templateType={templateType}
            onTemplateTypeChange={setTemplateType}
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            templateParams={templateParams}
            onTemplateParamsChange={setTemplateParams}
          />

          <ScheduleDateTime
            group={group}
            message={message}
            media={media}
            contactIds={contactIds}
            totalRecipients={totalRecipients}
            templateType={templateType}
            templateName={templateName}
            templateParams={templateParams}
            onScheduled={handleScheduled}
          />

          <ScheduledHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}