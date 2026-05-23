"use client";
import React, { useEffect, useState } from "react";
import { FaUsers, FaUserTie, FaUserShield, FaUserEdit } from "react-icons/fa";
import { reportsApi } from "@/lib/api/reports";
import { Loader2 } from "lucide-react";

import { socket } from "@/lib/socket";

export default function GroupPerformance() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = () => {
    reportsApi.getGroups()
      .then(res => {
        const total = res.reduce((acc: number, curr: any) => acc + curr.count, 0);
        const mapped = res.map((g: any, i: number) => {
          const icons = [<FaUsers />, <FaUserTie />, <FaUserShield />, <FaUserEdit />];
          const colors = ["text-green-600", "text-blue-600", "text-purple-600", "text-orange-600"];
          const bgs = ["bg-green-600", "bg-blue-600", "bg-purple-600", "bg-orange-600"];

          return {
            name: g.name,
            count: g.count.toLocaleString(),
            icon: icons[i % icons.length],
            color: colors[i % colors.length],
            bg: bgs[i % bgs.length],
            width: total > 0 ? `${(g.count / total) * 100}%` : "0%"
          };
        });
        setGroups(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      fetchGroups();
    };

    socket.on("campaign-progress", handleUpdate);
    socket.on("message-status-updated", handleUpdate);

    return () => {
      socket.off("campaign-progress", handleUpdate);
      socket.off("message-status-updated", handleUpdate);
    };
  }, []);

  return (
    <div id="group-distribution-chart" className="border-[#075E54] border-2 rounded-lg bg-white overflow-hidden shadow-md flex flex-col h-full">
      <div className="p-4 border-b-2 border-[#075E54] bg-gray-50 text-left">
        <h2 className="font-bold text-lg text-black">Group distribution</h2>
      </div>
      <div className="p-5 flex-1 space-y-7 relative max-h-[300px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-[#075E54]" size={32} />
          </div>
        ) : (
          groups.map((g, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${g.color}`}>{g.icon}</span>
                  <span className="font-bold text-gray-700 text-sm">{g.name}</span>
                </div>
                <span className="font-bold text-gray-900">{g.count}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full border border-gray-200 overflow-hidden">
                <div
                  className={`${g.bg} h-full rounded-full transition-all duration-700`}
                  style={{ width: g.width }}
                ></div>
              </div>
            </div>
          ))
        )}
        {!loading && groups.length === 0 && (
          <p className="text-center text-gray-500 py-10">No contact groups found</p>
        )}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #075E54;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}