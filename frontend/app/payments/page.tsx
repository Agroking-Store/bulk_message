"use client";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/sidebar";

import AddBalance from "@/components/payments/AddBalance";
import PaymentHistory from "@/components/payments/PaymentHistory";



export default function PaymentsPage() {
  const [serviceType, setServiceType] = useState<'whatsapp' | 'email'>('whatsapp');

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Right Section */}
      <div className="flex-1 flex flex-col ml-64">

        {/* Topbar */}
        <Topbar title="Payments"/>

        {/* Content */}
        <div className="px-8 pt-20 pb-6 overflow-y-auto mt-4">

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-gray-800">
            Payments / Billing
          </h1>

          <p className="text-gray-500 text-sm mb-6">
            Manage subscriptions and payment history
          </p>

          <div className="grid grid-cols-3 gap-6">

  {/* LEFT SIDE (chhota) */}
  <div className="space-y-6">
    <AddBalance serviceType={serviceType} setServiceType={setServiceType} />
  
  </div>

  {/* RIGHT SIDE (bada) */}
  <div className="col-span-2">
    <PaymentHistory serviceType={serviceType} />
  </div>

</div>

        </div>
      </div>
    </div>
  );
}