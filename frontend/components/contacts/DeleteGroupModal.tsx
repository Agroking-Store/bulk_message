"use client";

import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        "http://localhost:4000/contacts/groups",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      const groupNames = data.groups?.map((g: any) => g.name) || [];
      setGroups(groupNames);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) {
      alert("Please select an option");
      return;
    }

    // Dynamic confirm message
    const message =
      selectedGroup === "ALL"
        ? "Are you sure you want to delete ALL contacts?"
        : `Are you sure you want to delete all contacts from "${selectedGroup}" group?`;

    const confirmDelete = confirm(message);

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(
        "http://localhost:4000/contacts/delete-by-group",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group: selectedGroup,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Contacts deleted successfully");

        setSelectedGroup("");

        onSuccess();
        onClose();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[380px] rounded-lg shadow-lg p-6">

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Delete Contacts
        </h2>

        <select
          className="w-full border border-gray-300 px-3 py-2 rounded-md mb-5 focus:outline-none focus:ring-2 focus:ring-red-200"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">
            Select Option
          </option>

          {/* NEW OPTION */}
          <option value="ALL">
            Delete All Contacts
          </option>

          {groups.map((group) => (
            <option key={group} value={group}>
              Delete {group}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>
    </div>
  );
}