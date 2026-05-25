"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp, FaUsers, FaBullhorn, FaFile, FaWallet, FaFileAlt } from "react-icons/fa";
import { MdDashboard, MdChat, MdExpandMore, MdExpandLess } from "react-icons/md";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 

interface SidebarProps {
  activesection?: string;
}

export default function Sidebar({ activesection }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-open");
    if (saved) {
      setOpenMenus(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-open", JSON.stringify(openMenus));
    }
  }, [openMenus, mounted]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => 
      prev.includes(name) 
        ? prev.filter((m) => m !== name) 
        : [...prev, name]
    );
  };

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
    { name: "Contacts", icon: <FaUsers />, path: "/contacts" },
    {
      name: "Messages",
      icon: <MdChat />,
      children: [
        { name: "WhatsApp", path: "/message" },
        { name: "Email", path: "/email/message" },
      ],
    },
    {
      name: "Campaigns",
      icon: <FaBullhorn />,
      children: [
        { name: "WhatsApp Campaigns", path: "/campaign" },
        { name: "Email Campaigns", path: "/email/campaign" },
      ],
    },
    {
      name: "Templates",
      icon: <FaFile />,
      children: [
        { name: "WhatsApp Templates", path: "/template" },
        { name: "Email Templates", path: "/email/templates" },
      ],
    },
    { name: "Payments", icon: <FaWallet />, path: "/payments" },
    { name: "Report", icon: <FaFileAlt />, path: "/report" },
  ];

  if (!mounted) {
    return <aside className="fixed top-0 left-0 h-screen w-[260px] bg-[#065A4C] z-50" />;
  }

  return (
    <aside 
      className="fixed top-0 left-0 h-screen w-[260px] bg-[#065A4C] text-white flex flex-col z-50 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx global>{`
        aside::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="bg-white rounded-full p-2 flex-shrink-0">
          <FaWhatsapp className="text-[#25D366] text-4xl" />
        </div>
        <div>
          <h1 className="text-[30px] font-bold text-[#25D366]">
            WhatsApp
          </h1>
          <p className="text-[17px] font-medium text-white/85">
            Bulk Messaging
          </p>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex flex-col px-5 mt-2 gap-0 pb-10 flex-grow">
        {menuItems.map((item) => {
          if (!item.children) {
            const isActive = pathname === item.path || activesection === item.name;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-2 px-2 py-3 rounded-lg transition-colors
                  ${isActive
                    ? "bg-[#127C62] text-white"
                    : "text-white/85 hover:bg-[#127C62]/60"
                  }`}
              >
                <span className="text-[23px]">{item.icon}</span>
                <span className="text-[24px] font-semibold">
                  {item.name}
                </span>
              </Link>
            );
          }

          const isOpen = openMenus.includes(item.name);

          return (
            <div key={item.name}>
              <div
                onClick={() => toggleMenu(item.name)}
                className="flex items-center justify-between px-2 py-4 rounded-lg cursor-pointer hover:bg-[#127C62]/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[23px]">{item.icon}</span>
                  <span className="text-[24px] font-semibold">
                    {item.name}
                  </span>
                </div>
                {isOpen ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {isOpen && (
                <div className="ml-4 flex flex-col border-l border-white/10 pl-1">
                  {item.children.map((child) => {
                    const isActive = pathname === child.path || activesection === child.name;

                    return (
                      <Link
                        key={child.name}
                        href={child.path}
                        className={`px-3 py-1 text-[17px] font-medium whitespace-nowrap rounded-md
                          ${isActive
                            ? "bg-[#127C62] text-white"
                            : "text-white/75 hover:text-white"
                          }`}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}