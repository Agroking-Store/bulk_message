"use client";

import { Bell, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/context/UserContext";
import { notificationsApi } from "@/lib/api/notifications";
import { apiFetch } from "@/lib/api";

export default function Topbar({ title }: { title?: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [hasUnread, setHasUnread] = useState(false);
  const [balances, setBalances] = useState<{ whatsapp: number; email: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      setIsRefreshing(true);
      const res = await apiFetch("/wallet/balances");
      if (res.status === 'success') {
        setBalances(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch balances", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [user]);

  const checkUnread = async () => {
    if (!user) return;
    try {
      const notifications = await notificationsApi.getNotifications();
      const unread = notifications.some((n: any) => !n.isRead);
      setHasUnread(unread);
    } catch (err) {
      console.error("Failed to check unread notifications", err);
    }
  };

  useEffect(() => {
    checkUnread();
    fetchBalance();

    const handleUpdate = () => checkUnread();
    const handleWalletUpdate = () => fetchBalance();

    window.addEventListener('notificationsUpdated', handleUpdate);
    window.addEventListener('walletUpdated', handleWalletUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate);
      window.removeEventListener('walletUpdated', handleWalletUpdate);
    };
  }, [user, fetchBalance]);

  return (
    <div className="fixed top-0 left-[260px] right-0 z-50 flex justify-between items-center bg-[#065A4C] p-3 shadow-sm border-b border-[#075E54]">

      <h1 className="text-3xl font-bold text-white pl-2">
        {title}
      </h1>

      <div className="flex items-center gap-6 pr-14">

        {/* Balance Widgets */}
        {user && balances && (
          <div className="flex gap-4">
            {/* WhatsApp Balance */}
            <div
              className="flex flex-col items-center border border-white/30 rounded-2xl px-4 py-1 min-w-[150px] bg-white/10 hover:bg-white/20 transition-colors cursor-pointer group relative mt-[-2px]"
              onClick={fetchBalance}
              title="Click to refresh WhatsApp balance"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white uppercase tracking-wider font-medium">WhatsApp Balance</span>
                <RefreshCcw size={10} className={`text-white/70 group-hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-[16px] font-bold text-white mt-[-2px]">
                ₹ {balances.whatsapp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Email Balance */}
            <div
              className="flex flex-col items-center border border-white/30 rounded-2xl px-4 py-1 min-w-[150px] bg-white/10 hover:bg-white/20 transition-colors cursor-pointer group relative mt-[-2px]"
              onClick={fetchBalance}
              title="Click to refresh Email balance"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white uppercase tracking-wider font-medium">Email Balance</span>
                <RefreshCcw size={10} className={`text-white/70 group-hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-[16px] font-bold text-white mt-[-2px]">
                ₹ {balances.email.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Bell icon */}
        <div
          onClick={() => router.push("/notifications")}
          className="relative cursor-pointer text-white hover:text-[#087063] hover:bg-green-50 p-2 rounded-full transition-all active:scale-90"
        >
          <Bell size={30} />
          {hasUnread && (
            <span className="absolute top-2 right-2 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <div className="text-left flex flex-col justify-center">
            <h2 className="font-bold text-[20px] text-white capitalize">
              {userLoading ? "Loading..." : (user?.name || "Admin")}
            </h2>
            <p className="text-[14px] text-white font-semibold mt-[-2px]">
              Welcome Back !
            </p>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden rounded-full w-12 h-12 border border-[#087063]">
            <img
              onClick={() => router.push("/profile")}
              src={userLoading ? "/profile.png" : (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:4000${user.avatar}`) : "/profile (2).png")}
              className="w-full h-full scale-120 block border-none outline-none hover:scale-100 block border-none outline-none"
              alt="User Profile"
            />
          </div>
        </div>
      </div>
    </div>
  );
}