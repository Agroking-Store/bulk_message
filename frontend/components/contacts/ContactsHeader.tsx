"use client";

import { useState } from "react";
import { Upload, Search, Plus, Trash2 } from "lucide-react";
import AddContactModal from "./AddContactModal";
import UploadCSVModal from "./UploadCSVModal";
import DeleteGroupModal from "./DeleteGroupModal";

export default function ContactsHeader({
  onRefresh,
  onSearch
}: {
  onRefresh: () => void;
  onSearch: (val: string) => void;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  
  const [debounceTimer, setDebounceTimer] = useState<any>(null);

  const handleSearch = (val: string) => {
    setSearchTerm(val);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(val);
    }, 500);

    setDebounceTimer(timer);
  };

  return (
    <div className="flex flex-col mb-5">
      <div className="mb-3">
        <p className="text-lg font-sm text-gray-500">
          Manage your Contacts easily
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 border border-[#075E54] text-[#075E54] px-4 py-2 rounded-md text-sm hover:bg-green-50 transition-all font-medium"
          >
            <Upload size={16} />
            Upload CSV
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[260px]">
            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search Numbers, Names..."
              className="w-full border border-[#075E54] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] transition-all"
              value={searchTerm}
              onChange={(e) =>
                handleSearch(e.target.value)
              }
            />
          </div>

          <button
            onClick={() =>
              setIsDeleteModalOpen(true)
            }
            className="flex items-center gap-2 border border-[#E65A54] bg-[#E65A54] text-white px-4 py-2 rounded-md text-sm hover:bg-[#d94c45] transition-all font-medium"
          >
            <Trash2 size={16} />
            Delete Group
          </button>

          <button
            onClick={() =>
              setIsAddModalOpen(true)
            }
            className="flex items-center gap-2 bg-[#087063] text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition-all font-medium"
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() =>
          setIsAddModalOpen(false)
        }
        onSuccess={onRefresh}
      />

      <UploadCSVModal
        isOpen={isUploadModalOpen}
        onClose={() =>
          setIsUploadModalOpen(false)
        }
        onSuccess={onRefresh}
      />

      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() =>
          setIsDeleteModalOpen(false)
        }
        onSuccess={onRefresh}
      />
    </div>
  );
}