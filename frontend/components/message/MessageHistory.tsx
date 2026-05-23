"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import ContactsPagination from '../contacts/ContactsPagination';
import { socket } from '@/lib/socket';

const MessageHistory = ({ sourceType = 'message' }: { sourceType?: 'message' | 'campaign' }) => {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 10;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Silently re-fetch history without showing the loading spinner
  const silentRefresh = useCallback(async () => {
    try {
      const data = await apiFetch(`/history?sourceType=${sourceType}&page=${currentPage}&limit=${limit}`);
      const records = data?.records || (Array.isArray(data) ? data : []);
      const totalCount = data?.total || (Array.isArray(data) ? data.length : 0);
      setHistoryData(records);
      setTotal(totalCount);
    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  }, [sourceType, currentPage]);

  // Listen for 'messageSent' custom event from CreateMessageBox
  useEffect(() => {
    const handleMessageSent = () => {
      // Small delay to let backend process the message before fetching
      setTimeout(() => {
        setCurrentPage(1);
        setRefreshKey(prev => prev + 1);
      }, 1500);
    };
    window.addEventListener('messageSent', handleMessageSent);
    return () => window.removeEventListener('messageSent', handleMessageSent);
  }, []);

  // Main data fetch effect
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/history?sourceType=${sourceType}&page=${currentPage}&limit=${limit}`);
        // Backend returns { total, page, limit, records }
        const records = data?.records || (Array.isArray(data) ? data : []);
        const totalCount = data?.total || (Array.isArray(data) ? data.length : 0);

        setHistoryData(records);
        setTotal(totalCount);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Listen for real-time status updates via socket
    socket.on('message-status-updated', (update: any) => {
      setHistoryData((prev) => {
        const exists = prev.some((msg) => msg.messageId === update.messageId);
        if (exists) {
          // Update the status in-place
          return prev.map((msg) =>
            msg.messageId === update.messageId ? { ...msg, status: update.status } : msg
          );
        }
        // Message not in our list (was 'pending' and filtered out) — debounce a silent refresh
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          silentRefresh();
        }, 1000);
        return prev;
      });
    });

    return () => {
      socket.off('message-status-updated');
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sourceType, currentPage, refreshKey, silentRefresh]);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-[#C6F6D5] text-[#22543D]' };
      case 'failed':
        return { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-100 text-red-800' };
      default:
        // 'pending' should be filtered out by backend, but if it leaks, show 'Sending...'
        return { dot: 'bg-blue-400 animate-pulse', text: 'text-blue-500', bg: 'bg-blue-50 text-blue-800' };
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mt-10 border border-[#075E54] rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">
          {sourceType === 'message' ? 'Message History' : 'Campaign Message History'}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#94B6B1]">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Message</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Date</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800 border-r border-[#075E54]/20">Sent to</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-800">Status</th>
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
                      <div className="line-clamp-2" title={row.message}>
                        {row.message}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700 border-r border-gray-100">{new Date(row.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-5 border-r border-gray-100 text-left text-sm text-gray-600">
                      {row.phone || row.contactId || 'N/A'}
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

      <div className="p-4 border-t border-gray-100">
        <ContactsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default MessageHistory;