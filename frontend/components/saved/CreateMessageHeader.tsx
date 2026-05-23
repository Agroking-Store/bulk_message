// components/CreateMessageHeader.tsx
import { Clock } from "lucide-react";
import Link from "next/link";

export default function CreateMessageHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create Message</h1>
        <p className="text-sm text-gray-500">Write and send messages to your contacts.</p>
      </div>
      <Link href="/scheduleMessage">
        <button className="flex items-center gap-2 px-4 py-2 border border-[#075E54] text-[#075E54] rounded-lg hover:bg-emerald-50 transition-colors">
          <Clock size={18} />
          <span className="font-medium">Schedule Message</span>
        </button>
      </Link>
    </div>
  );
}