"use client";

import { useState } from "react";
import { Trash, Pencil } from "lucide-react";
import AddContactModal from "@/components/contacts/AddContactModal";
import Link from 'next/link';
import { contactsApi } from "@/lib/api/contacts";

interface Contact {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  group?: string;
  tags?: string[];
}

interface ContactListProps {
  contacts?: Contact[];
  onRefresh?: () => void;
}

export default function ContactList({ contacts = [], onRefresh }: ContactListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedContact(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await contactsApi.delete(id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete contact");
    }
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  return (
    <div className="border border-[#075E54] rounded-lg p-5 bg-white">
     
      <div className="flex justify-between items-center mb-4 text-xl">
        <h2 className="font-semibold">Contact List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#075E54] text-white px-4 py-1 text-[16px] rounded font-semibold"
          >
            + Add New
          </button>

          <Link href="/contacts">
            <button
              className="bg-[#075E54] text-white px-4 py-1 text-[16px] rounded font-semibold"
            >
              View All
            </button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-m">
          <thead className="bg-[#e6f4ef] text-gray-700">
            <tr>
              <th className="p-2 text-left font-bold">Name</th>
              <th className="p-2 text-center font-bold">Phone No.</th>
              <th className="p-2 text-center font-bold">Email</th>
              <th className="p-2 text-center font-bold">Group</th>
              <th className="p-2 text-center font-bold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
           {contacts.slice(0, 5).map((c, i) => (
              <tr key={c._id || i} className="hover:bg-gray-50/50 transition group">
                <td className="flex items-center gap-2 p-3">
                  <img
                    src="/profile (2).png"
                    className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    alt={c.name}
                  />
                  <span className="font-semibold text-gray-800">{c.name}</span>
                </td>

                <td className="p-3 text-center text-[#075E54] font-bold">{c.phone}</td>
                <td className="p-3 text-center text-gray-700">
  {c.email || "-"}
</td>

                <td className="p-3 text-center">
                  <span className="text-green-700 px-2 py-1 rounded-md text-s font-medium bg-green-50">
                    {c.group || (c.tags && c.tags[0]) || "General"}
                  </span>
                </td>

                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 text-gray-400 hover:text-[#075E54] hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Contact"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      onClick={() => c._id && handleDelete(c._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Contact"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                  No recent contacts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

     
      {(isAddModalOpen || isEditModalOpen) && (
        <AddContactModal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedContact(null);
          }}
          onSuccess={handleSuccess}
          initialData={selectedContact}
        />
      )}
    </div>
  );
}
