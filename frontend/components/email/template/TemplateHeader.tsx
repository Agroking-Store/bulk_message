"use client";

export default function TemplateHeader({ name, setName }: { name: string, setName: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">

      <input
        type="text"
        placeholder="Template Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="
          border
          border-[#075E54]
          rounded-lg
          px-4
          py-2
          w-full
        "
      />

    </div>
  );
}