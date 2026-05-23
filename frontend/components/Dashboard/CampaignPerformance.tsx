"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

interface CampaignPerformanceProps {
  data?: any[];
  range: string;
  onRangeChange: (range: string) => void;
}

export default function CampaignPerformance({ data = [], range, onRangeChange }: CampaignPerformanceProps) {
  return (
    <div className="border border-[#065A4C]/30 rounded-2xl p-6 bg-white shadow-sm h-full">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-gray-800 text-xl">
            Messaging Performance
          </h2>
          <p className="text-xs text-gray-500">Comparison between WhatsApp and Email</p>
        </div>

        <div className="relative">
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value)}
            className="appearance-none border border-gray-200 px-4 py-1.5 pr-9 rounded-xl text-sm bg-gray-50 text-gray-700 font-bold outline-none cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">
            ▼
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            dy={10}
            tickFormatter={(value) => {
                if (!value) return '';
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
          />

          {/* WhatsApp Group (Stacked) */}
          <Bar name="WA Sent" dataKey="waSent" stackId="whatsapp" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={20} />
          <Bar name="WA Failed" dataKey="waFailed" stackId="whatsapp" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />

          {/* Email Group (Stacked) */}
          <Bar name="Email Sent" dataKey="emailSent" stackId="email" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={20} />
          <Bar name="Email Failed" dataKey="emailFailed" stackId="email" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}