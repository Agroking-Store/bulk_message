"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateFormType } from "@/types/template";
import { toast } from "sonner";


import HeaderSection from "@/components/template/createnewtemplate/HeaderSection";
import BodySection from "@/components/template/createnewtemplate/BodySection";
import ButtonSection from "@/components/template/createnewtemplate/ButtonSection";
import PreviewPanel from "@/components/template/createnewtemplate/PreviewPanel";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<TemplateFormType>({
    name: "",
    category: "UTILITY",
    language: "en_US",

    headerType: "NONE",
    headerText: "",
    media: null,

    body: "",
    footer: "",

    variableValues: [],

    buttons: [],
  });

  const getPreviewText = () => {
    let text = form.body || "";
    const variables = text.match(/\{\{\d+\}\}/g) || [];

    variables.forEach((v, index) => {
      const value = form.variableValues[index] || `[${v}]`;
      text = text.replace(v, value);
    });

    return text;
  };

  const uploadMediaFirst = async (): Promise<string | null> => {
    if (!form.media || ["NONE", "TEXT"].includes(form.headerType)) return null;

    const formData = new FormData();
    formData.append("file", form.media);
    formData.append("type", form.headerType);

    const res = await fetch("http://localhost:4000/template/upload-media", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to upload media to Meta.");
    }
    return data.h;
  };

  const buildMetaPayload = (headerHandle: string | null) => {
    const components: any[] = [];

    // HEADER
    if (form.headerType !== "NONE") {
      const headerComp: any = { type: "HEADER", format: form.headerType };

      if (form.headerType === "TEXT") {
        headerComp.text = form.headerText;
      } else if (headerHandle) {
        headerComp.example = { header_handle: [headerHandle] };
      }
      components.push(headerComp);
    }

    // BODY
    const bodyComponent: any = {
      type: "BODY",
      text: form.body?.trim()
    };

    if (form.variableValues && form.variableValues.length > 0) {
      bodyComponent.example = {
        body_text: [form.variableValues],
      };
    }
    components.push(bodyComponent);

    // FOOTER
    if (form.footer) {
      components.push({ type: "FOOTER", text: form.footer });
    }

    // BUTTONS
    if (form.buttons && form.buttons.length > 0) {
      const metaButtons = form.buttons.map(btn => {
        if (btn.type === "QUICK_REPLY") {
          return { type: "QUICK_REPLY", text: btn.text };
        }
        if (btn.type === "URL") {
          const btnObj: any = { type: "URL", text: btn.text, url: btn.url };
          if (btn.url?.includes("{{")) {
            btnObj.example = ["example"];
          }
          return btnObj;
        }
        if (btn.type === "PHONE_NUMBER") {
          return { type: "PHONE_NUMBER", text: btn.text, phone_number: btn.phoneNumber };
        }
        if (btn.type === "COPY_CODE") {
          return { type: "COPY_CODE", example: btn.example };
        }
        return null;
      }).filter(Boolean);

      components.push({
        type: "BUTTONS",
        buttons: metaButtons,
      });
    }

    return {
      name: form.name,
      category: form.category,
      language: form.language,
      components,
    };
  };

  const validateForm = () => {
    if (!/^[a-z0-9_]+$/.test(form.name)) {
      return "Template name must be lowercase, numbers, and underscores only.";
    }
    if (form.name.length > 512) {
      return "Template name exceeds 512 characters.";
    }
    if (!form.body || form.body.trim() === "") {
      return "Body text is required.";
    }

    if (form.variableValues.length !== [...new Set(form.body.match(/\{\{\d+\}\}/g) || [])].length) {
      return "Please provide sample values for all variables.";
    }

    if (form.headerType === "TEXT" && !form.headerText) {
      return "Header text is required when TEXT header is selected.";
    }

    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) && !form.media) {
      return "Media file is required for the selected header type.";
    }

    // Validate buttons dynamically
    if (form.buttons.length > 0) {
      for (let i = 0; i < form.buttons.length; i++) {
        const b = form.buttons[i];
        if (!b.text && b.type !== "COPY_CODE") return `Button #${i + 1} text is required.`;
        if (b.type === "URL" && !b.url) return `Button #${i + 1} Website URL is required.`;
        if (b.type === "PHONE_NUMBER" && !b.phoneNumber) return `Button #${i + 1} Phone number is required.`;
        if (b.type === "COPY_CODE" && !b.example) return `Button #${i + 1} require an Offer Code example.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      const errorMsg = validateForm();
      if (errorMsg) {
        toast.error(errorMsg);
        return;
      }

      setIsSubmitting(true);
      toast.loading("Preparing template...");

      // 1. Upload Media
      let headerHandle: string | null = null;
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) && form.media) {
        toast.loading("Uploading media to Meta...", { id: "media-uploading" });
        headerHandle = await uploadMediaFirst();
        toast.dismiss("media-uploading");
      }

      // 2. Build Payload
      const payload = buildMetaPayload(headerHandle);

      // 3. Submit
      toast.loading("Submitting template for approval...", { id: "submitting" });
      const res = await fetch("http://localhost:4000/template/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      toast.dismiss("submitting");

      if (!res.ok) throw new Error(data?.message || "Backend error");
      if (!data.success) throw new Error(data?.message || "Meta API error");

      toast.success("Template sent for approval 🚀");
      setTimeout(() => router.push("/template"), 1500);

      setTimeout(() => {
        router.push("/template");
      }, 1000);

    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Something went wrong", { id: "submitting" });
      toast.dismiss("media-uploading");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mt-4">
        Create WhatsApp Template
      </h2>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name (Lowercase & _) *</label>
          <input
            className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] w-full cursor-text"
            placeholder="e.g. order_update_1"
            value={form.name}
            maxLength={512}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              })
            }
          />
          {form.name && !/^[a-z0-9_]+$/.test(form.name) && (
            <p className="text-red-500 text-xs mt-1">Only lowercase letters, numbers, underscore allowed</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#075E54] w-full bg-white"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
          >
            <option value="UTILITY">UTILITY</option>
            <option value="MARKETING">MARKETING</option>
            <option value="AUTHENTICATION">AUTHENTICATION</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
          <select
            className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#075E54] w-full bg-white"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option value="en_US">English (US)</option>
            <option value="en_GB">English (UK)</option>
            <option value="hi_IN">Hindi</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-2/3 space-y-6">
          <HeaderSection form={form} setForm={setForm} />
          <BodySection form={form} setForm={setForm} />
          <ButtonSection form={form} setForm={setForm} />

          <div className="flex gap-4 pt-4 border-t border-gray-200 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-gray-300 px-6 py-2 rounded text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded font-medium text-white transition ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#128C7E] hover:bg-[#075E54]"}`}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <PreviewPanel
            form={{
              ...form,
              body: getPreviewText(),
            }}
          />
        </div>
      </div>
    </div>
  );
}