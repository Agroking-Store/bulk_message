import { TemplateFormType } from "@/types/template";
import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { Smile, Bold, Italic, Strikethrough, Code } from "lucide-react";

type Props = {
  form: TemplateFormType;
  setForm: React.Dispatch<React.SetStateAction<TemplateFormType>>;
};

export default function BodySection({ form, setForm }: Props) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [variableError, setVariableError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validateVariables = (text: string) => {
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    const numbers = matches.map((m) => parseInt(m.replace(/\D/g, ""), 10));

    if (numbers.length > 0) {
      if (numbers[0] !== 1) {
        setVariableError("Variables must start with {{1}}");
        return false;
      }
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          setVariableError("Variables must be sequential with no skips (e.g., {{1}}, {{2}}).");
          return false;
        }
      }
    }

    const invalidTextVars = text.match(/\{\{([a-zA-Z_]+)\}\}/g);
    if (invalidTextVars && invalidTextVars.length > 0) {
      setVariableError("Text variables like {{name}} are not allowed.");
      return false;
    }

    setVariableError("");
    return true;
  };

  const handleBodyChange = (val: string) => {
    validateVariables(val);
    setForm({ ...form, body: val });
  };

  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.body;
    const selectedText = text.substring(start, end);

    const newBody = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    
    handleBodyChange(newBody);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const addVariable = () => {
    const matches = form.body.match(/\{\{(\d+)\}\}/g) || [];
    const nextVar = matches.length + 1;
    insertTextAtCursor(`{{${nextVar}}}`);
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    insertTextAtCursor(emojiObject.emoji);
    setShowEmoji(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === textareaRef.current) {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'b':
              e.preventDefault();
              insertTextAtCursor('*', '*');
              break;
            case 'i':
              e.preventDefault();
              insertTextAtCursor('_', '_');
              break;
            case 's':
              e.preventDefault();
              insertTextAtCursor('~', '~');
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form.body]);

  const variables = form.body.match(/\{\{\d+\}\}/g) || [];
  const uniqueVariables = [...new Set(variables)];

  const handleVariableChange = (index: number, value: string) => {
    const updated = [...(form.variableValues || [])];
    updated[index] = value;
    setForm({ ...form, variableValues: updated });
  };

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Body</h3>
        <span className="text-xs text-gray-500">{form.body.length}/1024</span>
      </div>

      <div className="relative border rounded-lg focus-within:ring-2 focus-within:ring-[#075E54] focus-within:border-transparent transition-all">
        <textarea
          ref={textareaRef}
          className="w-full p-3 outline-none h-32 resize-none rounded-t-lg bg-gray-50/50"
          placeholder="Hello {{1}}, your order is confirmed"
          value={form.body}
          maxLength={1024}
          onChange={(e) => handleBodyChange(e.target.value)}
        />
        
        <div className="flex items-center gap-1 border-t px-3 py-2 bg-gray-50 rounded-b-lg text-gray-600">
          <button 
            type="button" 
            onClick={() => setShowEmoji(!showEmoji)} 
            className="hover:text-black hover:bg-gray-200 p-1.5 rounded transition"
            title="Add Emoji"
          >
            <Smile size={18} />
          </button>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>

          <button 
            type="button" 
            onClick={() => insertTextAtCursor('*', '*')} 
            className="hover:text-black hover:bg-gray-200 p-1.5 rounded transition font-serif font-bold text-sm"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button 
            type="button" 
            onClick={() => insertTextAtCursor('_', '_')} 
            className="hover:text-black hover:bg-gray-200 p-1.5 rounded transition font-serif italic text-sm"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button 
            type="button" 
            onClick={() => insertTextAtCursor('~', '~')} 
            className="hover:text-black hover:bg-gray-200 p-1.5 rounded transition line-through text-sm"
            title="Strikethrough (Ctrl+S)"
          >
            S
          </button>
          <button 
            type="button" 
            onClick={() => insertTextAtCursor('```', '```')} 
            className="hover:text-black hover:bg-gray-200 p-1.5 rounded transition font-mono text-sm"
            title="Monospace"
          >
            &lt;/&gt;
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1"></div>

          <button
            type="button"
            onClick={addVariable}
            className="hover:bg-gray-200 px-2 py-1 text-sm rounded transition ml-auto font-medium"
          >
            + Add variable
          </button>
        </div>
      </div>

      {showEmoji && (
        <div className="absolute z-10 bottom-16 left-5 shadow-xl">
          <div className="fixed inset-0 z-0" onClick={() => setShowEmoji(false)}></div>
          <div className="relative z-10">
            <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={350} searchDisabled />
          </div>
        </div>
      )}

      {variableError && (
        <p className="text-red-500 text-sm mt-2">{variableError}</p>
      )}

      {uniqueVariables.length > 0 && (
        <div className="mt-4 bg-yellow-50/50 p-3 rounded border border-yellow-200">
          <p className="text-sm text-gray-700 font-medium mb-2">
            Variable Samples
          </p>
          <div className="space-y-2">
            {uniqueVariables.map((v, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">{v}</span>
                <input
                  className="border p-1 w-full rounded text-sm px-2 focus:outline-none focus:border-[#075E54]"
                  placeholder={`Example for ${v} (e.g. John)`}
                  value={form.variableValues?.[index] || ""}
                  onChange={(e) => handleVariableChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <h4 className="mt-5 font-medium mb-1">Footer (Optional)</h4>
      <div className="relative">
        <input
          className="border p-2 w-full rounded focus:outline-none focus:border-[#075E54]"
          placeholder="Add a short line of text to the bottom of your message"
          value={form.footer}
          maxLength={60}
          onChange={(e) => {
             const val = e.target.value.replace(/\{\{.*\}\}/g, "");
             setForm({ ...form, footer: val });
          }}
        />
        <span className="absolute right-2 top-2.5 text-xs text-gray-400">{form.footer.length}/60</span>
      </div>
    </div>
  );
}