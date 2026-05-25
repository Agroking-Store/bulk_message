"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Loader2, Search, X, CheckCircle2, Circle } from 'lucide-react';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  group: string;
}

interface ContactSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: string;
  selectedContacts: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const ContactSelectorModal: React.FC<ContactSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  selectedContacts,
  onSelectionChange,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && selectedGroup) {
      fetchContacts();
    }
  }, [isOpen, selectedGroup]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/contacts?group=${encodeURIComponent(selectedGroup)}&limit=1000`);
      const contactsArray = res.records || res.data || [];
      setContacts(contactsArray);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const toggleContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      onSelectionChange(selectedContacts.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedContacts, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredContacts.map((c) => c._id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#075E54] rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Select Contacts from {selectedGroup}</h2>
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Selection Actions */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500 font-medium">
              {selectedContacts.length} selected of {filteredContacts.length} contacts
            </div>
            <div className="flex gap-4">
              <button onClick={selectAll} className="text-[#075E54] font-bold hover:underline">Select All</button>
              <button onClick={deselectAll} className="text-red-500 font-bold hover:underline">Deselect All</button>
            </div>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#075E54]" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Search className="w-8 h-8" />
              </div>
              <p className="font-medium">No contacts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => toggleContact(contact._id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedContacts.includes(contact._id)
                      ? 'border-[#075E54] bg-[#075E54]/5 ring-1 ring-[#075E54]'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-gray-800 truncate">{contact.name}</span>
                    <span className="text-sm text-gray-500">{contact.phone}</span>
                  </div>
                  {selectedContacts.includes(contact._id) ? (
                    <CheckCircle2 className="w-5 h-5 text-[#075E54] shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-200 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#075E54] text-white rounded-xl font-bold hover:bg-[#05463e] shadow-lg shadow-[#075E54]/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactSelectorModal;
