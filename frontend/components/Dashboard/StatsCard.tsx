import React from "react";

interface Props {
  icon: React.ReactNode;
  title: React.ReactNode;
  value: React.ReactNode;
  percent?: string;
}
export default function StatsCard({ icon, title, value, percent }: Props) {
  return (
    <div className="group border border- border-[#075E54] rounded-2xl p-4 bg-white flex justify-between items-center shadow-sm hover:shadow-md hover: border-[#075E54] transition-all duration-300 cursor-default">
      
      <div className="flex items-center gap-5">
       <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-green-50 text-[#075E54] group-hover:bg-[#087063] group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
  <div>
          <div className="text-gray-600 text-m font-medium tracking-wide">
            {title}
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {value}
            </h2>
            {percent && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                {percent}
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}