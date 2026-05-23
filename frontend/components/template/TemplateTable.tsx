"use client";

import { useState } from "react";
import {
  Eye,
  Edit3,
  Trash2,
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PreviewPanel from "@/components/template/createnewtemplate/PreviewPanel";
import EmailEditor from "@/components/email/message/EmailEditor";

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "APPROVED") {
    return (
      <div className="flex flex-col items-start gap-1">
        <CheckCircle2 size={16} className="text-emerald-500" />
        <span className="text-[11px] font-bold text-emerald-600 uppercase">
          APPROVED
        </span>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Clock size={16} className="text-amber-500" />
        <span className="text-[11px] font-bold text-amber-500 uppercase">
          PENDING
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <XCircle size={16} className="text-red-500" />
      <span className="text-[11px] font-bold text-red-600 uppercase">
        REJECTED
      </span>
    </div>
  );
};

export default function TemplateTable({ templates, onRefresh }: any) {
  const router = useRouter();

  
 const convertTemplateToForm = (template: any) => {
   console.log(
    "TEMPLATE DATA:",
    template.name,
    template.components
  );
  const header = template.components?.find(
    (c: any) => c.type === "HEADER"
  );

  const body = template.components?.find(
    (c: any) => c.type === "BODY"
  );

  const footer = template.components?.find(
    (c: any) => c.type === "FOOTER"
  );

  const buttonsComponent = template.components?.find(
    (c: any) => c.type === "BUTTONS"
  );

  let buttons = {
    type: "NONE",
    ctaType: "URL",
    ctaText: "",
    ctaUrl: "",
    phoneNumber: "",
    quickReplies: [],
  };

  if (buttonsComponent?.buttons?.length) {
    const btn = buttonsComponent.buttons[0];

    if (btn.type === "QUICK_REPLY") {
      buttons = {
        ...buttons,
        type: "QUICK_REPLY",
        quickReplies:
          buttonsComponent.buttons.map(
            (b: any) => b.text
          ),
      };
    }

    if (btn.type === "URL") {
      buttons = {
        ...buttons,
        type: "CTA",
        ctaType: "URL",
        ctaText: btn.text,
        ctaUrl: btn.url,
      };
    }

    if (btn.type === "PHONE_NUMBER") {
      buttons = {
        ...buttons,
        type: "CTA",
        ctaType: "PHONE",
        ctaText: btn.text,
        phoneNumber: btn.phone_number,
      };
    }
  }

  return {
    name: template.name,
    category: template.category,
    language: template.language,

    headerType:
  header?.format ||
  (header?.text ? "TEXT" : "NONE"),
    headerText: header?.text || "",
    media: null,

    body: body?.text || "",

    footer: footer?.text || "",

    buttons,
  };
};

  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleCreateCampaign = (template: any) => {
    const params = new URLSearchParams({
      templateName: template.name,
      templateBody: template.bodyText || "",
      category: template.category,
    });

    router.push(`/campaign?${params.toString()}`);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;

    setDeleting(name);

    try {
      const res = await fetch(
        "http://localhost:4000/template/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Template deleted successfully");

        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };
  const filteredTemplates = templates.filter((item: any) =>
  item.name.toLowerCase().includes(search.toLowerCase()) ||
  item.category.toLowerCase().includes(search.toLowerCase()) ||
  item.language.toLowerCase().includes(search.toLowerCase())
);

  return (
    <>
   

      <div className="overflow-x-auto mt-0 rounded-t-lg shadow-sm border">

        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-[#e6f4ef] text-gray-700 uppercase text-[12px] font-bold">
              <th className="py-4 px-4">Name</th>
              <th className="py-4 px-2">Language</th>
              <th className="py-4 px-2">Category</th>
              <th className="py-4 px-2">Status</th>
              <th className="py-4 px-2">Updated On</th>
              <th className="py-4 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="text-sm bg-white">

            {templates?.length > 0 ? (
              filteredTemplates.map((item: any) => (
                <tr
                  key={`${item.name}-${item.id}`}
                  className="border-b hover:bg-green-50"
                >
                  <td className="py-5 px-4 font-medium">
                    {item.name}
                  </td>

                  <td className="py-5 px-2">
                    {item.language}
                  </td>

                  <td className="py-5 px-2 font-semibold">
                    {item.category}
                  </td>

                  <td className="py-5 px-2">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="py-5 px-2">
  {item.updated_time || item.created_time
    ? new Date(
        item.updated_time || item.created_time
      ).toLocaleString()
    : "-"}
</td>

                  <td className="py-5 px-4">

                    <div className="flex flex-col gap-2 w-40 mx-auto">

                      <div className="flex gap-1">

                        {/* PREVIEW BUTTON */}
                        <button
                          onClick={() =>
                            setSelectedTemplate(
                              convertTemplateToForm(item)
                            )
                          }
                          className="bg-gray-500 hover:bg-gray-700 text-white px-2 py-1.5 rounded flex items-center gap-1 text-[11px] flex-1"
                        >
                          <Eye size={14} />
                          Preview
                        </button>

                        <button
                          className="bg-blue-900 hover:bg-blue-800 text-white px-2 py-1.5 rounded flex items-center gap-1 text-[11px] flex-1"
                        >
                          Edit
                        </button>

                      </div>

                      {item.status === "APPROVED" && (
                        <button
                          onClick={() =>
                            handleCreateCampaign(item)
                          }
                          className="bg-[#087063] hover:bg-[#0b6e63] text-white px-2 py-1.5 rounded text-[11px] font-bold"
                        >
                          <Megaphone size={14} />
                          Create Campaign
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleDelete(item.name)
                        }
                        disabled={deleting === item.name}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-[11px] font-bold"
                      >
                        {deleting === item.name
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-6 text-gray-400"
                >
                  No Templates Found
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>

      {/* PREVIEW MODAL */}

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-[420px]">

            <h2 className="text-lg font-bold mb-4">
              Template Preview
            </h2>

            <PreviewPanel form={selectedTemplate} />

            <button
              onClick={() => setSelectedTemplate(null)}
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>

          </div>

        </div>
      )}

            
            
    </>
  );
}
