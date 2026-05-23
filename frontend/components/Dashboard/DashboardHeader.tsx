"use client";
import Link from "next/link";
import { FaPen, FaPaperPlane, FaBolt } from "react-icons/fa"; 

export default function DashboardHeader({ userName = "User" }: { userName?: string }) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="flex justify-between items-start mb-8 w-full">
      
     
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">
          Welcome {firstName} !
        </h1>
        <p className="text-gray-500 text-[16px]">
       Reach your audience smarter with WhatsApp and Email marketing.
        </p>
      </div>


      <Link href="/payments"> 
        <button className="flex items-center gap-2 bg-gradient-to-r from-[#065A4C] to-[#087a67] hover:from-[#054d41] hover:to-[#065A4C] text-white font-medium px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
          <FaBolt className="text-yellow-300" />
          <span>Recharge Now</span>
        </button>
      </Link>

    </div>
  );
}