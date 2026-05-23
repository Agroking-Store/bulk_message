"use client";

import React, { useState, useEffect } from 'react';
import ContactsPagination from '../../contacts/ContactsPagination';
import { apiFetch } from '@/lib/api';

const MessageHistory = ({ sourceType = 'message' }: { sourceType?: 'message' | 'campaign' }) => {
  // Frontend State
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/email/history`);
        // The backend returns an array of campaigns directly or a success object with data
        const records = Array.isArray(data) ? data : (data.data || []);

        // Basic filtering if we want to separate message vs campaign (optional for now as backend returns all)
        const filtered = records.filter((r: any) => r.sourceType === sourceType || !r.sourceType);

        setHistoryData(filtered);
        setTotal(filtered.length);
      } catch (error) {
        console.error('Failed to fetch email history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [sourceType, currentPage]);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'delivered':
      case 'triggered':
        return { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-[#C6F6D5]' };
      case 'failed':
      case 'bounced':
        return { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-100' };
      case 'scheduled':
        return { dot: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mt-10 border border-[#075E54] rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">
          Email Message History
        </h3>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#94B6B1]">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Message</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Date</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Sent to</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800">Open rate</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading history...</td>
              </tr>
            ) : historyData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No message history found.</td>
              </tr>
            ) : (
              historyData.map((row, index) => {
                const style = getStatusStyle(row.status);
                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 text-sm text-gray-700 border-r border-gray-100 max-w-[250px]">
                      <div className="line-clamp-2" title={row.subject}>
                        {row.subject}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700 border-r border-gray-100">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 border-r border-gray-100 text-left text-sm text-gray-600">
                      {row.group === 'All contacts' ? 'All' : (row.group || `${row.totalRecipients || 0} Recipients`)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                        <span className={`text-sm font-semibold capitalize ${style.text}`}>
                          {row.status === 'pending' ? 'Sending...' : row.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100">
        <ContactsPagination
          currentPage={currentPage}
          totalPages={totalPages > 0 ? totalPages : 1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default MessageHistory;