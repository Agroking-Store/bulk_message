"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TemplateFormType } from "@/types/template";

import HeaderSection from "@/components/template/createnewtemplate/HeaderSection";
import BodySection from "@/components/template/createnewtemplate/BodySection";
import ButtonSection from "@/components/template/createnewtemplate/ButtonSection";
import PreviewPanel from "@/components/template/createnewtemplate/PreviewPanel";

function EditTemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
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

  const parseMetaComponents = (components: any[]) => {
    const header = components.find((c) => c.type === "HEADER");
    const body = components.find((c) => c.type === "BODY");
    const footer = components.find((c) => c.type === "FOOTER");
    const buttonsGroup = components.find((c) => c.type === "BUTTONS");

    const newForm: Partial<TemplateFormType> = {};

    if (header) {
      newForm.headerType = header.format as any;
      newForm.headerText = header.text || "";
    }

    if (body) {
      newForm.body = body.text || "";
    }

    if (footer) {
      newForm.footer = footer.text || "";
    }

    if (buttonsGroup?.buttons) {
      newForm.buttons = buttonsGroup.buttons.map((b: any) => ({
        type: b.type === "PHONE_NUMBER" ? "PHONE_NUMBER" : b.type,
        text: b.text,
        url: b.url || "",
        phoneNumber: b.phone_number || "",
        example: b.example || ""
      }));
    }

    return newForm;
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      try {
        const res = await fetch("http://localhost:4000/template/all");
        const templates = await res.json();
        const template = templates.find((t: any) => t.id === templateId);

        if (template) {
          const parsed = parseMetaComponents(template.components || []);
          setForm((prev) => ({
            ...prev,
            ...parsed,
            name: template.name,
            category: template.category,
            language: template.language,
          }));
        }
      } catch (err) {
        console.error("Error fetching template:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const buildMetaPayload = () => {
    const components: any[] = [];

    if (form.headerType !== "NONE") {
      const h: any = { type: "HEADER", format: form.headerType };
      if (form.headerType === "TEXT") h.text = form.headerText;
      components.push(h);
    }

    components.push({
      type: "BODY",
      text: form.body?.trim() || "",
    });

    if (form.footer) {
      components.push({
        type: "FOOTER",
        text: form.footer,
      });
    }

    if (form.buttons && form.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: form.buttons.map((btn) => {
          const b: any = {
            type: btn.type,
            text: btn.text,
          };
          if (btn.type === "URL") b.url = btn.url;
          if (btn.type === "PHONE_NUMBER") b.phone_number = btn.phoneNumber;
          return b;
        }),
      });
    }

    return { components };
  };

  const handleUpdate = async () => {
    try {
      if (!form.body || form.body.trim() === "") {
        alert("Template body is required");
        return;
      }

      const payload = buildMetaPayload();

      const res = await fetch(`http://localhost:4000/template/update/${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Backend error");

      alert("Template updated and sent for re-approval!");
      router.push("/template");
    } catch (error: any) {
      alert(error?.message || "Something went wrong");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading template...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-4">
        <h2 className="text-2xl font-bold text-gray-800">Edit WhatsApp Template</h2>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium">
          Editing approved templates requires re-approval from Meta.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Template Name</label>
          <input
            className="w-full border p-2.5 rounded bg-gray-100 cursor-not-allowed font-semibold text-gray-700"
            value={form.name}
            disabled
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
          <select
            className="w-full border p-2.5 rounded bg-white shadow-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
          >
            <option value="UTILITY">UTILITY</option>
            <option value="MARKETING">MARKETING</option>
            <option value="AUTHENTICATION">AUTHENTICATION</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Language</label>
          <select
            className="w-full border p-2.5 rounded bg-white shadow-sm"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option value="en_US">English (US)</option>
            <option value="en_GB">English (UK)</option>
            <option value="hi_IN">Hindi</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-2/3 space-y-6">
          <HeaderSection form={form} setForm={setForm} />
          <BodySection form={form} setForm={setForm} />
          <ButtonSection form={form} setForm={setForm} />

          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={() => router.push("/template")}
              className="px-6 py-2.5 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="bg-[#128C7E] hover:bg-[#075E54] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all"
            >
              Update & Re-submit
            </button>
          </div>
        </div>

        <div className="w-1/3">
          <div className="sticky top-6">
            <PreviewPanel form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditTemplatePage() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <EditTemplateContent />
    </Suspense>
  );
}
