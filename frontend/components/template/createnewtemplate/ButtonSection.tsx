import { TemplateButton, TemplateFormType } from "@/types/template";
import { useState } from "react";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";

type Props = {
  form: TemplateFormType;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormType>>;
};

export default function ButtonSection({ form, setForm }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  const addButton = (type: TemplateButton["type"], defaultText: string) => {
    if (form.buttons.length >= 10) return;
    
    // Limits based on Meta Documentations
    // Max 3 QUICK_REPLY
    if (type === "QUICK_REPLY" && form.buttons.filter(b => b.type === "QUICK_REPLY").length >= 3) {
       alert("Max 3 Custom (Quick Reply) buttons allowed.");
       return;
    }
    // Only 1 COPY_CODE
    if (type === "COPY_CODE" && form.buttons.some(b => b.type === "COPY_CODE")) {
       alert("Only 1 Copy Code button allowed.");
       return;
    }

    const newBtn: TemplateButton = {
      type,
      text: defaultText,
      url: type === "URL" ? "" : undefined,
      phoneNumber: type === "PHONE_NUMBER" ? "" : undefined,
      example: type === "COPY_CODE" ? "" : undefined,
    };

    setForm({ ...form, buttons: [...form.buttons, newBtn] });
    setShowDropdown(false);
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const newButtons = [...form.buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setForm({ ...form, buttons: newButtons });
  };

  const removeButton = (index: number) => {
    const newButtons = form.buttons.filter((_, i) => i !== index);
    setForm({ ...form, buttons: newButtons });
  };

  return (
    <div className="border border-[#075E54] p-5 rounded-xl bg-white shadow-sm pb-10">
      <h3 className="font-semibold text-lg mb-1">Buttons (Optional)</h3>
      <p className="text-gray-500 text-sm mb-4">
        Customers respond to your message or take action. You can add up to ten buttons. If you add more than three buttons, they will appear in a list.
      </p>

      <div className="space-y-4">
        {form.buttons.map((btn, index) => (
          <div key={index} className="flex gap-4 border border-gray-200 p-4 rounded-lg bg-gray-50 items-start shadow-sm">
            <div className="mt-2 text-gray-400 cursor-move">
              <GripVertical size={20} />
            </div>
            
            <div className="flex-1 space-y-4">
               {/* Header of Button Block */}
               <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 text-sm bg-white px-2 py-1 border rounded shadow-sm">
                     {btn.type === "QUICK_REPLY" && "Custom"}
                     {btn.type === "URL" && "Visit website"}
                     {btn.type === "PHONE_NUMBER" && "Call Phone Number"}
                     {btn.type === "COPY_CODE" && "Copy offer code"}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeButton(index)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
               
               {/* Button Fields */}
               <div>
                 <label className="text-xs font-semibold text-gray-600 block mb-1">Button Text (Max 25 chars) *</label>
                 <input 
                   className="w-full border p-2 rounded focus:outline-none focus:border-[#075E54]"
                   value={btn.text}
                   maxLength={25}
                   onChange={(e) => updateButton(index, { text: e.target.value })}
                   placeholder="e.g. Visit us"
                 />
               </div>

               {btn.type === "URL" && (
                 <div>
                   <label className="text-xs font-semibold text-gray-600 block mb-1">Website URL *</label>
                   <input 
                     className="w-full border p-2 rounded focus:outline-none focus:border-[#075E54]"
                     value={btn.url || ""}
                     onChange={(e) => updateButton(index, { url: e.target.value })}
                     placeholder="https://example.com/{{1}}"
                   />
                   <p className="text-[10px] text-gray-500 mt-1">You can add 1 variable like {"{{1}}"} at the end.</p>
                 </div>
               )}

               {btn.type === "PHONE_NUMBER" && (
                 <div>
                   <label className="text-xs font-semibold text-gray-600 block mb-1">Phone Number (with Country Code) *</label>
                   <input 
                     className="w-full border p-2 rounded focus:outline-none focus:border-[#075E54]"
                     value={btn.phoneNumber || ""}
                     onChange={(e) => updateButton(index, { phoneNumber: e.target.value.replace(/[^0-9+ ]/g, "") })}
                     placeholder="+91 9876543210"
                   />
                 </div>
               )}

               {btn.type === "COPY_CODE" && (
                 <div>
                   <label className="text-xs font-semibold text-gray-600 block mb-1">Offer Code *</label>
                   <input 
                     className="w-full border p-2 rounded focus:outline-none focus:border-[#075E54]"
                     value={btn.example || ""}
                     onChange={(e) => updateButton(index, { example: e.target.value })}
                     maxLength={15}
                     placeholder="e.g. DISCOUNT20"
                   />
                 </div>
               )}

            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-4 inline-block">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={form.buttons.length >= 10}
          className={`flex items-center gap-2 border px-4 py-2 rounded-md font-medium shadow-sm transition ${
             form.buttons.length >= 10 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-gray-100/50 hover:bg-gray-100 border-gray-300 text-gray-700"
          }`}
        >
          + Add button <ChevronDown size={16} />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-lg py-2 z-10">
            <button 
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-3"
              onClick={() => addButton("QUICK_REPLY", "Custom Button")}
            >
              <kbd className="bg-gray-100 border text-gray-400 px-1 rounded text-[10px]">C</kbd>
              Custom
            </button>
            <button 
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-3"
              onClick={() => addButton("URL", "Visit Website")}
            >
              <kbd className="bg-gray-100 border text-gray-400 px-1 rounded text-[10px]">W</kbd>
              Visit website
            </button>
            <button 
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-3"
              onClick={() => addButton("PHONE_NUMBER", "Call Us")}
            >
              <kbd className="bg-gray-100 border text-gray-400 px-1 rounded text-[10px]">P</kbd>
              Call Phone Number
            </button>
            <button 
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-3"
              onClick={() => addButton("COPY_CODE", "Copy Code")}
            >
              <kbd className="bg-gray-100 border text-gray-400 px-1 rounded text-[10px]">O</kbd>
              Copy offer code
            </button>
          </div>
        )}
        
        {showDropdown && (
            <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)}></div>
        )}
      </div>
    </div>
  );
}