"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, Send, Info, AlertTriangle } from "lucide-react";
import { io } from "socket.io-client";
import { notificationsApi } from "@/lib/api/notifications";
import { useUser } from "@/lib/context/UserContext";
import { formatDistanceToNow } from "date-fns";

export default function NotificationPanel() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);

  const removeNotification = async (id: any) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notificationsUpdated'));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Trigger a global event or refresh to update Topbar red dot
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notificationsUpdated'));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  useEffect(() => {
    if (!user?._id && !user?.id) return;

    const userId = user._id || user.id;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const data = await notificationsApi.getNotifications();
        const formatted = data.map((n: any) => ({
          id: n._id,
          type: n.type.toLowerCase(),
          title: n.title,
          desc: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt
        }));
        setNotifications(formatted);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();

    // Listen realtime notifications
    const socket = io("http://localhost:4000", {
      query: { userId }
    });

    socket.on("new-notification", (notification: any) => {
      const newNotification = {
        id: notification._id,
        type: notification.type.toLowerCase(),
        title: notification.title,
        desc: notification.message,
        isRead: false,
        createdAt: notification.createdAt
      };
      setNotifications(prev => [newNotification, ...prev]);

      // Notify Topbar to show red dot
      window.dispatchEvent(new Event('notificationsUpdated'));
    });

    socket.on("remove-campaign-notifications", () => {
      // Re-fetch notifications since some were deleted from DB
      fetchNotifications();
      // Update topbar just in case
      window.dispatchEvent(new Event('notificationsUpdated'));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
        <button
          onClick={handleMarkAllAsRead}
          className="bg-[#075E54] hover:bg-[#087063] text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md active:scale-95"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No system notifications yet.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isSuccess = item.type === "success";
            const isError = item.type === "error";
            const isWarning = item.type === "warning";
            const isInfo = item.type === "info" || item.type === "progress";

            let icon = <Info className="text-blue-600 mt-1" size={24} />;
            let borderColor = "border-blue-200";
            let bgColor = "bg-blue-50";
            let textColor = "text-blue-800";

            if (isSuccess) {
              icon = <CheckCircle className="text-green-600 mt-1" size={24} />;
              borderColor = "border-green-200";
              bgColor = "bg-green-50";
              textColor = "text-green-800";
            } else if (isError) {
              icon = <XCircle className="text-red-600 mt-1" size={24} />;
              borderColor = "border-red-200";
              bgColor = "bg-red-50";
              textColor = "text-red-800";
            } else if (isWarning) {
              icon = <AlertTriangle className="text-orange-600 mt-1" size={24} />;
              borderColor = "border-orange-200";
              bgColor = "bg-orange-50";
              textColor = "text-orange-800";
            }

            return (
              <div
                key={item.id}
                className={`relative border ${borderColor} ${bgColor} p-5 rounded-2xl flex items-start gap-4 transition-all hover:shadow-md ${!item.isRead ? 'ring-2 ring-offset-2 ring-[#075E54]/20' : ''}`}
              >
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  {icon}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-bold text-lg ${textColor}`}>
                      {item.title}
                    </p>
                    <span className="text-xs font-semibold text-gray-500 bg-white/50 px-3 py-1 rounded-full border border-gray-100">
                      {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed font-medium">
                    {item.desc}
                  </p>

                  {item.type === "progress" && (
                    <div className="mt-4 w-full bg-blue-200/50 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[65%] rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.3)]"></div>
                    </div>
                  )}

                  {!item.isRead && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#075E54] rounded-full shadow-[0_0_8px_rgba(7,94,84,0.5)]"></div>
                  )}
                </div>

                <button
                  onClick={() => removeNotification(item.id)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  X
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
