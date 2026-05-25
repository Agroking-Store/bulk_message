"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Pencil, Trash, Loader2 } from "lucide-react";
import { contactsApi, Contact } from "@/lib/api/contacts";
import AddContactModal from "./AddContactModal";
import ContactsPagination from "./ContactsPagination";
import { toast } from "sonner";
function getGroupStyle(group: string) {
  const normalizedGroup = group.toLowerCase();
  if (normalizedGroup.includes("customer")) return "bg-green-100 text-green-700 border border-green-200";
  if (normalizedGroup.includes("lead")) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (normalizedGroup.includes("vendor")) return "bg-pink-100 text-pink-700 border border-pink-200";
  if (normalizedGroup.includes("student")) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (normalizedGroup.includes("myfinn")) return "bg-purple-100 text-purple-700 border border-purple-200";

  return "bg-indigo-50 text-indigo-600 border border-indigo-100";
}

export default function ContactsTable({
  refreshTrigger,
  searchTerm
}: {
  refreshTrigger: number;
  searchTerm: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

 
  const latestRequest = useRef(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchContacts();
  }, [refreshTrigger, searchTerm, currentPage]);

  const fetchContacts = async () => {
    const requestId = ++latestRequest.current;

    try {
      if (!contacts.length) setLoading(true); 
      const data = searchTerm
        ? await contactsApi.search(searchTerm, currentPage, limit)
        : await contactsApi.getAll(currentPage, limit);
      
      
      if (requestId !== latestRequest.current) return;

      const records = data?.records || (Array.isArray(data) ? data : []);
      const totalCount = data?.total || (Array.isArray(data) ? data.length : 0);
      
      setContacts(records);
      setTotal(totalCount);
    } catch (err: any) {
      if (requestId !== latestRequest.current) return;
      setError(err.message);
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  };

const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this contact?")) return;

  try {
    await contactsApi.delete(id);
    toast.error("Contact Deleted", { duration: 2000 });

    fetchContacts(); 

  } catch (err: any) {
    toast.error(err.message || "Delete failed");
  }
};

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full min-h-[500px]">
     
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#e6f4ef] text-gray-700">
            <tr>
              <th className="text-left px-4 py-4 w-[30%] rounded-l-xl font-bold">Name</th>
              <th className="text-left px-4 py-4 w-[25%] font-bold">Phone No.</th>
               <th className="text-left px-4 py-4 w-[30%] font-bold">Email ID</th>
              <th className="text-left px-4 py-4 w-[25%] font-bold">Group</th>
              <th className="text-left px-4 py-4 w-[25%] rounded-r-xl font-bold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center h-[300px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                    <span className="text-gray-500 font-medium">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
               <td colSpan={5} className="text-center py-20 text-red-500">{error}</td>
              </tr>
            ) : contacts.length === 0 ? (
               <tr>
                <td colSpan={5} className="text-center py-20 text-gray-500">No contacts found</td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact._id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/profile (2).png"
                        alt={contact.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                      <span className="font-semibold text-gray-800">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#075E54] font-bold">{contact.phone}</td>

<td className="px-4 py-4 text-gray-600">
  {contact.email || "-"}   
</td>

<td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider ${getGroupStyle(contact.group || "")}`}>
                      {contact.group || "NO GROUP"}
                    </span>
                  </td>
         <td className="px-4 py-4 text-center align-middle">
  <div className="flex items-center justify-center w-full gap-4">

    {/* EDIT BUTTON */}

    <button
      onClick={() => {
        setSelectedContact(contact);
        setIsEditModalOpen(true);
      }}
      className="
        p-2
        text-gray-700
        hover:text-gray-900
        hover:bg-gray-100
        rounded-lg
        transition-colors
      "
    >
      <Pencil size={17} />
    </button>

    {/* DELETE BUTTON */}

    <button
      onClick={() => contact._id && handleDelete(contact._id)}
      className="
        p-2
        text-red-500
        hover:text-red-700
        hover:bg-red-50
        rounded-lg
        transition-colors
      "
    >
      <Trash size={16} />
    </button>

  </div>
</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContactsPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AddContactModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
        }}
        onSuccess={fetchContacts}
        initialData={selectedContact}
      />
    </div>
  );
}